import "server-only";

/**
 * The dashboard's only way to Meta's Graph API (lib/dashboard/meta.ts reads
 * the ads, pixel and audience figures through it). Read only by design:
 * every request is a GET, the key travels in the Authorization header (so it
 * is never part of a URL that could be logged), and nothing here can write.
 *
 * Meta's Limited access tier, which the dashboard's app starts on, allows a
 * score of 60 per 300 seconds (about one point per read) and then locks the
 * key out for 300 seconds. So requests go out one at a time per server
 * instance, each instance spends at most 40 points in any 300 seconds, and
 * Meta's own usage headers and throttle errors stop further reads until Meta
 * says it is safe again.
 */

/** One place to move the API version. Meta retires each one about two years after release (v24.0 ended on 6 Oct 2026). */
export const GRAPH_VERSION = "v26.0";
const GRAPH_ORIGIN = "https://graph.facebook.com";

const SCORE_WINDOW_MS = 300_000;
const SCORE_BUDGET = 40;
const MIN_BLOCK_MS = 300_000;
const LONG_BLOCK_MS = 3_600_000;
const TIMEOUT_MS = 15_000;
const RETRY_AFTER_MS = 2_000;

/** The system user key from Business settings › System users › eternal-dashboard-read. */
export const metaToken = () => process.env.META_ACCESS_TOKEN?.trim() || null;

/**
 * What went wrong, in the terms the dashboard acts on:
 * - key_invalid: Meta rejected the key itself (confirmed with GET /me);
 * - no_permission / not_found: the key may not read this object or edge;
 * - tier_blocked: the app's access tier or the ad account's API enablement (270, 274);
 * - throttled: Meta asked us to slow down; paused: our own budget or a high usage reading held the read back;
 * - transient: Meta or the network failed for a moment (already retried once);
 * - too_much_data: Meta asked for a smaller request;
 * - bad_request / unknown: anything else.
 */
export type GraphErrorKind =
  | "key_invalid" | "no_permission" | "not_found" | "tier_blocked" | "throttled" | "paused"
  | "transient" | "too_much_data" | "bad_request" | "unknown";

/** Meta's error body: { error: { message, type, code, error_subcode, is_transient, fbtrace_id } }. */
export type GraphErrorBody = { message?: string; type?: string; code?: number; error_subcode?: number; is_transient?: boolean; fbtrace_id?: string };
export type GraphBody = { data?: unknown; paging?: { next?: unknown }; error?: GraphErrorBody; [field: string]: unknown };

/** A refused or failed request. message is Meta's own wording (for matching, never shown to the owner); http is 0 when nothing came back. */
export class MetaError extends Error {
  constructor(
    readonly kind: GraphErrorKind,
    message: string,
    readonly code: number | null = null,
    readonly subcode: number | null = null,
    readonly requestId: string | null = null,
    readonly http = 0,
  ) {
    super(message);
    this.name = "MetaError";
  }
}

/** Sorts Meta's error codes (Graph API "Handling errors", Marketing API rate limiting, and codes seen by other Meta API clients). */
export function classifyGraphError(e: GraphErrorBody, http: number): GraphErrorKind {
  const code = e.code ?? 0;
  const sub = e.error_subcode ?? 0;
  const msg = e.message ?? "";
  if (code === 190 || code === 102) return "key_invalid";
  if ([4, 17, 32, 613].includes(code) || (code >= 80000 && code <= 80014)) return "throttled";
  if (code === 270 || code === 274) return "tier_blocked";
  if (code === 10 || (code >= 200 && code <= 299)) return "no_permission";
  // 100/33 reads "does not exist, cannot be loaded due to missing permissions…", so it is sorted before the permission wording.
  if (code === 100 && sub === 33) return "not_found";
  if (code === 100 && (sub === 2446289 || /permission/i.test(msg))) return "no_permission";
  if (code === 1 && /reduce the amount of data/i.test(msg)) return "too_much_data";
  if (code === 1 || code === 2 || e.is_transient || http >= 500) return "transient";
  if (code === 100 || code === 3018) return "bad_request";
  return "unknown";
}

/** Meta's usage reading from one response: the highest percentage in any usage header, how long until access returns, and the app's access tier. */
export type MetaUsage = { maxPct: number | null; regainSec: number; tier: string | null };

/**
 * Reads the four usage headers. X-Business-Use-Case-Usage is keyed by the ad
 * account or business id and holds percentages plus
 * estimated_time_to_regain_access in minutes; X-Ad-Account-Usage gives
 * reset_time_duration in seconds and is often missing on the Limited tier,
 * where missing means "no news", not 0%.
 */
