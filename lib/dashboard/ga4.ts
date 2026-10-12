import "server-only";
import { createSign } from "node:crypto";
import { unstable_cache } from "next/cache";
import { itemKey } from "./item-key";
import { PERIOD_KEYS, type Ga4Snapshot, type Ga4Totals, type PeriodKey } from "./types";

/**
 * Google Analytics 4 through the Data API, with a service account that has
 * Viewer access to the property and nothing else: GA4_PROPERTY_ID (the
 * property's number, not the G- id) and GA4_SERVICE_ACCOUNT (the key file's
 * JSON, as pasted, or base64 of it). The account's key signs a one-hour token
 * request here (RS256 JWT); the token stays in this instance's memory and is
 * never logged. Days are the property's own (Cairo), whole days ending
 * yesterday, matching the Shopify tiles. Every report that fails hides only
 * its own panel, with the reason, for the owner.
 */
const LOG = "[dashboard/ga4]";
const TIMEOUT_MS = 15_000;
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

/** The storefront's own events (lib/client/analytics.ts) and the ones Shopify's Google & YouTube app sends from checkout. */
export const FUNNEL_EVENTS = ["page_view", "view_item", "add_to_cart", "view_cart", "checkout_click", "begin_checkout", "add_shipping_info", "add_payment_info", "purchase", "search", "finder_complete", "whatsapp_click", "checkout_error", "generate_lead"];
const VITALS = ["LCP", "INP", "CLS", "FCP", "TTFB"];

type Account = { email: string; key: string };
type Env = { property: string | null; account: Account | null; missing: string[]; problem: string | null };

