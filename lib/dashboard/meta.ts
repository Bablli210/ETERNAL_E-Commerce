import "server-only";
import { unstable_cache } from "next/cache";
import { addDays, daysBetween, fullDays, prevDays, SHOP_TZ, ymdIn } from "./dates";
import { graphGet, graphList, MetaError, metaToken, newRun, nextPage, rowsOf, type GraphBody, type MetaRun } from "./meta-graph";
import {
  PERIOD_KEYS,
  type CampaignRow,
  type Failure,
  type MetaAds,
  type MetaAdsTier,
  type MetaPixelTier,
  type MetaSlowTier,
  type MetaSnapshot,
  type MetaTier,
  type Range,
  type TierState,
} from "./types";

/**
 * The dashboard's Meta source: ad figures, pixel counts, event match quality
 * and custom audiences, read with the read-only system user key
 * (META_ACCESS_TOKEN). It is split into three tiers that age differently:
 * ads every 10 minutes (spend moves through the day), pixel every hour (its
 * counts come in hourly buckets) and the slow tier every 6 hours. All three
 * sit in Next's data cache, shared by every viewer and every period, so
 * opening the page never costs Meta calls of its own. Nothing here throws:
 * every outcome is a tier whose state and failure say what happened.
 */

/**
 * The ad account and the dataset ("My Eternal"). The env overrides exist
 * because Meta cannot change an ad account's time zone in place: it closes
 * the account and opens a new one with a new id.
 */
const AD_ACCOUNT = `act_${(process.env.META_AD_ACCOUNT_ID?.trim() || "4200691606897130").replace(/^act_/, "")}`;
const DATASET = process.env.META_DATASET_ID?.trim() || "28723169773968178";

/** Meta keeps 28 days of pixel stats and refuses a start 28 days back, so 27; 7 is the fallback when Meta refuses the longer window or pages it too finely. */
const LONG_WINDOW = 27;
const SHORT_WINDOW = 7;
const PIXEL_EVENTS = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"] as const;

export const metaConfigured = () => Boolean(metaToken());

/** Meta's own usage reading at the end of one tier's read, kept with that tier so the snapshot can show the latest one. */
export type MetaRateReading = { tier: string | null; maxPct: number | null; calls: number; at: string | null };
export type WithRate<T extends MetaTier> = T & { rate: MetaRateReading };

/* ------------------------------------------------------------ Wording */

const STATUS_WORDS: Record<string, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CAMPAIGN_PAUSED: "Campaign paused",
  ADSET_PAUSED: "Ad set paused",
  IN_PROCESS: "In review",
  PENDING_REVIEW: "In review",
  WITH_ISSUES: "Has issues",
  DISAPPROVED: "Not approved",
  PENDING_BILLING_INFO: "Waiting for payment",
  ARCHIVED: "Archived",
  DELETED: "Archived",
};
/** Ad account statuses that mean money is owed: Unpaid balance, Settlement pending, In grace period. The others (Disabled, risk review, closing) are not fixed by paying. */
export const owesPayment = (status: number | null) => status === 3 || status === 8 || status === 9;
const ACCOUNT_STATUS: Record<number, string> = {
  1: "Active",
  2: "Disabled",
  3: "Unpaid balance",
  7: "Under risk review",
  8: "Settlement pending",
  9: "In grace period",
  100: "Closing",
  101: "Closed",
};

/**
 * A campaign or ad set's effective_status in plain words. Meta leaves deleted
 * and archived objects out of the campaign list, so one that only shows up
 * in the spend figures reads "Archived".
 */
function statusWords(effective: string | undefined) {
  if (!effective) return "Archived";
  return STATUS_WORDS[effective] ?? effective.charAt(0) + effective.slice(1).toLowerCase().replace(/_/g, " ");
}

/** Why Meta rejected the key, from the 190 subcode (Graph API "Handling errors"). */
const KEY_REASON: Record<number, string> = {
  463: "it has expired",
  460: "a password or security change cancelled it",
  458: "the app was removed",
  459: "the account is checkpointed",
};

function stateOf(e: unknown): TierState {
  if (!(e instanceof MetaError)) return "error";
  if (e.kind === "key_invalid") return "key_invalid";
  if (e.kind === "throttled" || e.kind === "paused") return "throttled";
  if (e.kind === "no_permission" || e.kind === "not_found") return "no_permission";
  return "error";
}