export function parseUsage(headers: Headers): MetaUsage {
  const acc = { pcts: [] as number[], regainMin: 0, tier: null as string | null };
  const read = (name: string): Record<string, unknown> | null => {
    try {
      const parsed: unknown = JSON.parse(headers.get(name) ?? "null");
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const pct = (v: unknown) => {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
    if (Number.isFinite(n)) acc.pcts.push(n);
  };
  const tier = (v: unknown) => {
    if (!acc.tier && typeof v === "string" && v) acc.tier = v;
  };
  for (const list of Object.values(read("x-business-use-case-usage") ?? {})) {
    for (const entry of Array.isArray(list) ? (list as Record<string, unknown>[]) : []) {
      if (!entry || typeof entry !== "object") continue;
      pct(entry.call_count);
      pct(entry.total_cputime);
      pct(entry.total_time);
      acc.regainMin = Math.max(acc.regainMin, Number(entry.estimated_time_to_regain_access) || 0);
      tier(entry.ads_api_access_tier);
    }
  }
  const account = read("x-ad-account-usage");
  if (account) {
    pct(account.acc_id_util_pct);
    tier(account.ads_api_access_tier);
    if (Number(account.acc_id_util_pct) >= 100) acc.regainMin = Math.max(acc.regainMin, Math.ceil((Number(account.reset_time_duration) || 0) / 60));
  }
  const insights = read("x-fb-ads-insights-throttle");
  if (insights) {
    pct(insights.app_id_util_pct);
    pct(insights.acc_id_util_pct);
    tier(insights.ads_api_access_tier);
  }
  const app = read("x-app-usage");
  if (app) {
    pct(app.call_count);
    pct(app.total_cputime);
    pct(app.total_time);
  }
  return { maxPct: acc.pcts.length ? Math.max(...acc.pcts) : null, regainSec: acc.regainMin * 60, tier: acc.tier };
}

/** One tier's read: the Graph calls it made and Meta's latest usage reading during it. */
export type MetaRun = { calls: number; tier: string | null; maxPct: number | null };
export const newRun = (): MetaRun => ({ calls: 0, tier: null, maxPct: null });

/*
 * Per-instance state. A block stops every read until it ends. A soft hold
 * (usage at 75–89%) lets the reads already under way finish and holds back
 * the rest; "under way" means the read has made a call, because reads that
 * start together (a page finding two tiers stale) wait in the queue and
 * would otherwise all slip past a reading taken after they began.
 */
const ledger: number[] = [];
let block: { until: number; kind: "throttled" | "key_invalid"; subcode: number | null } | null = null;
let softUntil = 0;
let queue: Promise<unknown> = Promise.resolve();
let keyCheck: Promise<MetaError | null> | null = null;

function blockFor(ms: number, kind: "throttled" | "key_invalid", subcode: number | null = null) {
  block = { until: Math.max(block?.until ?? 0, Date.now() + ms), kind, subcode };
}

/** Runs requests strictly one after another in this instance, whichever tier asks. */
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

/**
 * The next page of a list, or null. Meta's paging.next is a full URL and may
 * carry access_token when a key was sent in the query, so that is stripped
 * before the URL is followed or written anywhere, and a next link to any other
 * host is never followed (the key would go with it).
 */
export function nextPage(body: GraphBody): string | null {
  const next = body.paging?.next;
  if (typeof next !== "string") return null;
  try {
    const url = new URL(next);
    if (url.origin !== GRAPH_ORIGIN) return null;
    url.searchParams.delete("access_token");
    return url.toString();
  } catch {
    return null;
  }
}

export const rowsOf = <T>(body: GraphBody): T[] => (Array.isArray(body.data) ? (body.data as T[]) : []);

/** One GET, after the block, hold and budget checks; never retried here. */
function request(run: MetaRun, target: string, params: Record<string, string>): Promise<GraphBody> {
  return oneAtATime(async () => {
    const token = metaToken();
    if (!token) throw new MetaError("key_invalid", "No Meta key is set");
    const now = Date.now();
    if (block && block.until > now) throw new MetaError(block.kind, "Meta reads are blocked for now", null, block.subcode);
    if (softUntil > now && run.calls === 0) throw new MetaError("paused", "Meta usage is high; new reads wait");
    while (ledger.length && now - ledger[0] >= SCORE_WINDOW_MS) ledger.shift();
    if (ledger.length >= SCORE_BUDGET) throw new MetaError("paused", "This instance spent its Meta budget for the last 5 minutes");
    ledger.push(now);
    run.calls += 1;

    const url = new URL(target.startsWith(GRAPH_ORIGIN) ? target : `${GRAPH_ORIGIN}/${GRAPH_VERSION}/${target}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "TimeoutError";
      console.warn(`[meta] ${url.pathname}: ${timedOut ? "no answer within 15 s" : "Meta could not be reached"}`);
      throw new MetaError("transient", timedOut ? "Meta did not answer in time" : "Meta could not be reached");
    }

    const usage = parseUsage(res.headers);
    if (usage.tier) run.tier = usage.tier;
    if (usage.maxPct !== null) run.maxPct = usage.maxPct;
    if (usage.regainSec > 0 || (usage.maxPct ?? 0) >= 90) blockFor(Math.max(usage.regainSec * 1000, MIN_BLOCK_MS), "throttled");
    else if ((usage.maxPct ?? 0) >= 75) softUntil = Date.now() + MIN_BLOCK_MS;

    const body = (await res.json().catch(() => ({}))) as GraphBody;
    if (!body.error && res.ok) return body;
    const err = body.error ?? {};
    const kind = classifyGraphError(err, res.status);
    // 613 without a subcode means Meta cut the app's quota for abuse prevention, which lasts longer than a score block.
    if (kind === "throttled") blockFor(err.code === 613 && !err.error_subcode ? LONG_BLOCK_MS : Math.max(usage.regainSec * 1000, MIN_BLOCK_MS), "throttled");
    console.warn(
      `[meta] ${url.pathname}: ${kind} (code ${err.code ?? `HTTP ${res.status}`}${err.error_subcode ? `/${err.error_subcode}` : ""}${err.fbtrace_id ? `, trace ${err.fbtrace_id}` : ""}): ${(err.message ?? "").slice(0, 160)}`,
    );
    throw new MetaError(kind, err.message ?? `HTTP ${res.status}`, err.code ?? null, err.error_subcode ?? null, err.fbtrace_id ?? null, res.status);
  });
}

/**
 * Meta also answers 190 for some permission problems on a single edge, so a
 * 190 or 102 is checked once with GET /me before the key is called invalid.
 * If /me fails the same way, every read stops for an hour (a new key means a
 * redeploy, which starts fresh instances anyway); if /me works, only this
 * read was refused.
 */
async function confirmKey(run: MetaRun, original: MetaError): Promise<MetaError> {
  keyCheck ??= request(run, "me", { fields: "id" })
    .then(
      () => null,
      (e: unknown) => (e instanceof MetaError ? e : new MetaError("unknown", "The key check failed")),
    )
    .finally(() => {
      keyCheck = null;
    });
  const verdict = await keyCheck;
  if (!verdict) return new MetaError("no_permission", original.message, original.code, original.subcode, original.requestId, original.http);
  if (verdict.kind === "key_invalid") blockFor(LONG_BLOCK_MS, "key_invalid", verdict.subcode);
  return verdict;
}

/**
 * GET a Graph path (relative to the version) or a next-page URL from
 * nextPage(). A transient failure is retried once after 2 seconds; a throttle
 * is never retried (retrying only extends Meta's block).
 */
export async function graphGet(run: MetaRun, target: string, params: Record<string, string> = {}): Promise<GraphBody> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request(run, target, params);
    } catch (e) {
      if (!(e instanceof MetaError)) throw e;
      if (e.kind === "transient" && attempt === 1) {
        await new Promise((r) => setTimeout(r, RETRY_AFTER_MS));
        continue;
      }
      if (e.kind === "key_invalid" && e.http > 0) throw await confirmKey(run, e);
      throw e;
    }
  }
}

/**
 * Every row of a list edge whose page size we set (insights, campaigns,
 * audiences). A page shorter than the limit is the last one, so a list that
 * fits one page costs one call.
 */
export async function graphList<T>(run: MetaRun, path: string, params: Record<string, string>, limit: number, maxPages = 5): Promise<T[]> {
  const out: T[] = [];
  let body = await graphGet(run, path, { ...params, limit: String(limit) });
  for (let page = 1; ; page++) {
    const rows = rowsOf<T>(body);
    out.push(...rows);
    const next = nextPage(body);
    if (rows.length < limit || !next) return out;
    if (page >= maxPages) {
      console.warn(`[meta] ${path}: stopped after ${maxPages} pages of ${limit}`);
      return out;
    }
    body = await graphGet(run, next);
  }
}