function readEnv(): Env {
  const property = (process.env.GA4_PROPERTY_ID ?? "").trim().replace(/^properties\//, "");
  const raw = (process.env.GA4_SERVICE_ACCOUNT ?? "").trim();
  const missing = [!property && "GA4_PROPERTY_ID", !raw && "GA4_SERVICE_ACCOUNT"].filter((v): v is string => Boolean(v));
  if (missing.length) return { property: null, account: null, missing, problem: null };
  if (!/^\d{6,}$/.test(property)) return { property: null, account: null, missing, problem: "GA4_PROPERTY_ID must be the property's number (GA4 > Admin > Property details), not the G- measurement id." };
  try {
    const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const j = JSON.parse(text) as { client_email?: string; private_key?: string };
    if (!j.client_email || !j.private_key) throw new Error("fields");
    return { property, account: { email: j.client_email, key: j.private_key.replace(/\\n/g, "\n") }, missing, problem: null };
  } catch {
    return { property: null, account: null, missing, problem: "GA4_SERVICE_ACCOUNT is not a service account key: paste the whole JSON key file from Google Cloud." };
  }
}

export const ga4Configured = () => readEnv().property !== null;

class Ga4Error extends Error {
  constructor(
    readonly kind: string,
    readonly status: number,
    readonly detail = "",
  ) {
    super(kind);
  }
}

function messageFor(e: unknown): string {
  const err = e instanceof Ga4Error ? e : new Ga4Error("internal", 0);
  switch (err.kind) {
    case "bad_key":
      return "Google did not accept the service account key. Make a new JSON key for the service account and paste it into GA4_SERVICE_ACCOUNT in Vercel.";
    case "no_access":
      return "The service account can't read this GA4 property. In GA4 > Admin > Property access management, add the service account's email as a Viewer.";
    case "api_off":
      return "The Google Analytics Data API is off for the service account's Google Cloud project. Turn it on: Google Cloud > APIs & Services > Library > Google Analytics Data API > Enable.";
    case "quota":
      return "GA4 asked the dashboard to wait (daily or hourly quota). The figures come back by themselves.";
    case "timeout":
    case "unreachable":
      return "Google Analytics could not be reached just now. The dashboard tries again at the next refresh.";
    case "bad_request":
      return `GA4 refused the report: ${err.detail}`.slice(0, 300);
    default:
      return `Google Analytics answered with an error (HTTP ${err.status}). It usually passes.`;
  }
}

async function post(url: string, headers: Record<string, string>, body: string): Promise<Response> {
  try {
    return await fetch(url, { method: "POST", headers, body, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new Ga4Error(e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? "timeout" : "unreachable", 0);
  }
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

let token: { value: string; expiresAt: number; email: string } | null = null;

async function accessToken(a: Account): Promise<string> {
  if (token && token.email === a.email && Date.now() < token.expiresAt) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({ iss: a.email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }))}`;
  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(unsigned).sign(a.key, "base64url");
  } catch {
    throw new Ga4Error("bad_key", 0);
  }
  const res = await post(
    "https://oauth2.googleapis.com/token",
    { "Content-Type": "application/x-www-form-urlencoded" },
    new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }).toString(),
  );
  const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
  if (!res.ok || !body?.access_token) {
    console.error(`${LOG} token refused`, { status: res.status, error: body?.error ?? null });
    throw new Ga4Error("bad_key", res.status);
  }
  token = { value: body.access_token, email: a.email, expiresAt: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 300) * 1000 };
  return token.value;
}

type Report = { dimensionHeaders?: { name: string }[]; metricHeaders?: { name: string }[]; rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] };
type Row = { dims: string[]; m: Record<string, number> };

async function call<T>(env: { property: string; account: Account }, method: "runReport" | "batchRunReports", body: unknown): Promise<T> {
  const t = await accessToken(env.account);
  const res = await post(
    `https://analyticsdata.googleapis.com/v1beta/properties/${env.property}:${method}`,
    { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    JSON.stringify(body),
  );
  const json = (await res.json().catch(() => null)) as (T & { error?: { message?: string; status?: string } }) | null;
  if (!res.ok || !json) {
    const status = json?.error?.status ?? "";
    const message = json?.error?.message ?? "";
    if (res.status === 401) token = null;
    const kind =
      res.status === 401 ? "bad_key" : res.status === 429 || status === "RESOURCE_EXHAUSTED" ? "quota" : /SERVICE_DISABLED|has not been used|is disabled/i.test(message) ? "api_off" : res.status === 403 ? "no_access" : res.status === 400 ? "bad_request" : `http_${res.status}`;
    throw new Ga4Error(kind, res.status, message);
  }
  return json;
}

const rowsOf = (r: Report | undefined): Row[] => {
  const mh = (r?.metricHeaders ?? []).map((h) => h.name);
  return (r?.rows ?? []).map((row) => ({
    dims: (row.dimensionValues ?? []).map((d) => d.value),
    m: Object.fromEntries(mh.map((name, i) => [name, Number(row.metricValues?.[i]?.value ?? 0) || 0])),
  }));
};

/* Date ranges in the property's days, ending yesterday (the same whole days as the Shopify tiles). */
const CUR: Record<PeriodKey, { startDate: string; endDate: string; name: string }> = {
  "7": { startDate: "7daysAgo", endDate: "yesterday", name: "p7" },
  "30": { startDate: "30daysAgo", endDate: "yesterday", name: "p30" },
  "90": { startDate: "90daysAgo", endDate: "yesterday", name: "p90" },
};
const PREV: Record<PeriodKey, { startDate: string; endDate: string; name: string }> = {
  "7": { startDate: "14daysAgo", endDate: "8daysAgo", name: "q7" },
  "30": { startDate: "60daysAgo", endDate: "31daysAgo", name: "q30" },
  "90": { startDate: "180daysAgo", endDate: "91daysAgo", name: "q90" },
};
const LAST30 = [{ startDate: "30daysAgo", endDate: "yesterday" }];
const TOTAL_METRICS = ["sessions", "totalUsers", "newUsers", "engagedSessions", "engagementRate", "averageSessionDuration", "screenPageViews"].map((name) => ({ name }));
const inList = (field: string, values: string[]) => ({ filter: { fieldName: field, inListFilter: { values } } });
const bySessions = [{ metric: { metricName: "sessions" }, desc: true }];

const totalsOf = (m: Record<string, number> | undefined): Ga4Totals => ({
  sessions: m?.sessions ?? 0,
  users: m?.totalUsers ?? 0,
  newUsers: m?.newUsers ?? 0,
  engaged: m?.engagedSessions ?? 0,
  engagementRate: m?.engagementRate ?? null,
  avgSeconds: m?.averageSessionDuration ?? null,
  views: m?.screenPageViews ?? 0,
});

/** "/products/divina?utm_source=ig" → "/products/divina": one row per page, whatever the ad tags. */
const pathOnly = (p: string) => (p.split("?")[0] || "/").replace(/\/+$/, "") || "/";

async function read(): Promise<Ga4Snapshot> {
  const now = new Date();
  const env = readEnv();
  const snap: Ga4Snapshot = { state: "error", failure: null, fetchedAt: now.toISOString(), periods: {}, daily: [], channels: [], sources: [], landings: [], devices: [], stepsByDevice: {}, items: [], inApp: null, vitals: null, hidden: [] };
  if (!env.property || !env.account) {
    snap.state = env.problem ? "error" : "off";
    snap.failure = { kind: env.problem ? "bad_settings" : "not_configured", message: env.problem ?? `Google Analytics isn't connected. Add ${env.missing.join(" and ")} in Vercel, then redeploy.` };
    return snap;
  }
  const e = { property: env.property, account: env.account };
  type Batch = { reports?: Report[] };
  try {
    const [a, b] = await Promise.all([
      call<Batch>(e, "batchRunReports", {
        requests: [
          { dateRanges: [CUR["7"], CUR["30"], CUR["90"], PREV["7"]], metrics: TOTAL_METRICS },
          { dateRanges: [PREV["30"], PREV["90"]], metrics: TOTAL_METRICS },
          { dateRanges: [CUR["7"], CUR["30"], CUR["90"]], dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList("eventName", FUNNEL_EVENTS) },
          { dateRanges: [{ startDate: "90daysAgo", endDate: "yesterday" }], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "ecommercePurchases" }], orderBys: [{ dimension: { dimensionName: "date" } }] },
          { dateRanges: LAST30, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "ecommercePurchases" }, { name: "purchaseRevenue" }], orderBys: bySessions },
        ],
      }),
      call<Batch>(e, "batchRunReports", {
        requests: [
          { dateRanges: LAST30, dimensions: [{ name: "sessionSourceMedium" }], metrics: [{ name: "sessions" }, { name: "ecommercePurchases" }], orderBys: bySessions, limit: 10 },
          { dateRanges: LAST30, dimensions: [{ name: "landingPage" }], metrics: [{ name: "sessions" }, { name: "engagementRate" }, { name: "addToCarts" }, { name: "ecommercePurchases" }], orderBys: bySessions, limit: 40 },
          { dateRanges: LAST30, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "sessions" }, { name: "engagementRate" }, { name: "checkouts" }, { name: "ecommercePurchases" }], orderBys: bySessions },
          { dateRanges: LAST30, dimensions: [{ name: "eventName" }, { name: "deviceCategory" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList("eventName", ["checkout_click", "begin_checkout", "add_shipping_info", "add_payment_info", "purchase"]) },
          { dateRanges: LAST30, dimensions: [{ name: "itemName" }], metrics: [{ name: "itemsViewed" }, { name: "itemsAddedToCart" }, { name: "itemsCheckedOut" }, { name: "itemsPurchased" }, { name: "itemRevenue" }], limit: 100 },
        ],
      }),
    ]);
    const [totals, prevTotals, events, daily, channels] = a.reports ?? [];
    const [sources, landings, devices, steps, items] = b.reports ?? [];

    // With several date ranges GA4 adds a last "dateRange" dimension naming each row's range.
    const byRange = (r: Report | undefined) => new Map(rowsOf(r).map((row) => [row.dims.at(-1) ?? "", row]));
    const cur = byRange(totals);
    const prev = new Map([...byRange(totals), ...byRange(prevTotals)]);
    const ev = rowsOf(events);
    for (const k of PERIOD_KEYS) {
      const row = cur.get(CUR[k].name);
      if (!row) continue;
      const before = prev.get(PREV[k].name);
      snap.periods[k] = {
        totals: totalsOf(row.m),
        prev: before ? totalsOf(before.m) : null,
        events: Object.fromEntries(ev.filter((r) => r.dims[1] === CUR[k].name).map((r) => [r.dims[0], r.m.eventCount ?? 0])),
      };
    }
    snap.daily = rowsOf(daily).map((r) => ({ d: `${r.dims[0].slice(0, 4)}-${r.dims[0].slice(4, 6)}-${r.dims[0].slice(6, 8)}`, sessions: r.m.sessions ?? 0, purchases: r.m.ecommercePurchases ?? 0 }));
    snap.channels = rowsOf(channels).map((r) => ({ channel: r.dims[0], sessions: r.m.sessions ?? 0, engaged: r.m.engagedSessions ?? 0, purchases: r.m.ecommercePurchases ?? 0, revenue: r.m.purchaseRevenue ?? 0 }));
    snap.sources = rowsOf(sources).map((r) => ({ source: r.dims[0], sessions: r.m.sessions ?? 0, purchases: r.m.ecommercePurchases ?? 0 }));
    const pages = new Map<string, { sessions: number; engagedTotal: number; addToCarts: number; purchases: number }>();
    for (const r of rowsOf(landings)) {
      const page = pathOnly(r.dims[0] || "/");
      if (page === "(not set)") continue;
      const p = pages.get(page) ?? { sessions: 0, engagedTotal: 0, addToCarts: 0, purchases: 0 };
      p.sessions += r.m.sessions ?? 0;
      p.engagedTotal += (r.m.engagementRate ?? 0) * (r.m.sessions ?? 0);
      p.addToCarts += r.m.addToCarts ?? 0;
      p.purchases += r.m.ecommercePurchases ?? 0;
      pages.set(page, p);
    }
    snap.landings = [...pages.entries()]
      .map(([page, p]) => ({ page, sessions: p.sessions, engagementRate: p.sessions ? p.engagedTotal / p.sessions : 0, addToCarts: p.addToCarts, purchases: p.purchases }))
      .sort((x, y) => y.sessions - x.sessions)
      .slice(0, 12);
    snap.devices = rowsOf(devices).map((r) => ({ device: r.dims[0], sessions: r.m.sessions ?? 0, engagementRate: r.m.engagementRate ?? 0, checkouts: r.m.checkouts ?? 0, purchases: r.m.ecommercePurchases ?? 0 }));
    for (const r of rowsOf(steps)) (snap.stepsByDevice[r.dims[0]] ??= {})[r.dims[1]] = r.m.eventCount ?? 0;
    const merged = new Map<string, Ga4Snapshot["items"][number]>();
    for (const r of rowsOf(items)) {
      if (!r.dims[0] || r.dims[0] === "(not set)") continue;
      const key = itemKey(r.dims[0]);
      const it = merged.get(key) ?? { name: r.dims[0].replace(/\s+[-–—]\s+.*$/, "").trim(), views: 0, adds: 0, checkouts: 0, purchases: 0, revenue: 0 };
      it.views += r.m.itemsViewed ?? 0;
      it.adds += r.m.itemsAddedToCart ?? 0;
      it.checkouts += r.m.itemsCheckedOut ?? 0;
      it.purchases += r.m.itemsPurchased ?? 0;
      it.revenue += r.m.itemRevenue ?? 0;
      merged.set(key, it);
    }
    snap.items = [...merged.values()].sort((x, y) => y.views - x.views);
  } catch (err) {
    console.error(`${LOG} reports failed`, err instanceof Ga4Error ? { kind: err.kind, status: err.status } : String(err));
    snap.state = "error";
    snap.failure = { kind: err instanceof Ga4Error ? err.kind : "internal", message: messageFor(err) };
    return snap;
  }

  // The site's own parameters (in_app on page views, rating on page-speed events) need registering as custom dimensions in GA4 first; until then each hides alone.
  const [inApp, vitals] = await Promise.allSettled([
    call<Report>(e, "runReport", { dateRanges: LAST30, dimensions: [{ name: "customEvent:in_app" }], metrics: [{ name: "sessions" }, { name: "checkouts" }, { name: "ecommercePurchases" }] }),
    call<Report>(e, "runReport", { dateRanges: LAST30, dimensions: [{ name: "eventName" }, { name: "customEvent:rating" }], metrics: [{ name: "eventCount" }], dimensionFilter: inList("eventName", VITALS) }),
  ]);
  const registerHint = (param: string, what: string) =>
    `Register "${param}" as an event-scoped custom dimension (GA4 > Admin > Custom definitions > Create, event parameter ${param}) to see ${what}. Figures start from the day it is registered.`;
  if (inApp.status === "fulfilled") {
    snap.inApp = rowsOf(inApp.value)
      .filter((r) => r.dims[0] !== "(not set)")
      .map((r) => ({ inApp: /^(1|true)$/i.test(r.dims[0]) ? "Instagram / Facebook app" : "Other browsers", sessions: r.m.sessions ?? 0, checkouts: r.m.checkouts ?? 0, purchases: r.m.ecommercePurchases ?? 0 }));
  } else snap.hidden.push({ panel: "In-app browser split", reason: inApp.reason instanceof Ga4Error && inApp.reason.kind === "bad_request" ? registerHint("in_app", "Instagram's in-app browser apart from others") : messageFor(inApp.reason) });
  if (vitals.status === "fulfilled") {
    const by = new Map<string, { metric: string; good: number; needsWork: number; poor: number }>();
    for (const r of rowsOf(vitals.value)) {
      const v = by.get(r.dims[0]) ?? { metric: r.dims[0], good: 0, needsWork: 0, poor: 0 };
      if (r.dims[1] === "good") v.good += r.m.eventCount ?? 0;
      else if (r.dims[1] === "needs-improvement") v.needsWork += r.m.eventCount ?? 0;
      else if (r.dims[1] === "poor") v.poor += r.m.eventCount ?? 0;
      by.set(r.dims[0], v);
    }
    snap.vitals = VITALS.map((m) => by.get(m)).filter((v): v is NonNullable<typeof v> => Boolean(v) && v!.good + v!.needsWork + v!.poor > 0);
  } else snap.hidden.push({ panel: "Page speed from real visitors", reason: vitals.reason instanceof Ga4Error && vitals.reason.kind === "bad_request" ? registerHint("rating", "how fast pages load for real visitors") : messageFor(vitals.reason) });

  snap.state = snap.hidden.length ? "partial" : "ok";
  return snap;
}