/** The owner-facing reason a read failed; `part` names what was being read ("the ad figures"). */
function failureOf(e: unknown, part: string): Failure {
  if (!(e instanceof MetaError)) {
    console.error(`[meta] reading ${part} failed unexpectedly:`, e);
    return { kind: "unknown", message: `Something went wrong while the dashboard read ${part} from Meta.`, requestId: null };
  }
  const code = e.code === null ? "" : ` (code ${e.code}${e.subcode ? `/${e.subcode}` : ""})`;
  const message = {
    key_invalid: `Meta rejected the dashboard key (${(e.subcode !== null && KEY_REASON[e.subcode]) || "expired or revoked"}). Make a new one in Business settings › System users › eternal-dashboard-read.`,
    no_permission: `The dashboard key is not allowed to read ${part}.`,
    not_found: `The dashboard key cannot see ${part}; check the system user's assets in Business settings.`,
    tier_blocked:
      e.code === 274
        ? `Meta has not enabled the ad account for the dashboard's app. Add ad account ${AD_ACCOUNT.slice(4)} under the app's Settings › Advanced › Advertising accounts.`
        : `The dashboard's Meta app has development access only, which does not cover ${part}. The app needs Full Marketing API access.`,
    throttled: `Meta asked the dashboard to slow down. It reads ${part} again in a few minutes.`,
    paused: "The dashboard paused its Meta reads for a few minutes to stay inside Meta's rate limit.",
    transient: `Meta did not answer while the dashboard read ${part}. It tries again shortly.`,
    too_much_data: `Meta could not send ${part} in one go (too much data).`,
    bad_request: `Meta refused the dashboard's request for ${part}${code}.`,
    unknown: `Meta returned an error while the dashboard read ${part}${code}.`,
  }[e.kind];
  return { kind: e.kind, message, requestId: e.requestId };
}

/** Errors that end a tier at once: the key, Meta's rate limit or our own budget. Anything else may only cost one part. */
const stopsEverything = (e: unknown) => e instanceof MetaError && (e.kind === "key_invalid" || e.kind === "throttled" || e.kind === "paused");

/**
 * Errors about the key and what it may do (or the rate limit), not about the
 * request itself: asking another way will not help, and an unpaid balance
 * does not explain them, so they are shown as they are.
 */
const aboutTheKey = (e: unknown) => stopsEverything(e) || stateOf(e) === "no_permission" || (e instanceof MetaError && e.kind === "tier_blocked");

/** Ends a tier at its first failed read: what was read before stays, state and failure say what stopped it. */
function stopAt<T extends MetaTier>(tier: T, e: unknown, part: string): T {
  tier.state = stateOf(e);
  tier.failure = failureOf(e, part);
  return tier;
}

const withRate = <T extends MetaTier>(tier: T, run: MetaRun): WithRate<T> => ({
  ...tier,
  rate: { tier: run.tier, maxPct: run.maxPct, calls: run.calls, at: run.calls ? new Date().toISOString() : null },
});

/* ------------------------------------------------------------ Numbers */

type Action = { action_type?: string; value?: string | number };
type InsightRow = {
  date_start?: string;
  date_stop?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  inline_link_clicks?: string;
  ctr?: string;
  cpm?: string;
  actions?: Action[];
  action_values?: Action[];
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
};

/** Meta sends every figure as a string; a missing one is 0. */
function num(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}
const numOrNull = (v: unknown) => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const round2 = (n: number) => Math.round(n * 100) / 100;
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
/** Budgets come in the currency's minor units (EGP has 100 to the pound): "50000" is 500 EGP. Unset or "0" means the budget sits on the other level. */
const minorUnits = (v: unknown) => (num(v) > 0 ? num(v) / 100 : null);

/**
 * The action types Meta reports are overlapping views of the same actions
 * (omni_purchase already includes the pixel and server purchases that
 * offsite_conversion.fb_pixel_purchase counts), so each figure takes the
 * first type present in this order and never adds types together. omni_* is
 * Ads Manager's own column.
 */
const LPV = ["omni_landing_page_view", "landing_page_view"];
const ATC = ["omni_add_to_cart", "add_to_cart", "offsite_conversion.fb_pixel_add_to_cart"];
const IC = ["omni_initiated_checkout", "initiate_checkout", "offsite_conversion.fb_pixel_initiate_checkout"];
const PURCHASE = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];

/** Meta leaves action types with no actions out of the list, so a missing type is a real zero. */
function pick(list: Action[] | undefined, types: readonly string[]): number {
  for (const t of types) {
    const hit = list?.find((a) => a.action_type === t);
    if (hit) return num(hit.value);
  }
  return 0;
}

/** Account totals for one range; a range Meta left out had no delivery, so its counts are zeros and its ratios unknown. */
function adsFrom(row: InsightRow | null): MetaAds {
  const spend = num(row?.spend);
  const purchases = pick(row?.actions, PURCHASE);
  const purchaseValue = pick(row?.action_values, PURCHASE);
  const link = row?.actions?.find((a) => a.action_type === "link_click");
  const ctr = numOrNull(row?.ctr);
  return {
    spend,
    impressions: num(row?.impressions),
    reach: num(row?.reach),
    linkClicks: link ? num(link.value) : num(row?.inline_link_clicks),
    lpv: pick(row?.actions, LPV),
    atc: pick(row?.actions, ATC),
    ic: pick(row?.actions, IC),
    purchases,
    purchaseValue,
    roas: ratio(purchaseValue, spend),
    cpa: ratio(spend, purchases),
    // Meta's ctr is a percentage ("1.85" is 1.85%); the dashboard keeps ratios.
    ctr: ctr === null ? null : ctr / 100,
    cpm: numOrNull(row?.cpm),
  };
}

