import "server-only";
import { unstable_cache } from "next/cache";
import { addDays, dayStartIso, fullDays, prevDays, SHOP_TZ, ymdIn } from "./dates";
import {
  aggregateOrders,
  CHANNEL_PANEL,
  CITIES_PANEL,
  CUSTOMER_COLUMNS,
  DAILY_PANEL,
  degrade,
  DEVICES_PANEL,
  firstAttempt,
  hasUtm,
  isOldSiteApp,
  kpiPanel,
  lastDay,
  lineMap,
  mapCities,
  mapDaily,
  mapDevices,
  mapKpi,
  mapProducts,
  mapReferrers,
  newReturningPanel,
  oldSiteOrders,
  ordersDaily,
  ordersOn,
  productsFromLines,
  productsPanel,
  referrersPanel,
  toQL,
  toTable,
  UTM_PANEL,
  type Attempt,
  type LineOrderNode,
  type OrderNode,
  type PanelSpec,
  type Table,
} from "./shopify-ql";
import { PERIOD_KEYS, type Line, type ShopifySnapshot } from "./types";

/**
 * The store's side of the dashboard, read with the Admin API and nothing
 * but read permissions. A Dev Dashboard app in the store's own organization
 * trades its Client ID and secret for a 24-hour token (the client
 * credentials grant); the token stays in this server instance's memory and
 * is never logged, shown or stored. One read asks Shopify a handful of
 * batched questions at once and turns every failure into words on the
 * snapshot (state, failure, hidden, checks) instead of throwing, so the page
 * always has something honest to show.
 */

const DEFAULT_VERSION = "2026-10";
const SHOP_HOST = /^[a-z0-9-]+\.myshopify\.com$/;
const VERSION_FORMAT = /^(?:\d{4}-(?:01|04|07|10)|unstable)$/;
const TIMEOUT_MS = 15_000;
const LOG = "[dashboard/shopify]";

/* ------------------------------------------------------------- Settings */

type Config = { shop: string; clientId: string; secret: string; version: string };
type Env = { config: Config | null; missing: string[]; badShop: boolean; badVersion: boolean; version: string };

/** Read on every call rather than at import, so a missing key never breaks the build. */
function readEnv(): Env {
  const shop = (process.env.SHOPIFY_ADMIN_SHOP ?? "").trim().toLowerCase();
  const clientId = (process.env.SHOPIFY_ADMIN_CLIENT_ID ?? "").trim();
  const secret = (process.env.SHOPIFY_ADMIN_CLIENT_SECRET ?? "").trim();
  const asked = (process.env.SHOPIFY_ADMIN_API_VERSION ?? "").trim();
  const badVersion = asked !== "" && !VERSION_FORMAT.test(asked);
  const version = asked && !badVersion ? asked : DEFAULT_VERSION;
  const missing = (
    [
      ["SHOPIFY_ADMIN_SHOP", shop],
      ["SHOPIFY_ADMIN_CLIENT_ID", clientId],
      ["SHOPIFY_ADMIN_CLIENT_SECRET", secret],
    ] as const
  )
    .filter(([, v]) => !v)
    .map(([name]) => name);
  // Admin calls need the myshopify.com host: the shop's own domain serves the storefront and checkout, not the Admin API.
  const badShop = shop !== "" && !SHOP_HOST.test(shop);
  return { config: missing.length || badShop ? null : { shop, clientId, secret, version }, missing, badShop, badVersion, version };
}

/** True when the Admin key is set: the store's myshopify.com address, the app's Client ID and its secret. */
export function shopifyConfigured(): boolean {
  return readEnv().config !== null;
}

/* ---------------------------------------------------------------- Errors */

/** Why a call failed, as a kind the owner-facing messages key on. Never carries a token, a secret or a URL. */
class ShopifyError extends Error {
  constructor(
    readonly kind: string,
    readonly status: number,
    readonly requestId: string | null = null,
    readonly retryAt: number | null = null,
  ) {
    super(kind);
  }
}

/** Failures every other request in the read would hit too, so the read stops. */
const FATAL = new Set(["throttled", "unauthorized", "wrong_organization", "bad_credentials", "bad_shop_domain", "shop_unavailable", "shop_locked"]);
const isFatal = (e: unknown) => e instanceof ShopifyError && (FATAL.has(e.kind) || e.kind.startsWith("token_"));

const minutesUntil = (at: number) => Math.max(1, Math.ceil((at - Date.now()) / 60_000));

/** Plain words the owner can act on; key names may appear, their values never do. */
function messageFor(e: ShopifyError): string {
  switch (e.kind) {
    case "wrong_organization":
      return "Shopify refused the key because the app was not created inside the store's own organization (shop_not_permitted). Signed in to the store admin as the owner, create the app from Settings > Apps > Develop apps > Build apps in Dev Dashboard, then put its Client ID and secret in Vercel. Nothing needs deleting.";
    case "bad_credentials":
      return "Shopify did not accept the Client ID or secret. Copy both again from the Dev Dashboard (the app > Settings > Credentials), check the app is installed on the store, then update them in Vercel and redeploy.";
    case "bad_shop_domain":
      return "Shopify found no store at SHOPIFY_ADMIN_SHOP. Use the store's myshopify.com address exactly as the Shopify admin shows it under Settings > Domains.";
    case "unauthorized":
      return "Shopify issued a token and then refused it. Check the app is still installed on the store (Settings > Apps) and install it again if not.";
    case "throttled":
      return `Shopify asked the dashboard to wait before reading again. The figures come back by themselves${e.retryAt ? ` in about ${minutesUntil(e.retryAt)} min` : ""}; nothing needs doing.`;
    case "timeout":
      return "Shopify did not answer within 15 seconds. The dashboard tries again at the next refresh.";
    case "unreachable":
      return "Shopify could not be reached. The dashboard tries again at the next refresh.";
    case "shop_unavailable":
      return "Shopify says the store is unavailable (HTTP 402), usually an unpaid Shopify bill or a paused store. Check Settings > Billing in the Shopify admin.";
    case "shop_locked":
      return "Shopify has locked the store (HTTP 423). Check the Shopify admin for a notice.";
    case "token_bad_response":
      return "Shopify answered the key request without a token. If this lasts, check the app in the Dev Dashboard.";
    case "bad_response":
      return "Shopify sent an answer the dashboard could not read. It tries again at the next refresh.";
    case "internal":
      return "The Shopify read failed unexpectedly. The dashboard tries again at the next refresh; the server log has the details.";
    default:
      return e.kind.startsWith("token_")
        ? `Shopify's key service answered with an error (HTTP ${e.status}). If it lasts more than an hour, check the app is still installed on the store.`
        : `Shopify answered with an error (HTTP ${e.status}). It usually passes; the dashboard tries again at the next refresh.`;
  }
}