const passes = (kind: string | undefined) => !!kind && ["quota", "timeout", "unreachable"].includes(kind);
class Passing extends Error {
  constructor(readonly snap: Ga4Snapshot) {
    super(`ga4: ${snap.failure?.message ?? "failed for a moment"}`);
  }
}

/** GA4 updates its figures a few times an hour at most: read every 30 minutes. */
const cachedRead = unstable_cache(
  async () => {
    const snap = await read();
    if (snap.state === "error" && passes(snap.failure?.kind)) throw new Passing(snap);
    return snap;
  },
  ["dash-ga4-v1", process.env.VERCEL_DEPLOYMENT_ID ?? "local"],
  { revalidate: 1800, tags: ["dash-data", "dash-ga4"] },
);

export async function getGa4Snapshot(): Promise<Ga4Snapshot> {
  try {
    return await cachedRead();
  } catch (e) {
    if (e instanceof Passing) return e.snap;
    console.error(`${LOG} unexpected failure`, e instanceof Error ? e.message : String(e));
    return { state: "error", failure: { kind: "internal", message: "Google Analytics could not be read just now." }, fetchedAt: new Date().toISOString(), periods: {}, daily: [], channels: [], sources: [], landings: [], devices: [], stepsByDevice: {}, items: [], inApp: null, vitals: null, hidden: [] };
  }
}