/** Meta writes times like "2026-10-07T13:34:13-0700"; Date.parse wants a colon in the offset. */
function timeMs(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
  if (typeof v !== "string" || !v) return null;
  const t = Date.parse(v.replace(/([+-]\d\d)(\d\d)$/, "$1:$2"));
  return Number.isFinite(t) ? t : null;
}
const isoTime = (v: unknown) => {
  const t = timeMs(v);
  return t === null ? null : new Date(t).toISOString();
};

/* ---------------------------------------------------------------- Ads */

const insightsPath = `${AD_ACCOUNT}/insights`;
/** Each ad set's own attribution setting, as in Ads Manager. Never action_attribution_windows: it switches to fixed windows. */
const ATTRIBUTION = { use_unified_attribution_setting: "true" };
const span = (r: Range) => ({ since: r.from, until: r.to });

/** One insights call for all three periods and the periods before them. */
async function readPeriods(run: MetaRun, today: string): Promise<MetaAdsTier["periods"]> {
  const ranges = PERIOD_KEYS.map((k) => ({ k, cur: fullDays(Number(k), today), prev: prevDays(Number(k), today) }));
  const body = await graphGet(run, insightsPath, {
    level: "account",
    fields: "spend,impressions,reach,clicks,inline_link_clicks,ctr,cpm,actions,action_values,date_start,date_stop",
    time_ranges: JSON.stringify(ranges.flatMap(({ cur, prev }) => [span(cur), span(prev)])),
    ...ATTRIBUTION,
  });
  const rows = rowsOf<InsightRow>(body);
  // Matched by dates, not position: a range with no delivery is left out of the answer.
  const find = (r: Range) => rows.find((x) => x.date_start === r.from && x.date_stop === r.to) ?? null;
  const periods: MetaAdsTier["periods"] = {};
  for (const { k, cur, prev } of ranges) {
    const p = adsFrom(find(prev));
    periods[k] = { range: cur, ads: adsFrom(find(cur)), adsPrev: { spend: p.spend, purchases: p.purchases, purchaseValue: p.purchaseValue, roas: p.roas, cpa: p.cpa } };
  }
  return periods;
}

/**
 * One row per day for the last 90 full days and today. Meta skips days
 * without delivery, so every day is filled in. If Meta refuses today as the
 * end (a report says it checks the range against the UTC date, which is a
 * day behind Cairo late each evening), the read ends yesterday and today
 * shows 0 until the next read.
 */
async function readDaily(run: MetaRun, today: string): Promise<MetaAdsTier["daily"]> {
  const since = addDays(today, -90);
  const read = (until: string) =>
    graphList<InsightRow>(
      run,
      insightsPath,
      { level: "account", time_increment: "1", fields: "date_start,spend,actions,action_values", time_range: JSON.stringify({ since, until }), ...ATTRIBUTION },
      100,
    );
  let rows: InsightRow[];
  try {
    rows = await read(today);
  } catch (e) {
    if (!(e instanceof MetaError && e.kind === "bad_request" && e.code === 100 && /date|time|until|since|range/i.test(e.message))) throw e;
    rows = await read(addDays(today, -1));
  }
  const byDay = new Map(rows.map((r) => [r.date_start, r]));
  return daysBetween(since, today).map((d) => {
    const r = byDay.get(d);
    return { d, spend: num(r?.spend), purchases: pick(r?.actions, PURCHASE), value: pick(r?.action_values, PURCHASE), lpv: pick(r?.actions, LPV), atc: pick(r?.actions, ATC) };
  });
}

/** Ad set figures for the 30-day period, the same days as the "30" period (Meta's last_30d preset, spelled out). Campaign figures are their sum. */
function readAdsetInsights(run: MetaRun, today: string) {
  return graphList<InsightRow>(
    run,
    insightsPath,
    {
      level: "adset",
      fields: "campaign_id,campaign_name,adset_id,adset_name,spend,actions,action_values",
      time_range: JSON.stringify(span(fullDays(30, today))),
      ...ATTRIBUTION,
    },
    100,
  );
}

type AdObject = { id?: string; name?: string; campaign_id?: string; effective_status?: string; daily_budget?: string };
const OBJECT_FIELDS = "id,name,status,effective_status,daily_budget,lifetime_budget";

/** Campaigns with their ad sets nested in one call; if Meta refuses the nesting, two plain lists. */
async function readObjects(run: MetaRun): Promise<{ campaigns: AdObject[]; adsets: AdObject[] }> {
  try {
    const list = await graphList<AdObject & { adsets?: { data?: AdObject[] } }>(
      run,
      `${AD_ACCOUNT}/campaigns`,
      { fields: `${OBJECT_FIELDS},adsets.limit(100){${OBJECT_FIELDS}}` },
      100,
    );
    return { campaigns: list, adsets: list.flatMap((c) => (c.adsets?.data ?? []).map((a) => ({ ...a, campaign_id: c.id }))) };
  } catch (e) {
    if (aboutTheKey(e)) throw e;
    const campaigns = await graphList<AdObject>(run, `${AD_ACCOUNT}/campaigns`, { fields: OBJECT_FIELDS }, 100);
    const adsets = await graphList<AdObject>(run, `${AD_ACCOUNT}/adsets`, { fields: `${OBJECT_FIELDS},campaign_id` }, 100);
    return { campaigns, adsets };
  }
}