/** Long runs of token-like characters are cut from logged error bodies, in case Shopify ever echoes a credential. */
const redact = (text: string) => text.replace(/[A-Za-z0-9_-]{24,}/g, "[…]").slice(0, 300);

/* ----------------------------------------------------------------- HTTP */

async function post(url: string, headers: Record<string, string>, body: string | URLSearchParams): Promise<Response> {
  try {
    return await fetch(url, { method: "POST", headers, body, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new ShopifyError(timedOut ? "timeout" : "unreachable", 0);
  }
}

type GqlError = { message?: string; path?: (string | number)[]; extensions?: { code?: string } };
type GqlBody = { data?: unknown; errors?: unknown; extensions?: { shopifyqlCost?: { windowResetAt?: string } } };
type Gql<T> = { data: T | null; errors: GqlError[]; version: string | null; requestId: string | null };

/**
 * When Shopify will take requests again: the ShopifyQL window's reset time,
 * else Retry-After, else a minute. Kept between 5 s and 15 min so a strange
 * value can neither hammer Shopify nor blank the panel for long.
 */
function retryAt(res: Response, body: GqlBody | null): number {
  const now = Date.now();
  const reset = Date.parse(body?.extensions?.shopifyqlCost?.windowResetAt ?? "");
  const after = Number(res.headers.get("retry-after"));
  const at = Number.isFinite(reset) ? reset : after > 0 ? now + after * 1000 : now + 60_000;
  return Math.min(Math.max(at, now + 5_000), now + 15 * 60_000);
}

/** Shopify sends errors as a list, or as one string on some auth failures. */
const toErrors = (v: unknown): GqlError[] =>
  Array.isArray(v) ? v.filter((e): e is GqlError => !!e && typeof e === "object") : typeof v === "string" ? [{ message: v }] : [];

/** Missing scope or protected-data level: the field comes back null with this code. */
const isDenied = (e: GqlError) => e.extensions?.code === "ACCESS_DENIED" || /^Access denied for \w+ field/i.test(e.message ?? "");

const httpKind = (status: number) => (status === 402 ? "shop_unavailable" : status === 423 ? "shop_locked" : `http_${status}`);

/* ---------------------------------------------------------------- Token */

type Token = { value: string; scope: string | null; expiresAt: number };

/** Per warm instance, keyed by store and app, so each instance mints about once a day. */
const tokens = new Map<string, Token>();
const minting = new Map<string, Promise<Token>>();

/**
 * The client credentials grant. Neither the request body (it holds the
 * secret) nor a successful answer (it holds the token) is ever logged; a
 * refusal logs its kind, status, request ID and a redacted snippet.
 */
async function mint(c: Config, key: string): Promise<Token> {
  const res = await post(
    `https://${c.shop}/admin/oauth/access_token`,
    { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    new URLSearchParams({ grant_type: "client_credentials", client_id: c.clientId, client_secret: c.secret }),
  );
  const requestId = res.headers.get("x-request-id");
  if (!res.ok) {
    tokens.delete(key);
    const text = await res.text().catch(() => "");
    // The error body's format is not documented, so it is matched by substring.
    const kind = /shop_not_permitted/i.test(text)
      ? "wrong_organization"
      : res.status === 429
        ? "throttled"
        : /application_cannot_be_found|invalid_client/i.test(text) || res.status === 401
          ? "bad_credentials"
          : res.status === 404
            ? "bad_shop_domain"
            : `token_http_${res.status}`;
    console.error(`${LOG} token request refused`, { kind, status: res.status, requestId, body: redact(text) });
    throw new ShopifyError(kind, res.status, requestId, kind === "throttled" ? retryAt(res, null) : null);
  }
  const body = (await res.json().catch(() => null)) as { access_token?: unknown; scope?: unknown; expires_in?: unknown } | null;
  if (typeof body?.access_token !== "string" || !body.access_token) throw new ShopifyError("token_bad_response", res.status, requestId);
  // Tokens last 24 h (expires_in 86399); renew 5 minutes early.
  const life = Number(body.expires_in) || 86_399;
  const token = { value: body.access_token, scope: typeof body.scope === "string" ? body.scope : null, expiresAt: Date.now() + Math.max(60, life - 300) * 1000 };
  tokens.set(key, token);
  return token;
}

/**
 * The cached token, or one mint shared by every caller waiting at the same
 * moment. stale is a token Shopify just refused: it is replaced, unless
 * another caller has replaced it already.
 */
function adminToken(c: Config, stale?: string): Promise<Token> {
  const key = `${c.shop} ${c.clientId}`;
  const cached = tokens.get(key);
  if (cached && cached.value !== stale && Date.now() < cached.expiresAt) return Promise.resolve(cached);
  let pending = minting.get(key);
  if (!pending) {
    pending = mint(c, key).finally(() => minting.delete(key));
    minting.set(key, pending);
  }
  return pending;
}

/**
 * One Admin GraphQL request. A 401 mints a fresh token and tries once more;
 * a 429 or a THROTTLED error stops the read (no retries) and remembers when
 * Shopify will take requests again.
 */
async function gql<T>(c: Config, query: string, variables: Record<string, unknown> = {}): Promise<Gql<T>> {
  let token = await adminToken(c);
  for (let attempt = 0; ; attempt++) {
    const res = await post(
      `https://${c.shop}/admin/api/${c.version}/graphql.json`,
      { "Content-Type": "application/json", Accept: "application/json", "X-Shopify-Access-Token": token.value },
      JSON.stringify({ query, variables }),
    );
    const requestId = res.headers.get("x-request-id");
    if (res.status === 401) {
      await res.body?.cancel().catch(() => undefined);
      if (attempt > 0) throw new ShopifyError("unauthorized", 401, requestId);
      token = await adminToken(c, token.value);
      continue;
    }
    const body = (await res.json().catch(() => null)) as GqlBody | null;
    const errors = toErrors(body?.errors);
    if (res.status === 429 || errors.some((e) => e.extensions?.code === "THROTTLED")) {
      throw new ShopifyError("throttled", res.status, requestId, retryAt(res, body));
    }
    if (!res.ok) throw new ShopifyError(httpKind(res.status), res.status, requestId);
    if (!body) throw new ShopifyError("bad_response", res.status, requestId);
    // Shopify sends its own internal errors as HTTP 200 with INTERNAL_SERVER_ERROR "instead of 500": treated as the 500 they are, which passes by itself.
    if (body.data == null && errors.some((e) => e.extensions?.code === "INTERNAL_SERVER_ERROR")) throw new ShopifyError("http_500", 500, requestId);
    return { data: (body.data ?? null) as T | null, errors, version: res.headers.get("x-shopify-api-version"), requestId };
  }
}

/* -------------------------------------------------------------- Reports */

type QlNode = {
  tableData?: { columns?: { name: string }[] | null; rows?: unknown } | null;
  parseErrors?: string[] | null;
  parseWarnings?: string[] | null;
} | null;
type PanelOut = { ok: true; table: Table; dropped: string[]; warnings: string[] } | { ok: false; reason: string };
type PanelRun = { denied: { requestId: string | null; message: string } | null; out: Record<string, PanelOut>; version: string | null; requestId: string | null };

const SALES_PANELS: PanelSpec[] = [...PERIOD_KEYS.map((k) => kpiPanel(Number(k))), DAILY_PANEL];
const RANKING_PANELS: PanelSpec[] = PERIOD_KEYS.flatMap((k) => [productsPanel(Number(k)), referrersPanel(Number(k))]);
const AUDIENCE_PANELS: PanelSpec[] = [CITIES_PANEL, DEVICES_PANEL, UTM_PANEL, CHANNEL_PANEL];
const CUSTOMER_PANELS: PanelSpec[] = PERIOD_KEYS.map((k) => newReturningPanel(Number(k)));
const LABELS = new Map([...SALES_PANELS, ...CUSTOMER_PANELS, ...RANKING_PANELS, ...AUDIENCE_PANELS].map((p) => [p.key, p.label]));

/**
 * A report is only asked again after its query changed, so the cap only
 * stops one that keeps losing columns. The likeliest bad case needs four:
 * returns under its other name, without returns, without the customer
 * columns, then read.
 */
const MAX_ROUNDS = 5;

/**
 * Per report on this warm instance and API version: what worked, or how far
 * a report got when the rounds ran out, so later reads skip the rounds
 * already done instead of repeating them.
 */
const settled = new Map<string, Attempt>();

const reasonFor = (parseErrors: readonly string[], err: GqlError | undefined) =>
  (parseErrors.length
    ? `Shopify could not run this report: ${parseErrors.join("; ")}`
    : err?.message
      ? `Shopify could not run this report: ${err.message}`
      : "Shopify sent no figures for this report."
  ).slice(0, 300);

/**
 * Several ShopifyQL reports in one request, one alias each. A parse error
 * only empties its own alias, so each report degrades on its own (other
 * column name, column dropped, simpler variant, then hidden with Shopify's
 * reason) over a few rounds while the others keep their answers. An
 * ACCESS_DENIED means the app may not run reports at all, and stops here.
 */
async function runPanels(c: Config, panels: PanelSpec[]): Promise<PanelRun> {
  const run: PanelRun = { denied: null, out: {}, version: null, requestId: null };
  const spec = new Map(panels.map((p) => [p.key, p]));
  const pending = new Map(panels.map((p) => [p.key, structuredClone(settled.get(`${c.version} ${p.key}`)) ?? firstAttempt(p)]));
  // parseWarnings arrived in 2026-10; asking for it on an older version fails the whole request.
  const select = `tableData { columns { name dataType } rows } parseErrors${c.version >= "2026-10" ? " parseWarnings" : ""}`;
  for (let round = 0; round < MAX_ROUNDS && pending.size; round++) {
    const keys = [...pending.keys()];
    const doc = `query DashReports(${keys.map((_, i) => `$q${i}: String!`).join(", ")}) {\n${keys
      .map((_, i) => `  a${i}: shopifyqlQuery(query: $q${i}) { ${select} }`)
      .join("\n")}\n}`;
    const vars = Object.fromEntries(keys.map((key, i) => [`q${i}`, toQL(pending.get(key)!.q)]));
    const r = await gql<Record<string, QlNode>>(c, doc, vars);
    run.version ??= r.version;
    run.requestId = r.requestId;
    const denied = r.errors.find(isDenied);
    if (denied) {
      run.denied = { requestId: r.requestId, message: denied.message ?? "" };
      return run;
    }
    // When one report breaks the whole answer, the others come back empty through no fault of their own and are asked again.
    const collateral = r.data == null && r.errors.some((e) => typeof e.path?.[0] === "string");
    keys.forEach((key, i) => {
      const p = spec.get(key)!;
      const a = pending.get(key)!;
      const node = r.data?.[`a${i}`] ?? null;
      const err = r.errors.find((e) => e.path?.[0] === `a${i}`);
      const parseErrors = node?.parseErrors ?? [];
      const table = parseErrors.length ? null : toTable(node?.tableData);
      if (table) {
        settled.set(`${c.version} ${key}`, structuredClone(a));
        run.out[key] = { ok: true, table, dropped: a.dropped, warnings: node?.parseWarnings ?? [] };
        pending.delete(key);
        return;
      }
      if (err?.extensions?.code === "RESPONSE_TOO_LARGE" && a.q.limit && a.q.limit > 5) {
        a.q.limit = Math.floor(a.q.limit / 2);
        return;
      }
      if (!node && !err && collateral) return;
      const next = parseErrors.length ? degrade(p, a, parseErrors) : null;
      if (next) {
        pending.set(key, next);
        return;
      }
      run.out[key] = { ok: false, reason: reasonFor(parseErrors, err ?? r.errors[0]) };
      pending.delete(key);
    });
  }
  for (const [key, a] of pending) {
    settled.set(`${c.version} ${key}`, structuredClone(a));
    run.out[key] = { ok: false, reason: "Shopify kept rejecting this report. The next refresh carries on from where this one stopped." };
  }
  return run;
}

/**
 * The sales reports, plus the new/returning report for any period whose
 * customer columns Shopify refused (documented on 2026-10, so not expected).
 */
async function salesReports(c: Config): Promise<{ run: PanelRun; nr: PanelRun | null }> {
  const run = await runPanels(c, SALES_PANELS);
  const need = PERIOD_KEYS.filter((k) => {
    const o = run.out[`k${k}`];
    return o?.ok && o.dropped.some((col) => CUSTOMER_COLUMNS.includes(col));
  });
  if (run.denied || !need.length) return { run, nr: null };
  const nr = await runPanels(
    c,
    CUSTOMER_PANELS.filter((p) => need.some((k) => p.key === `nr${k}`)),
  ).catch((e: unknown) => {
    if (isFatal(e)) throw e;
    return null;
  });
  return { run, nr };
}

/* ------------------------------------------------- Catalog, counts, checks */

const SELF_CHECK = `query DashSelfCheck {
  shop { ianaTimezone currencyCode plan { publicDisplayName shopifyPlus } }
  currentAppInstallation { accessScopes { handle } }
}`;
type SelfData = {
  shop: { ianaTimezone: string | null; currencyCode: string | null; plan: { publicDisplayName: string | null; shopifyPlus: boolean } | null } | null;
  currentAppInstallation: { accessScopes: { handle: string }[] } | null;
};

const CATALOG = `query DashCatalog($after: String) {
  products(first: 250, after: $after) { nodes { title tags } pageInfo { hasNextPage endCursor } }
}`;
type CatalogData = { products: { nodes: { title: string; tags: string[] }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } | null };

/** All-time counts from customer segments; only totalCount is asked for, never a member. */
const SEGMENTS = {
  allCustomers: "number_of_orders >= 0",
  buyers: "number_of_orders >= 1",
  repeatBuyers: "number_of_orders >= 2",
  emailSubscribed: "email_subscription_status = 'SUBSCRIBED'",
  smsSubscribed: "sms_subscription_status = 'SUBSCRIBED'",
} as const;
const COUNTS = `query DashCounts {\n${Object.entries(SEGMENTS)
  .map(([alias, q]) => `  ${alias}: customerSegmentMembers(first: 1, query: ${JSON.stringify(q)}) { totalCount }`)
  .join("\n")}\n}`;
type CountsData = Record<keyof typeof SEGMENTS, { totalCount: number } | null>;

/**
 * Whether Shopify publishes products to the Facebook & Instagram channel: a
 * read-only stand-in for "Meta has a catalog". It needs read_publications
 * and read_product_listings, which the owner may leave out.
 */
const META_CHANNEL = `query DashMetaChannel {
  publications(first: 25) {
    nodes {
      catalog { title ... on AppCatalog { apps(first: 1) { nodes { title } } } }
      products(first: 1) { nodes { id } }
    }
  }
}`;
type ChannelData = {
  publications: { nodes: { catalog: { title?: string | null; apps?: { nodes: { title: string }[] } } | null; products: { nodes: { id: string }[] } | null }[] } | null;
};

/** Why a plain GraphQL read came back empty, in words. */
const emptyReason = (errors: readonly GqlError[], scope: string) =>
  errors.some(isDenied) ? `The app is not allowed ${scope}.` : (errors[0]?.message ?? "Shopify sent no data.").slice(0, 300);

/** Product title → line, from every product's tags (a few pages at most for this catalog). */
async function readLines(c: Config): Promise<{ lines: Map<string, Line | null> | null; reason: string | null }> {
  const products: { title: string; tags: string[] }[] = [];
  let after: string | null = null;
  for (let page = 0; page < 8; page++) {
    const r: Gql<CatalogData> = await gql<CatalogData>(c, CATALOG, { after });
    const conn = r.data?.products;
    if (!conn) return { lines: null, reason: emptyReason(r.errors, "to read products (read_products)") };
    products.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) break;
    after = conn.pageInfo.endCursor;
  }
  return { lines: lineMap(products), reason: null };
}

async function readCounts(c: Config): Promise<{ counts: ShopifySnapshot["counts"]; reason: string | null }> {
  const r = await gql<CountsData>(c, COUNTS);
  const d = r.data;
  if (!d) return { counts: null, reason: emptyReason(r.errors, "to read customers (read_customers)") };
  const n = (k: keyof typeof SEGMENTS) => (typeof d[k]?.totalCount === "number" ? d[k].totalCount : null);
  return {
    counts: { customers: n("allCustomers"), buyers: n("buyers"), repeatBuyers: n("repeatBuyers"), emailSubscribed: n("emailSubscribed"), smsSubscribed: n("smsSubscribed") },
    reason: null,
  };
}

async function readMetaChannel(c: Config): Promise<boolean | null> {
  const r = await gql<ChannelData>(c, META_CHANNEL);
  const pubs = r.data?.publications?.nodes;
  if (!pubs || r.errors.length) return null;
  return pubs.some((p) => (p.catalog?.apps?.nodes ?? []).some((a) => /facebook|instagram/i.test(a.title)) && (p.products?.nodes.length ?? 0) > 0);
}

type Check = ShopifySnapshot["checks"][number];

const NEEDED_SCOPES: [string, string][] = [
  ["read_reports", "analytics reports"],
  ["read_products", "product lines"],
  ["read_customers", "customer counts"],
  ["read_orders", "the reduced mode used if analytics are refused"],
];

const BAD_SHOP =
  "SHOPIFY_ADMIN_SHOP in Vercel must be the store's myshopify.com address (like yourstore.myshopify.com), not its own domain. Correct it, then redeploy.";

function envCheck(env: Env): Check {
  if (env.missing.length) return { id: "env", level: "fail", detail: `Not set in Vercel: ${env.missing.join(", ")}.${env.badShop ? ` ${BAD_SHOP}` : ""}` };
  if (env.badShop) return { id: "env", level: "fail", detail: BAD_SHOP };
  if (env.badVersion) {
    return { id: "env", level: "warn", detail: `SHOPIFY_ADMIN_API_VERSION is not a version like ${DEFAULT_VERSION}, so ${DEFAULT_VERSION} is used.` };
  }
  return { id: "env", level: "ok", detail: `Store address and app key are set; API version ${env.version}.` };
}

/** X-Shopify-API-Version names the version that answered; a different one means Shopify "fell forward". */
function versionCheck(asked: string, served: string | null): Check {
  if (!served) return { id: "version", level: "warn", detail: `Shopify did not say which API version answered (asked for ${asked}).` };
  if (served !== asked) {
    console.warn(`${LOG} API version fell forward`, { asked, served });
    return {
      id: "version",
      level: "warn",
      detail: `Asked for API version ${asked}; Shopify answered with ${served} (it fell forward). Nothing is broken, but SHOPIFY_ADMIN_API_VERSION should become ${served}.`,
    };
  }
  return { id: "version", level: "ok", detail: `Shopify answered with API version ${served}.` };
}

/** A write_ scope includes its read_ scope; any write_ scope at all makes a leaked secret far more dangerous. */
function scopesCheck(scopes: string[] | null): Check {
  if (!scopes) return { id: "scopes", level: "warn", detail: "Shopify did not list the app's permissions." };
  const granted = (s: string) => scopes.includes(s) || scopes.includes(s.replace(/^read_/, "write_"));
  const missing = NEEDED_SCOPES.filter(([s]) => !granted(s));
  const writes = scopes.filter((s) => s.startsWith("write_"));
  const notes: string[] = [];
  if (missing.length) {
    notes.push(
      `Missing ${missing.map(([s, why]) => `${s} (${why})`).join(", ")}: add ${missing.length > 1 ? "them" : "it"} to a new app version in the Dev Dashboard, release it and approve the update on the store.`,
    );
  }
  if (writes.length) notes.push(`The app can also change the store (${writes.join(", ")}). Remove every write_ permission: the dashboard only reads.`);
  const level = missing.some(([s]) => s === "read_reports") ? "fail" : notes.length ? "warn" : "ok";
  return { id: "scopes", level, detail: notes.length ? notes.join(" ") : `Read-only: ${[...scopes].sort().join(", ")}.` };
}

function shopCheck(shop: SelfData["shop"], tz: string | null): Check {
  if (!shop) return { id: "shop", level: "fail", detail: "Shopify did not send the store's details (time zone, currency, plan)." };
  const plan = shop.plan?.publicDisplayName ?? "unknown";
  const notes: string[] = [];
  if (tz !== SHOP_TZ) notes.push(tz ? `the store counts days in ${tz}, not Cairo` : "the store's time zone is unknown, so Cairo days are assumed");
  if (shop.currencyCode !== "EGP") notes.push(`amounts are in ${shop.currencyCode ?? "an unknown currency"}, not EGP`);
  // Level 2 customer data, which the reports need, is not available to apps on these plans.
  if (/^(?:basic|starter)\b/i.test(plan)) notes.push(`the ${plan} plan does not give apps the customer-data access the reports need (Grow or higher does)`);
  return {
    id: "shop",
    level: notes.length ? "warn" : "ok",
    detail: `${tz ?? "Unknown time zone"}, ${shop.currencyCode ?? "unknown currency"}, ${plan} plan${notes.length ? `: ${notes.join("; ")}.` : "."}`,
  };
}

const validZone = (tz: string | null | undefined) => {
  if (!tz) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
};

/* ------------------------------------------- Reduced mode: from orders */

const ORDERS = `query DashOrders($q: String!, $after: String) {
  orders(first: 100, after: $after, query: $q, sortKey: CREATED_AT) {
    nodes {
      createdAt
      test
      subtotalPriceSet { shopMoney { amount } }
      totalDiscountsSet { shopMoney { amount } }
      currentSubtotalPriceSet { shopMoney { amount } }
      customer { id numberOfOrders }
      app { name }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
/** Kept apart from ORDERS: line items inside 100 orders would pass Shopify's 1,000-point limit for one query. */
const ORDER_LINES = `query DashOrderLines($q: String!, $after: String) {
  orders(first: 25, after: $after, query: $q, sortKey: CREATED_AT) {
    nodes {
      createdAt
      test
      lineItems(first: 10) { nodes { title quantity currentQuantity discountedUnitPriceAfterAllDiscountsSet { shopMoney { amount } } } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
type OrdersData<T> = { orders: { nodes: T[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } | null };

/** Every page of an orders search, up to a bound that this shop's volume never nears. */
async function allOrders<T>(c: Config, doc: string, q: string, maxPages: number): Promise<{ nodes: T[]; errors: GqlError[]; read: boolean }> {
  const nodes: T[] = [];
  const errors: GqlError[] = [];
  let after: string | null = null;
  for (let page = 0; page < maxPages; page++) {
    const r: Gql<OrdersData<T>> = await gql<OrdersData<T>>(c, doc, { q, after });
    errors.push(...r.errors);
    const conn = r.data?.orders;
    if (!conn) return { nodes, errors, read: false };
    nodes.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) break;
    after = conn.pageInfo.endCursor;
  }
  return { nodes, errors, read: true };
}

function analyticsRefused(missingReports: boolean, rebuilt: boolean): string {
  const why = missingReports
    ? "Shopify refused the analytics reports because the app is not allowed to read reports (read_reports)"
    : "Shopify refused the analytics reports because the app has no access to protected customer data";
  const then = rebuilt
    ? ", so these figures are rebuilt from orders: the last 60 days only, approximate, with no cities, devices or sources."
    : ", and the figures could not be rebuilt from orders either.";
  const fix = missingReports
    ? " In the Dev Dashboard, make a new app version with read_reports, read_products, read_customers and read_orders ticked, release it, and approve the update on the store."
    : " To unlock full analytics, in order: 1) keep the store on Grow or higher; 2) on the app's Home in the Dev Dashboard, if the Distribution card shows no method, choose Custom distribution for this store; 3) uninstall the app and install it again; 4) if it still fails, contact Shopify Support with the request ID and say: Dev Dashboard app in my own organization, client credentials grant, shopifyqlQuery returns ACCESS_DENIED for Level 2 protected customer data.";
  return why + then + fix;
}

const REDUCED = "Not available in the reduced mode";

/**
 * Shopify refused the reports (protected customer data, or no
 * read_reports): rebuild the 7- and 30-day figures, best sellers and daily
 * rows from orders. The app may read only the last 60 days of orders, so the
 * 90-day period is left out and older days stay blank. Only amounts and a
 * customer id are read, never a name, email, phone, address or note.
 */
async function readFromOrders(
  c: Config,
  snap: ShopifySnapshot,
  zone: string,
  scopes: string[] | null,
  lines: Map<string, Line | null> | null,
  denied: { requestId: string | null; message: string },
): Promise<ShopifySnapshot> {
  const missingReports = scopes ? !scopes.includes("read_reports") : /read_reports/i.test(denied.message);
  const kind = missingReports ? "missing_read_reports" : "protected_customer_data";
  console.error(`${LOG} analytics reports refused`, { kind, requestId: denied.requestId });
  snap.checks.push({
    id: "shopifyql",
    level: "fail",
    detail: `Shopify refused the analytics reports (${missingReports ? "no read_reports" : "protected customer data"})${denied.requestId ? `; request ID ${denied.requestId}` : ""}.`,
  });
  const refused = (detail: string): ShopifySnapshot => {
    snap.state = "error";
    snap.failure = { kind, message: analyticsRefused(missingReports, false) + detail, requestId: denied.requestId };
    return snap;
  };
  if (scopes && !scopes.includes("read_orders") && !scopes.includes("write_orders")) {
    return refused(" The reduced mode needs read_orders, which the app does not have.");
  }

  const today = snap.today;
  // The 60-day limit counts back from this moment, so the oldest whole day the app may read is 59 days ago.
  const firstDay = addDays(today, -59);
  const kpi = await allOrders<OrderNode>(c, ORDERS, `created_at:>='${dayStartIso(firstDay, zone)}'`, 30);
  if (!kpi.read) return refused(` Reading orders failed too: ${emptyReason(kpi.errors, "to read orders (read_orders)")}`);
  const customersKnown = !kpi.errors.some((e) => isDenied(e) && e.path?.includes("customer"));

  for (const k of PERIOD_KEYS) {
    const n = Number(k);
    const range = fullDays(n, today);
    if (range.from < firstDay) continue;
    const { sales, customers } = aggregateOrders(ordersOn(kpi.nodes, zone, range.from, range.to), customersKnown);
    const before = prevDays(n, today);
    const prev = before.from >= firstDay ? aggregateOrders(ordersOn(kpi.nodes, zone, before.from, before.to), false).sales : null;
    snap.periods[k] = { range, sales, prev: prev && { net: prev.net, orders: prev.orders, aov: prev.aov }, customers, approximate: true };
  }
  snap.daily = ordersDaily(kpi.nodes, zone, today, firstDay);
  snap.oldSiteOrders7 = ordersOn(kpi.nodes, zone, addDays(today, -6), today).filter((o) => isOldSiteApp(o.app?.name)).length;

  try {
    const span = fullDays(30, today);
    const lineOrders = await allOrders<LineOrderNode>(c, ORDER_LINES, `created_at:>='${dayStartIso(span.from, zone)}' created_at:<'${dayStartIso(today, zone)}'`, 40);
    for (const k of PERIOD_KEYS) {
      const range = fullDays(Number(k), today);
      if (range.from >= span.from && lineOrders.read) snap.products[k] = productsFromLines(ordersOn(lineOrders.nodes, zone, range.from, range.to), lines);
    }
    if (!lineOrders.read) snap.hidden.push({ panel: "Best sellers", reason: emptyReason(lineOrders.errors, "to read orders (read_orders)") });
  } catch (e) {
    if (isFatal(e)) throw e;
    snap.hidden.push({ panel: "Best sellers", reason: messageFor(e instanceof ShopifyError ? e : new ShopifyError("internal", 0)) });
  }

  const sixty = "Shopify lets the app read only the last 60 days of orders";
  snap.hidden.push(
    { panel: "Sales and customers, last 90 days", reason: `${REDUCED}: ${sixty}.` },
    { panel: "Best sellers, last 90 days", reason: `${REDUCED}: ${sixty}.` },
    { panel: `Daily sales before ${firstDay}`, reason: `${REDUCED}: ${sixty}, so earlier days are left blank.` },
    { panel: "Where orders came from", reason: `${REDUCED}: order sources are only in the analytics reports.` },
    { panel: "Cities", reason: `${REDUCED}: delivery addresses are protected customer data.` },
    { panel: "Devices", reason: `${REDUCED}: visits are only in the analytics reports.` },
    { panel: "Campaign tags", reason: `${REDUCED}: visits are only in the analytics reports.` },
  );
  snap.state = "fallback";
  snap.failure = { kind, message: analyticsRefused(missingReports, true), requestId: denied.requestId };
  return snap;
}

/* ------------------------------------------------------------ The read */

/** Per store: while Shopify has asked us to wait, a read answers at once without calling it. */
const throttledUntil = new Map<string, number>();

function blank(now: Date): ShopifySnapshot {
  return {
    state: "error",
    failure: null,
    fetchedAt: now.toISOString(),
    timezone: null,
    today: ymdIn(now, SHOP_TZ),
    periods: {},
    daily: [],
    products: {},
    referrers: {},
    cities: null,
    devices: null,
    hasUtm: null,
    oldSiteOrders7: null,
    counts: null,
    metaChannelSync: null,
    hidden: [],
    checks: [],
  };
}

/** The read stops: Shopify refused the key, asked us to wait, or failed in a way every request would share. */
function stop(snap: ShopifySnapshot, c: Config, e: unknown, check: "token" | "request", quiet = false): ShopifySnapshot {
  const err = e instanceof ShopifyError ? e : new ShopifyError("internal", 0);
  if (err.kind === "throttled") throttledUntil.set(c.shop, err.retryAt ?? Date.now() + 60_000);
  // Token refusals were logged where they happened, with the redacted body.
  if (!(e instanceof ShopifyError)) console.error(`${LOG} unexpected failure`, e instanceof Error ? e.message : String(e));
  else if (!quiet && check !== "token") console.error(`${LOG} read stopped`, { kind: err.kind, status: err.status, requestId: err.requestId });
  snap.state = "error";
  snap.failure = { kind: err.kind, message: messageFor(err), requestId: err.requestId };
  snap.checks.push({ id: check, level: "fail", detail: snap.failure.message + (err.requestId ? ` Request ID ${err.requestId}.` : "") });
  return snap;
}

async function read(): Promise<ShopifySnapshot> {
  const now = new Date();
  const env = readEnv();
  const snap = blank(now);
  snap.checks.push(envCheck(env));
  const c = env.config;
  if (!c) {
    // "off" means the key is still to be added. A key that is all there but names the wrong store is a fault, so the page says what to fix.
    snap.state = env.missing.length ? "off" : "error";
    snap.failure = env.missing.length
      ? { kind: "not_configured", message: `The Shopify key is not set. Add ${env.missing.join(", ")} in Vercel, then redeploy.${env.badShop ? ` ${BAD_SHOP}` : ""}`, requestId: null }
      : { kind: "bad_shop_domain", message: BAD_SHOP, requestId: null };
    return snap;
  }
  const waitUntil = throttledUntil.get(c.shop) ?? 0;
  if (Date.now() < waitUntil) return stop(snap, c, new ShopifyError("throttled", 429, null, waitUntil), "request", true);

  let token: Token;
  try {
    token = await adminToken(c);
  } catch (e) {
    return stop(snap, c, e, "token");
  }
  snap.checks.push({ id: "token", level: "ok", detail: "Shopify issued a token for the app." });

  const [self, sales, ranking, audience, catalog, counts, channel] = await Promise.allSettled([
    gql<SelfData>(c, SELF_CHECK),
    salesReports(c),
    runPanels(c, RANKING_PANELS),
    runPanels(c, AUDIENCE_PANELS),
    readLines(c),
    readCounts(c),
    readMetaChannel(c),
  ]);
  const fatal = [self, sales, ranking, audience, catalog, counts, channel].find((s): s is PromiseRejectedResult => s.status === "rejected" && isFatal(s.reason));
  if (fatal) return stop(snap, c, fatal.reason, "request");

  const selfData = self.status === "fulfilled" ? self.value.data : null;
  const tz = validZone(selfData?.shop?.ianaTimezone);
  const zone = tz ?? SHOP_TZ;
  snap.timezone = tz;
  snap.today = ymdIn(now, zone);
  const scopes = selfData?.currentAppInstallation
    ? selfData.currentAppInstallation.accessScopes.map((s) => s.handle)
    : token.scope
      ? token.scope.split(",").map((s) => s.trim()).filter(Boolean)
      : null;
  const runs = [sales.status === "fulfilled" ? sales.value.run : null, ranking.status === "fulfilled" ? ranking.value : null, audience.status === "fulfilled" ? audience.value : null];
  const served = (self.status === "fulfilled" ? self.value.version : null) ?? runs.find((r) => r?.version)?.version ?? null;
  snap.checks.push(versionCheck(c.version, served), scopesCheck(scopes), shopCheck(selfData?.shop ?? null, tz));
  if (!selfData?.shop) {
    const why = self.status === "rejected" ? messageFor(self.reason instanceof ShopifyError ? self.reason : new ShopifyError("internal", 0)) : emptyReason(self.value.errors, "to read the store's details");
    snap.hidden.push({ panel: "Store details (time zone)", reason: `${why} Cairo days are assumed.` });
  }

  const lines = catalog.status === "fulfilled" ? catalog.value.lines : null;
  const lineReason = catalog.status === "fulfilled" ? catalog.value.reason : messageFor(catalog.reason instanceof ShopifyError ? catalog.reason : new ShopifyError("internal", 0));
  if (!lines) snap.hidden.push({ panel: "Product lines", reason: lineReason ?? "Shopify sent no products." });
  if (counts.status === "fulfilled") snap.counts = counts.value.counts;
  if (!snap.counts) {
    const why = counts.status === "fulfilled" ? counts.value.reason : messageFor(counts.reason instanceof ShopifyError ? counts.reason : new ShopifyError("internal", 0));
    snap.hidden.push({ panel: "Customer counts", reason: why ?? "Shopify sent no counts." });
  }
  snap.metaChannelSync = channel.status === "fulfilled" ? channel.value : null;

  const denied = runs.find((r) => r?.denied)?.denied;
  if (denied) {
    try {
      return await readFromOrders(c, snap, zone, scopes, lines, denied);
    } catch (e) {
      return stop(snap, c, e, "request");
    }
  }

  // A part that failed on its own (a timeout, a Shopify error) hides its panels with the reason.
  const partOut = (s: PromiseSettledResult<PanelRun>, panels: PanelSpec[]): Record<string, PanelOut> => {
    if (s.status === "fulfilled") return s.value.out;
    const reason = messageFor(s.reason instanceof ShopifyError ? s.reason : new ShopifyError("internal", 0));
    return Object.fromEntries(panels.map((p) => [p.key, { ok: false, reason } as PanelOut]));
  };
  const salesRun: PromiseSettledResult<PanelRun> = sales.status === "fulfilled" ? { status: "fulfilled", value: sales.value.run } : sales;
  const out: Record<string, PanelOut> = {
    ...partOut(salesRun, SALES_PANELS),
    ...(sales.status === "fulfilled" && sales.value.nr ? sales.value.nr.out : {}),
    ...partOut(ranking, RANKING_PANELS),
    ...partOut(audience, AUDIENCE_PANELS),
  };
  const table = (key: string) => {
    const o = out[key];
    return o?.ok ? o.table : null;
  };
  const reasonOf = (o: PanelOut | undefined) => (o && !o.ok ? o.reason : "");

  // Shopify's own "today" (the daily report's last day) wins over the server clock around midnight.
  const daily = table("daily");
  const shopToday = daily ? lastDay(daily) : null;
  if (shopToday && (shopToday === addDays(snap.today, 1) || shopToday === addDays(snap.today, -1))) snap.today = shopToday;
  snap.daily = daily ? mapDaily(daily, snap.today) : [];

  for (const k of PERIOD_KEYS) {
    const kpiTable = table(`k${k}`);
    const kpi = kpiTable ? mapKpi(kpiTable, table(`nr${k}`)) : null;
    snap.periods[k] = { range: fullDays(Number(k), snap.today), sales: kpi?.sales ?? null, prev: kpi?.prev ?? null, customers: kpi?.customers ?? null, approximate: false };
    const products = table(`p${k}`);
    if (products) snap.products[k] = mapProducts(products, lines);
    const referrers = table(`s${k}`);
    if (referrers) snap.referrers[k] = mapReferrers(referrers);
  }
  const cities = table("cities");
  snap.cities = cities ? mapCities(cities) : null;
  const devices = table("devices");
  snap.devices = devices ? mapDevices(devices) : null;
  const utm = table("utm");
  snap.hasUtm = utm ? hasUtm(utm) : null;
  const channel7 = table("channel7");
  snap.oldSiteOrders7 = channel7 ? oldSiteOrders(channel7) : null;

  const warnings = new Set<string>();
  for (const [key, o] of Object.entries(out)) {
    const panel = LABELS.get(key) ?? key;
    if (!o.ok) snap.hidden.push({ panel, reason: o.reason });
    else {
      o.warnings.forEach((w) => warnings.add(w));
      if (o.dropped.length) {
        // Shopify may have named only one of these: the customer columns are left out together.
        snap.hidden.push({ panel, reason: `Shopify refused part of this report on API version ${c.version}, so it was read without ${o.dropped.join(", ")}.` });
      }
    }
  }

  const answered = Object.values(out).filter((o) => o.ok).length;
  const total = Object.keys(out).length;
  const firstFailure = [salesRun, ranking, audience].find((s): s is PromiseRejectedResult => s.status === "rejected")?.reason;
  const requestId = runs.find((r) => r?.requestId)?.requestId ?? null;
  const warned = warnings.size ? ` Shopify warned: ${[...warnings].slice(0, 3).join("; ")}`.slice(0, 400) : "";
  snap.checks.push({
    id: "shopifyql",
    level: answered === 0 ? "fail" : warned || answered < total ? "warn" : "ok",
    detail: `Analytics reports answered: ${answered} of ${total}.${warned}`,
  });
  if (warnings.size) console.warn(`${LOG} ShopifyQL warnings`, [...warnings]);

  if (["k7", "k30", "k90", "daily"].every((k) => !out[k]?.ok)) {
    snap.state = "error";
    snap.failure =
      firstFailure instanceof ShopifyError
        ? { kind: firstFailure.kind, message: messageFor(firstFailure), requestId: firstFailure.requestId }
        : { kind: "reports_failed", message: `Shopify's analytics reports did not answer. ${reasonOf(out.k30)}`.trim(), requestId };
    console.error(`${LOG} sales reports failed`, { kind: snap.failure.kind, requestId: snap.failure.requestId });
    return snap;
  }
  snap.state = snap.hidden.length ? "partial" : "ok";
  if (snap.hidden.length) console.warn(`${LOG} some panels were not read`, snap.hidden);
  return snap;
}

/** Concurrent cache misses share one read instead of each calling Shopify. */
let inflight: Promise<ShopifySnapshot> | null = null;

/** A fresh read of the store, uncached. Never throws: every failure is described on the snapshot. */
export function fetchShopifySnapshot(): Promise<ShopifySnapshot> {
  inflight ??= read()
    .catch((e: unknown): ShopifySnapshot => {
      console.error(`${LOG} unexpected failure`, e instanceof Error ? e.message : String(e));
      const snap = blank(new Date());
      snap.failure = { kind: "internal", message: messageFor(new ShopifyError("internal", 0)), requestId: null };
      return snap;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Failures that pass by themselves (Shopify slow, busy or briefly down): a read that hit one must not replace good figures. A code or API change ("internal", "reports_failed") does not pass, so it is shown. */
const passes = (kind: string) => ["throttled", "timeout", "unreachable", "bad_response", "token_bad_response"].includes(kind) || /^(token_)?http_5\d\d$/.test(kind);

/**
 * Thrown by the cached read when Shopify failed for a moment, as Meta's tiers
 * do (lib/dashboard/meta.ts): while the entry is only stale, Next keeps
 * serving it; when there is none, getShopifySnapshot shows this instance's
 * last good figures, or the failed read when it has none.
 */
class KeptLastGood extends Error {
  readonly #snap: ShopifySnapshot;
  constructor(snap: ShopifySnapshot) {
    super(`Shopify: ${snap.failure?.message ?? snap.state} The last good figures stay in the cache.`);
    this.name = "KeptLastGood";
    this.#snap = snap;
  }
  get snap() {
    return this.#snap;
  }
}

/** Per instance: the latest read that failed for a moment, and the last good one read or served. */
let heldBack: ShopifySnapshot | null = null;
let lastGood: ShopifySnapshot | null = null;
/** After a failed moment, the next read waits this long, so an outage costs a call a minute rather than one per page view (a throttle has its own wait). */
const RETRY_FLOOR_MS = 60_000;
/** Good figures are kept through a failure only while they are from the store's same day and under an hour old; past that the failure is shown. */
const HOLD_MAX_MS = 60 * 60_000;

async function keepLastGood(): Promise<ShopifySnapshot> {
  if (heldBack && heldBack.failure?.kind !== "throttled" && Date.now() - Date.parse(heldBack.fetchedAt) < RETRY_FLOOR_MS) throw new KeptLastGood(heldBack);
  const snap = await fetchShopifySnapshot();
  // When Next revalidates a stale entry, lastGood is that entry (getShopifySnapshot set it), so this judges the figures on screen.
  const holdable = !lastGood || (lastGood.state !== "error" && lastGood.today === snap.today && Date.now() - Date.parse(lastGood.fetchedAt) < HOLD_MAX_MS);
  if (snap.state === "error" && snap.failure && passes(snap.failure.kind) && holdable) {
    heldBack = snap;
    throw new KeptLastGood(snap);
  }
  heldBack = null;
  lastGood = snap;
  return snap;
}

/** Good figures with a newer failed read noted: for everyone as heldSince (the page says the figures are from earlier), for owners with the reason; the figures keep their own fetchedAt. */
function withHeld(good: ShopifySnapshot, held: ShopifySnapshot | null): ShopifySnapshot {
  if (!held?.failure || held.fetchedAt <= good.fetchedAt) return good;
  return {
    ...good,
    heldSince: held.fetchedAt,
    checks: [...good.checks, { id: "latest", level: "warn", detail: `The latest read failed, so these are the figures from the read before it. ${held.failure.message}` }],
  };
}

/**
 * The read, kept for 10 minutes in Next's data cache and served stale while
 * the next one runs; "dash-shopify" (or "dash-data") clears it on demand.
 * Each deployment starts its own entry, so a key fixed by a redeploy shows at once.
 */
const cachedRead = unstable_cache(keepLastGood, ["dash-shopify-v2", process.env.VERCEL_DEPLOYMENT_ID ?? "local"], {
  revalidate: 600,
  tags: ["dash-data", "dash-shopify"],
});

export async function getShopifySnapshot(): Promise<ShopifySnapshot> {
  try {
    const snap = await cachedRead();
    lastGood = snap;
    return withHeld(snap, heldBack);
  } catch (e) {
    if (e instanceof KeptLastGood) return lastGood ? withHeld(lastGood, e.snap) : e.snap;
    throw e;
  }
}