type Figures = { spend: number; lpv: number; atc: number; ic: number; purchases: number; value: number };

/** Each campaign that spent or is active, biggest spend first, each followed by its ad sets that spent or are active. */
function campaignRows(objects: { campaigns: AdObject[]; adsets: AdObject[] }, insights: InsightRow[]): CampaignRow[] {
  const figures = new Map<string, Figures>();
  const names = new Map<string, string>();
  const parent = new Map<string, string>();
  for (const r of insights) {
    if (!r.campaign_id || !r.adset_id) continue;
    for (const id of [r.campaign_id, r.adset_id]) {
      const f = figures.get(id) ?? { spend: 0, lpv: 0, atc: 0, ic: 0, purchases: 0, value: 0 };
      f.spend += num(r.spend);
      f.lpv += pick(r.actions, LPV);
      f.atc += pick(r.actions, ATC);
      f.ic += pick(r.actions, IC);
      f.purchases += pick(r.actions, PURCHASE);
      f.value += pick(r.action_values, PURCHASE);
      figures.set(id, f);
    }
    if (r.campaign_name) names.set(r.campaign_id, r.campaign_name);
    if (r.adset_name) names.set(r.adset_id, r.adset_name);
    parent.set(r.adset_id, r.campaign_id);
  }
  const campaigns = new Map(objects.campaigns.filter((c) => c.id).map((c) => [c.id as string, c]));
  const adsets = new Map(objects.adsets.filter((a) => a.id).map((a) => [a.id as string, a]));
  for (const [id, a] of adsets) if (a.campaign_id) parent.set(id, a.campaign_id);

  const spend = (id: string) => figures.get(id)?.spend ?? 0;
  const shown = (id: string, o: AdObject | undefined) => spend(id) > 0 || o?.effective_status === "ACTIVE";
  const bySpend = (a: string, b: string) => spend(b) - spend(a);
  const row = (id: string, level: CampaignRow["level"], o: AdObject | undefined, budgetDay: number | null): CampaignRow => {
    const f = figures.get(id) ?? { spend: 0, lpv: 0, atc: 0, ic: 0, purchases: 0, value: 0 };
    return {
      id,
      name: o?.name ?? names.get(id) ?? id,
      level,
      status: statusWords(o?.effective_status),
      active: o?.effective_status === "ACTIVE",
      budgetDay,
      spend: round2(f.spend),
      lpv: f.lpv,
      atc: f.atc,
      ic: f.ic,
      purchases: f.purchases,
      value: round2(f.value),
      roas: ratio(f.value, f.spend),
      cpa: ratio(f.spend, f.purchases),
    };
  };

  const rows: CampaignRow[] = [];
  const campaignIds = [...new Set([...campaigns.keys(), ...parent.values()])].filter((id) => shown(id, campaigns.get(id))).sort(bySpend);
  for (const cid of campaignIds) {
    const c = campaigns.get(cid);
    const campaignBudget = minorUnits(c?.daily_budget);
    rows.push(row(cid, "campaign", c, campaignBudget));
    const children = [...parent].filter(([aid, p]) => p === cid && shown(aid, adsets.get(aid))).map(([aid]) => aid).sort(bySpend);
    // An ad set without its own budget runs on its campaign's (Advantage campaign budget).
    for (const aid of children) rows.push(row(aid, "adset", adsets.get(aid), minorUnits(adsets.get(aid)?.daily_budget) ?? campaignBudget));
  }
  return rows;
}

/** A time zone Intl knows, or Cairo when Meta sends none or one Intl cannot use. */
function zoneOr(tz: string | null) {
  if (!tz) return SHOP_TZ;
  try {
    ymdIn(new Date(), tz);
    return tz;
  } catch {
    return SHOP_TZ;
  }
}

const blankAds = (): MetaAdsTier => ({ state: "off", failure: null, fetchedAt: null, account: null, today: null, periods: {}, daily: [], campaigns: [] });

/**
 * The ads tier, read now: account status first (its time zone sets Meta's
 * days), then period totals, daily rows, ad set figures and the campaign and
 * ad set list, one call at a time. Five calls when everything answers.
 */
export async function fetchMetaAds(): Promise<WithRate<MetaAdsTier>> {
  const run = newRun();
  if (!metaConfigured()) return withRate(blankAds(), run);
  const tier: MetaAdsTier = { ...blankAds(), state: "ok", fetchedAt: new Date().toISOString() };
  let part = "the ad account";
  try {
    // Not owner, funding_source_details or is_prepay_account: they need more than "View performance" and fail the whole call.
    const a = await graphGet(run, AD_ACCOUNT, { fields: "id,name,account_status,disable_reason,currency,timezone_name" });
    const status = numOrNull(a.account_status);
    const timezone = typeof a.timezone_name === "string" && a.timezone_name ? a.timezone_name : null;
    tier.account = {
      status,
      statusName: status === null ? null : (ACCOUNT_STATUS[status] ?? `Status ${status}`),
      timezone,
      currency: typeof a.currency === "string" ? a.currency : null,
    };
    const today = ymdIn(new Date(), zoneOr(timezone));
    tier.today = today;

    part = "the ad figures";
    try {
      tier.periods = await readPeriods(run, today);
    } catch (e) {
      // While the account is not active Meta may refuse insights; that is the unpaid balance, never zero sales.
      // A refusal of the key itself (270, 274, permissions) is not, and paying would not bring the figures back.
      if (status === null || status === 1 || aboutTheKey(e)) throw e;
      const owes = owesPayment(status);
      tier.state = owes ? "unsettled" : "error";
      tier.failure = {
        kind: owes ? "unsettled" : "inactive",
        message: owes
          ? `Meta did not give the ad figures while the ad account shows "${tier.account.statusName}". Settle it in Ads Manager › Billing & payments; the figures come back once the account is active.`
          : `Meta did not give the ad figures while the ad account shows "${tier.account.statusName}". Ads Manager › Account quality says why and what Meta asks for; the figures come back once the account is active.`,
        requestId: e instanceof MetaError ? e.requestId : null,
      };
      return withRate(tier, run);
    }

    part = "the daily ad figures";
    tier.daily = await readDaily(run, today);
    part = "the campaign figures";
    const insights = await readAdsetInsights(run, today);
    part = "the campaigns and ad sets";
    tier.campaigns = campaignRows(await readObjects(run), insights);
  } catch (e) {
    stopAt(tier, e, part);
  }
  return withRate(tier, run);
}

/* -------------------------------------------------------------- Pixel */

type StatsBucket = { start_time?: unknown; timestamp?: unknown; data?: { value?: unknown; count?: unknown }[] };
type Stats = { totals: Record<string, number>; newest: string | null; complete: boolean };

/** The window this instance reads the event counts over; it drops to 7 days for good once Meta refuses 27. */
let windowDays = LONG_WINDOW;

const statsWindow = (days: number) => {
  const now = Math.floor(Date.now() / 1000);
  return { start_time: String(now - days * 86_400), end_time: String(now) };
};

/**
 * Sums one /stats query over its hourly buckets and pages. Meta's page size
 * here is unknown, and a full page is followed by an empty one, so pages are
 * followed while they hold buckets, up to maxPages. complete is false when
 * more pages were waiting.
 */
async function stats(run: MetaRun, params: Record<string, string>, maxPages: number): Promise<Stats> {
  const totals: Record<string, number> = {};
  let newest = 0;
  let body: GraphBody = await graphGet(run, `${DATASET}/stats`, params);
  for (let page = 1; ; page++) {
    const buckets = rowsOf<StatsBucket>(body);
    for (const b of buckets) {
      let any = false;
      for (const v of b.data ?? []) {
        const count = num(v.count);
        if (typeof v.value !== "string" || !count) continue;
        totals[v.value] = (totals[v.value] ?? 0) + count;
        any = true;
      }
      // The Graph API names the bucket time start_time; Meta's own tools call it timestamp.
      const t = timeMs(b.start_time ?? b.timestamp);
      if (any && t !== null && t > newest) newest = t;
    }
    const next = nextPage(body);
    const result = (complete: boolean): Stats => ({ totals, newest: newest ? new Date(newest).toISOString() : null, complete });
    if (!buckets.length || !next) return result(true);
    if (page >= maxPages) return result(false);
    body = await graphGet(run, next);
  }
}

/** Browser and server event counts over the same window: 27 days, or 7 when Meta refuses 27 (error 100) or 27 days need more than 4 pages a query. */
async function eventCounts(run: MetaRun): Promise<{ browser: Stats; server: Stats; days: number }> {
  for (;;) {
    const days = windowDays;
    const maxPages = days === LONG_WINDOW ? 4 : 8;
    try {
      const browser = await stats(run, { aggregation: "event", event_source: "WEB_ONLY", ...statsWindow(days) }, maxPages);
      const server = browser.complete ? await stats(run, { aggregation: "event", event_source: "SERVER_ONLY", ...statsWindow(days) }, maxPages) : null;
      if (server && browser.complete && server.complete) return { browser, server, days };
      // Seven days is at most 168 hourly buckets, so 8 pages always hold them unless Meta changes its paging.
      if (days === SHORT_WINDOW) throw new MetaError("too_much_data", "Pixel counts came in more pages than the dashboard reads");
    } catch (e) {
      if (days === SHORT_WINDOW || !(e instanceof MetaError && e.kind === "bad_request" && e.code === 100)) throw e;
    }
    windowDays = SHORT_WINDOW;
  }
}

const blankPixel = (): MetaPixelTier => ({ state: "off", failure: null, fetchedAt: null, windowDays, lastBrowser: null, lastServer: null, hosts: [], events: [] });

/**
 * The pixel tier, read now: the dataset's last browser event, the browser
 * and server event counts, and the sites that sent events in the last 7
 * days. The last server event is the newest hour with server events (hour
 * precision): the exact time is only on the business's dataset edge, which
 * a read-only key may not reach.
 */
export async function fetchMetaPixel(): Promise<WithRate<MetaPixelTier>> {
  const run = newRun();
  if (!metaConfigured()) return withRate(blankPixel(), run);
  const tier: MetaPixelTier = { ...blankPixel(), state: "ok", fetchedAt: new Date().toISOString() };
  let part = "the Meta dataset";
  try {
    const d = await graphGet(run, DATASET, { fields: "id,name,last_fired_time,is_unavailable" });
    if (d.is_unavailable === true) {
      tier.state = "error";
      tier.failure = { kind: "unavailable", message: "Meta reports the dataset as unavailable, so it has no event counts.", requestId: null };
      return withRate(tier, run);
    }
    tier.lastBrowser = isoTime(d.last_fired_time);

    part = "the pixel event counts";
    const { browser, server, days } = await eventCounts(run);
    tier.windowDays = days;
    tier.events = PIXEL_EVENTS.map((name) => ({ name, browser: browser.totals[name] ?? 0, server: server.totals[name] ?? 0 }));
    tier.lastBrowser ??= browser.newest;
    tier.lastServer = server.newest;

    part = "the sites sending events";
    // Only which sites appear matters here, so a host list cut short by paging is still used.
    const hosts = await stats(run, { aggregation: "host", ...statsWindow(SHORT_WINDOW) }, 8);
    tier.hosts = Object.entries(hosts.totals).sort((a, b) => b[1] - a[1]).map(([host]) => host);
  } catch (e) {
    stopAt(tier, e, part);
  }
  return withRate(tier, run);
}

/* --------------------------------------------------------------- Slow */

type AudienceRow = {
  name?: string;
  subtype?: string;
  approximate_count_lower_bound?: number;
  approximate_count_upper_bound?: number;
  pixel_id?: string;
  data_source?: { type?: string; sub_type?: string };
  lookalike_spec?: unknown;
  rule?: unknown;
};

/** Event match quality (0–10) per event, from the Dataset Quality API. It needs business_management on the key, so a read-only key gets no_permission. */
async function readEmq(run: MetaRun): Promise<Record<string, number>> {
  const body = await graphGet(run, "dataset_quality", { dataset_id: DATASET });
  const web = Array.isArray(body.web) ? body.web : rowsOf<{ web?: unknown }>(body)[0]?.web;
  const emq: Record<string, number> = {};
  for (const e of Array.isArray(web) ? (web as { event_name?: unknown; event_match_quality?: { composite_score?: unknown } }[]) : []) {
    const score = numOrNull(e?.event_match_quality?.composite_score);
    if (typeof e?.event_name === "string" && score !== null) emq[e.event_name] = score;
  }
  return emq;
}

/** "about 12,000": two significant figures, so a size never looks more exact than Meta's estimate. */
function sizeWords(lower: unknown, upper: unknown): string | null {
  const lo = numOrNull(lower);
  const hi = numOrNull(upper);
  if (lo === null && hi === null) return null;
  if (lo === -1 || hi === -1) return "building";
  const n = lo ?? (hi as number);
  if ((hi !== null && hi < 1000) || n < 1000) return "fewer than 1,000";
  const step = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return `about ${(Math.round(n / step) * step).toLocaleString("en-US")}`;
}

/** The event source types in an audience rule (a JSON string), wherever Meta nests them. */
function ruleSources(rule: unknown): string[] {
  let parsed = rule;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  const out: string[] = [];
  const walk = (v: unknown, depth: number) => {
    if (!v || typeof v !== "object" || depth > 8) return;
    for (const [key, x] of Object.entries(v)) {
      if (key === "event_sources" && Array.isArray(x)) {
        for (const s of x as { type?: unknown }[]) if (typeof s?.type === "string") out.push(s.type.toLowerCase());
      } else walk(x, depth + 1);
    }
  };
  walk(parsed, 0);
  return out;
}

const CUSTOMER_LIST = new Set(["FILE_IMPORTED", "CONTACT_IMPORTER", "COPY_PASTE"]);

/**
 * What an audience is built from. Meta reports subtype "PLATFORM" for
 * audiences made in Ads Manager today, so the subtype is only a late hint:
 * the lookalike spec, the rule's event sources and the data source decide,
 * and the name is the last resort.
 */
function audienceKind(a: AudienceRow): string | null {
  if (a.lookalike_spec) return "lookalike";
  const sources = ruleSources(a.rule);
  if (sources.includes("pixel")) return "website";
  if (sources.some((t) => t === "page" || t === "ig_business")) return "engagement";
  if (CUSTOMER_LIST.has(a.data_source?.type ?? "") || CUSTOMER_LIST.has(a.data_source?.sub_type ?? "")) return "customer list";
  const sub = a.subtype?.toUpperCase();
  if (sub === "LOOKALIKE") return "lookalike";
  if (sub === "WEBSITE") return "website";
  if (sub === "ENGAGEMENT" || sub === "VIDEO") return "engagement";
  if (sub === "CUSTOM") return "customer list";
  if (a.pixel_id) return "website";
  const name = (a.name ?? "").toLowerCase();
  if (/lookalike|\blal\b/.test(name)) return "lookalike";
  if (/engag|instagram|facebook|video/.test(name)) return "engagement";
  if (/visitor|website|\bsite\b|purchas|cart|checkout/.test(name)) return "website";
  if (/customer|list|subscriber|email/.test(name)) return "customer list";
  return null;
}

/**
 * The ad account's custom audiences. rule is the only reliable sign of what
 * a website or engagement audience is built from, but Meta sometimes answers
 * a request for it with "reduce the amount of data", so it is asked for with
 * small pages and dropped if Meta still refuses.
 */
async function readAudiences(run: MetaRun): Promise<NonNullable<MetaSlowTier["audiences"]>> {
  const fields = "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,pixel_id,data_source,lookalike_spec";
  const path = `${AD_ACCOUNT}/customaudiences`;
  let rows: AudienceRow[];
  try {
    rows = await graphList<AudienceRow>(run, path, { fields: `${fields},rule` }, 25, 4);
  } catch (e) {
    if (!(e instanceof MetaError && e.kind === "too_much_data")) throw e;
    rows = await graphList<AudienceRow>(run, path, { fields }, 25, 4);
  }
  return rows.map((a) => ({
    name: (a.name ?? "").replace(/^\s*ETERNAL\s*\|\s*/i, "").trim() || "Unnamed audience",
    size: sizeWords(a.approximate_count_lower_bound, a.approximate_count_upper_bound),
    kind: audienceKind(a),
  }));
}

const blankSlow = (): MetaSlowTier => ({ state: "off", failure: null, fetchedAt: null, emq: null, emqState: "off", audiences: null, audiencesState: "off", audiencesFailure: null });

/**
 * The slow tier, read now: event match quality and custom audiences. Each
 * part fails on its own (a read-only key is often refused one and allowed
 * the other); the tier's state is the worse of the two, where a refused part
 * alone ("no_permission") does not make the tier an error.
 */
export async function fetchMetaSlow(): Promise<WithRate<MetaSlowTier>> {
  const run = newRun();
  if (!metaConfigured()) return withRate(blankSlow(), run);
  const tier: MetaSlowTier = { ...blankSlow(), state: "ok", fetchedAt: new Date().toISOString(), emqState: "ok", audiencesState: "ok" };
  const failures: { state: TierState; failure: Failure }[] = [];
  let stopped = false;

  try {
    tier.emq = await readEmq(run);
  } catch (e) {
    tier.emqState = stateOf(e);
    failures.push({ state: tier.emqState, failure: failureOf(e, "event match quality") });
    stopped = stopsEverything(e);
  }
  if (stopped) {
    tier.audiencesState = tier.emqState;
    tier.audiencesFailure = failures[0].failure;
  } else {
    try {
      tier.audiences = await readAudiences(run);
    } catch (e) {
      tier.audiencesState = stateOf(e);
      tier.audiencesFailure = failureOf(e, "the custom audiences");
      failures.push({ state: tier.audiencesState, failure: tier.audiencesFailure });
    }
  }

  const worst = failures.find((f) => f.state !== "no_permission") ?? (failures.length === 2 ? failures[0] : null);
  if (worst) {
    tier.state = worst.state;
    tier.failure = worst.failure;
  }
  return withRate(tier, run);
}

/* ----------------------------------------------------------- Snapshot */

type TierName = "ads" | "pixel" | "slow";

/**
 * A read that came back throttled, with the key refused, or failed for a
 * moment must not replace good figures in the cache: a throttle passes in
 * minutes, a new key arrives with a redeploy that the cache outlives, and a
 * failed moment passes on the next try. So the cached function throws
 * instead. When the entry is only stale, Next keeps serving it (and logs the
 * error). When there is no entry, or the Refresh action expired it, the throw
 * reaches getMetaSnapshot, which shows this instance's last good figures
 * under the failed read's state, or the failed read alone when it has none.
 * The failed read rides in a private field so Next's log line stays short.
 */
class KeptLastGood extends Error {
  readonly #tier: WithRate<MetaTier>;
  constructor(tier: WithRate<MetaTier>, name: TierName) {
    super(`Meta ${name}: ${tier.failure?.message ?? tier.state} The last good figures stay in the cache.`);
    this.name = "KeptLastGood";
    this.#tier = tier;
  }
  get tier() {
    return this.#tier;
  }
}

/**
 * Per instance and tier: the latest held-back failure (shown over the cached
 * figures until a read succeeds), the last good figures this instance read
 * or served, and the read under way.
 */
const heldBack: Partial<Record<TierName, WithRate<MetaTier>>> = {};
const lastGood: Partial<Record<TierName, WithRate<MetaTier>>> = {};
const inflight: Partial<Record<TierName, Promise<WithRate<MetaTier>>>> = {};

/** How long after a read that failed for a moment the next one may start, so a lasting Meta outage costs a few calls a minute rather than a few per page view. */
const RETRY_FLOOR_MS: Record<TierName, number> = { ads: 60_000, pixel: 300_000, slow: 300_000 };

const holdsBack = (t: MetaTier) => t.state === "throttled" || t.state === "key_invalid" || (t.state === "error" && t.failure?.kind === "transient");

async function keepLastGood<T extends MetaTier>(name: TierName, read: () => Promise<WithRate<T>>): Promise<WithRate<T>> {
  const held = heldBack[name];
  if (held?.failure?.kind === "transient" && Date.now() - Date.parse(held.fetchedAt ?? "") < RETRY_FLOOR_MS[name]) throw new KeptLastGood(held, name);
  // Requests that find the entry missing or stale at the same time share one read in this instance (Next only merges them within a request).
  const tier = (await (inflight[name] ??= read().finally(() => {
    delete inflight[name];
  }))) as WithRate<T>;
  if (holdsBack(tier)) {
    heldBack[name] = tier;
    throw new KeptLastGood(tier, name);
  }
  delete heldBack[name];
  lastGood[name] = tier;
  return tier;
}

const TAGS = ["dash-data", "dash-meta"];
/** Each deployment starts its own entries, so a key or permission fixed by a redeploy shows at once instead of after the cached failure lapses. */
const DEPLOYMENT = process.env.VERCEL_DEPLOYMENT_ID ?? "local";
const cachedAds = unstable_cache(() => keepLastGood("ads", fetchMetaAds), ["dash-meta-ads-v1", DEPLOYMENT], { revalidate: 600, tags: [...TAGS, "dash-meta-ads"] });
const cachedPixel = unstable_cache(() => keepLastGood("pixel", fetchMetaPixel), ["dash-meta-pixel-v1", DEPLOYMENT], { revalidate: 3600, tags: [...TAGS, "dash-meta-pixel"] });
const cachedSlow = unstable_cache(() => keepLastGood("slow", fetchMetaSlow), ["dash-meta-slow-v1", DEPLOYMENT], { revalidate: 21600, tags: [...TAGS, "dash-meta-slow"] });

/** Figures read earlier with a newer held-back failure laid over them: the figures and their fetchedAt stay, state and failure say why they are not newer. */
function withHeld<T extends MetaTier>(good: WithRate<T>, held: WithRate<MetaTier> | undefined): WithRate<T> {
  if (!held || (held.fetchedAt ?? "") <= (good.fetchedAt ?? "")) return good;
  return { ...good, state: held.state, failure: held.failure, rate: held.rate.at ? held.rate : good.rate } as WithRate<T>;
}

/** A tier from the cache, or this instance's last good one when the read behind a missing or expired entry was held back. */
async function fromCache<T extends MetaTier>(name: TierName, cached: () => Promise<WithRate<T>>, blank: () => T): Promise<WithRate<T>> {
  let tier: WithRate<T>;
  try {
    tier = await cached();
  } catch (e) {
    if (e instanceof KeptLastGood) {
      const good = lastGood[name] as WithRate<T> | undefined;
      return good ? withHeld(good, e.tier) : (e.tier as WithRate<T>);
    }
    console.error(`[meta] ${name}: the cached read failed:`, e);
    const failure: Failure = { kind: "unknown", message: "The dashboard could not read its saved Meta figures.", requestId: null };
    return { ...blank(), state: "error", failure, rate: { tier: null, maxPct: null, calls: 0, at: null } } as WithRate<T>;
  }
  lastGood[name] = tier;
  return withHeld(tier, heldBack[name]);
}

function apart<T extends MetaTier>(read: WithRate<T>): [T, MetaRateReading] {
  const { rate, ...tier } = read;
  return [tier as unknown as T, rate];
}

/**
 * Everything the dashboard shows from Meta, for all periods at once. Each
 * tier comes from its own cache entry; rate is Meta's latest usage reading
 * among them, and calls is how many Graph calls the three reads on screen
 * took together (what one full refresh costs against Meta's limit).
 */
export async function getMetaSnapshot(): Promise<MetaSnapshot> {
  if (!metaConfigured()) {
    return { configured: false, ads: blankAds(), pixel: blankPixel(), slow: blankSlow(), rate: { tier: null, maxPct: null, calls: 0 } };
  }
  // Read in turn rather than together: on a cold cache each read calls Meta.
  const [ads, adsRate] = apart(await fromCache("ads", cachedAds, blankAds));
  const [pixel, pixelRate] = apart(await fromCache("pixel", cachedPixel, blankPixel));
  const [slow, slowRate] = apart(await fromCache("slow", cachedSlow, blankSlow));
  const readings = [adsRate, pixelRate, slowRate];
  const latest = readings
    .filter((r) => r.at && (r.tier !== null || r.maxPct !== null))
    .sort((a, b) => ((a.at as string) < (b.at as string) ? 1 : -1))[0];
  return {
    configured: true,
    ads,
    pixel,
    slow,
    rate: { tier: latest?.tier ?? null, maxPct: latest?.maxPct ?? null, calls: readings.reduce((sum, r) => sum + r.calls, 0) },
  };
}
