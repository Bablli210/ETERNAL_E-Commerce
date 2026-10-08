/**
 * The shapes the dashboard passes around (/dashboard, lib/dashboard/*,
 * components/dashboard/*). Every value is plain JSON: the source snapshots
 * are kept in Next's data cache, which stores JSON only. Money is EGP as a
 * plain number, ratios are plain numbers (0.231 = 23.1%), dates are
 * YYYY-MM-DD calendar days, times are ISO strings, and null means "not known"
 * (0 only for a real zero).
 */

export type Num = number | null;
export type PeriodKey = "7" | "30" | "90";
export const PERIOD_KEYS: readonly PeriodKey[] = ["7", "30", "90"];
/** An inclusive run of calendar days. */
export type Range = { from: string; to: string };
export type Line = "eterna" | "eterno" | "eternal";
/** Why a source or one of its parts could not be read; message is plain words, never a key or token. */
export type Failure = { kind: string; message: string; requestId?: string | null };

/* ------------------------------------------------------------------ Shopify */

export type ShopifySales = { net: Num; total: Num; gross: Num; discounts: Num; returns: Num; orders: Num; aov: Num };
export type ShopifyCustomers = { customers: Num; newCustomers: Num; returning: Num; returningRate: Num };
export type ShopifyPeriod = {
  range: Range;
  sales: ShopifySales | null;
  prev: { net: Num; orders: Num; aov: Num } | null;
  customers: ShopifyCustomers | null;
  /** True when built from orders (fallback mode): returns are counted on the order's day, not the return's. */
  approximate: boolean;
};
export type ProductRow = { title: string; line: Line | null; units: Num; orders: Num; net: Num };
export type ReferrerRow = { source: string | null; name: string | null; orders: number; net: number };

/**
 * One read of the store (lib/dashboard/shopify.ts). state:
 * - "ok": everything read through ShopifyQL;
 * - "partial": ShopifyQL works but some panels could not be read (see hidden);
 * - "fallback": Shopify refused analytics (protected customer data), so the figures were rebuilt from orders (last 60 days, no cities/devices/UTMs);
 * - "off": the Shopify key is not set;
 * - "error": the key is set but Shopify refused it or could not be reached (failure says why).
 */
export type ShopifySnapshot = {
  state: "ok" | "partial" | "fallback" | "off" | "error";
  failure: Failure | null;
  fetchedAt: string;
  /** shop.ianaTimezone, e.g. "Africa/Cairo". */
  timezone: string | null;
  /** The store's today when read. */
  today: string;
  periods: Partial<Record<PeriodKey, ShopifyPeriod>>;
  /** Oldest first, every day present (0 when nothing happened), the last 90 full days plus today; null for a day the read could not cover (reduced mode keeps 60 days). */
  daily: { d: string; net: Num; orders: Num }[];
  /** Best first, at most 12; rows that are only a return are left out. */
  products: Partial<Record<PeriodKey, ProductRow[]>>;
  referrers: Partial<Record<PeriodKey, ReferrerRow[]>>;
  /** Last 90 days including today, top 8 after merging spellings of the same place. */
  cities: { name: string; orders: number; net: number }[] | null;
  devices: { name: string; sessions: number; completed: number }[] | null;
  /** Whether any session in the last 30 days carried a UTM tag; null when not read. */
  hasUtm: boolean | null;
  /** Orders in the last 7 days, today included, through the old "Lovable" sales channel; null when not read. */
  oldSiteOrders7: number | null;
  /** All-time customer counts from customer segments. */
  counts: { customers: Num; buyers: Num; repeatBuyers: Num; emailSubscribed: Num; smsSubscribed: Num } | null;
  /** Whether Shopify publishes products to the Facebook & Instagram channel; null when not checked. */
  metaChannelSync: boolean | null;
  /** Panels that could not be read, by name, with the reason. */
  hidden: { panel: string; reason: string }[];
  /** First-run self-check, for owners: token, API version, scopes, shop, analytics access. */
  checks: { id: string; level: "ok" | "warn" | "fail"; detail: string }[];
};

/* --------------------------------------------------------------------- Meta */

export type MetaAds = {
  spend: Num; impressions: Num; reach: Num; linkClicks: Num; lpv: Num; atc: Num; ic: Num;
  purchases: Num; purchaseValue: Num; roas: Num; cpa: Num; ctr: Num; cpm: Num;
};
export type MetaAdsPrev = { spend: Num; purchases: Num; purchaseValue: Num; roas: Num; cpa: Num };
export type CampaignRow = {
  id: string; name: string; level: "campaign" | "adset";
  /** Plain words: "Active", "Paused", "Campaign paused", "In review", "Not delivering"… */
  status: string; active: boolean;
  budgetDay: Num; spend: Num; lpv: Num; atc: Num; ic: Num; purchases: Num; value: Num; roas: Num; cpa: Num;
};
/**
 * How one part of the Meta read went:
 * - "ok": read now (or within its cache time);
 * - "off": no Meta key set;
 * - "no_permission": the key is not allowed this part (shown as "not checked with the current key");
 * - "unsettled": the ad account has an unpaid balance (status 3, 8 or 9) and Meta refused the ad figures;
 * - "throttled": Meta asked us to slow down; the last good figures are kept when there are any;
 * - "key_invalid": Meta rejected the key itself;
 * - "error": anything else (failure says what).
 */
export type TierState = "ok" | "off" | "no_permission" | "unsettled" | "throttled" | "key_invalid" | "error";
export type MetaTier = { state: TierState; failure: Failure | null; fetchedAt: string | null };

export type MetaAdsTier = MetaTier & {
  account: { status: number | null; statusName: string | null; timezone: string | null; currency: string | null } | null;
  /** Today in the ad account's time zone when read. */
  today: string | null;
  periods: Partial<Record<PeriodKey, { range: Range; ads: MetaAds; adsPrev: MetaAdsPrev }>>;
  /** Oldest first, every day present: the last 90 full days plus today, in the ad account's time zone. */
  daily: { d: string; spend: number; purchases: number; value: number; lpv: number; atc: number }[];
  /** Last 30 days: each campaign that spent or is active, followed by its ad sets that spent or are active; biggest spend first. */
  campaigns: CampaignRow[];
};
export type MetaPixelTier = MetaTier & {
  windowDays: number;
  lastBrowser: string | null;
  lastServer: string | null;
  /** Sites that sent events in the last 7 days. */
  hosts: string[];
  /** Totals over windowDays, browser and server copies apart. */
  events: { name: string; browser: number; server: number }[];
};
export type MetaSlowTier = MetaTier & {
  /** Event match quality (0–10) by event name; null when not readable with this key. */
  emq: Record<string, number> | null;
  emqState: TierState;
  audiences: { name: string; size: string | null; kind: string | null }[] | null;
  audiencesState: TierState;
  /** Why the audiences could not be read (failure is the tier's worst part, which may be match quality). */
  audiencesFailure: Failure | null;
};
export type MetaSnapshot = {
  configured: boolean;
  ads: MetaAdsTier;
  pixel: MetaPixelTier;
  slow: MetaSlowTier;
  /** Meta's own rate-limit reading from the last call, for owners. */
  rate: { tier: string | null; maxPct: number | null; calls: number };
};

/* --------------------------------------------------- What the page shows */

export type Role = "owner" | "team" | "client";
export type Viewer = { id: string; name: string; username: string; role: Role };

export type SourceChip = { label: string; ok: boolean | null; note: string };
export type AttentionItem = {
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
  owner?: string;
  /** The one action this asks for, used by the weekly read. */
  next?: { title: string; body: string };
};
export type TrackStatus = "ok" | "partial" | "missing" | "blocked" | "unknown";
export type TrackItem = { label: string; status: TrackStatus; detail: string; action?: string; owner?: string; href?: string };
export type Note = { kind: "risk" | "win" | "next"; title: string; body: string };

/** Why a section has no figures, in plain words for the page; null when it has them. */
export type Gap = string | null;

export type DashData = {
  status: {
    /** The older of the two sources' read times, so "Updated" never overstates freshness. */
    updatedAt: string | null;
    sources: SourceChip[];
    attention: AttentionItem[];
    /** "Cairo days", or "Shopify: Cairo days · Meta: <zone> days" when they differ. */
    dayLabel: string;
  };
  periods: Partial<Record<PeriodKey, {
    range: Range | null;
    /** The days Meta's figures cover, when they came from Meta; can differ from range (an older cached read, another time zone). */
    adsRange: Range | null;
    sales: ShopifySales | null;
    prev: { net: Num; orders: Num; aov: Num } | null;
    customers: ShopifyCustomers | null;
    ads: MetaAds | null;
    adsPrev: MetaAdsPrev | null;
    approximate: boolean;
  }>>;
  daily: { days: { d: string; net: Num; orders: Num; spend: Num; purchases: Num; lpv: Num; atc: Num }[]; today: string };
  products: Partial<Record<PeriodKey, ProductRow[]>>;
  sources: Partial<Record<PeriodKey, { source: string; orders: number; net: number }[]>> & { note?: string };
  campaigns: { period: string; rows: CampaignRow[] };
  audience: {
    customers: Num; buyers: Num; repeatBuyers: Num; emailSubscribed: Num; smsSubscribed: Num;
    cities: { name: string; orders: number; net: number }[];
    devices: { name: string; sessions: number; completed: number }[];
    metaAudiences: { name: string; size: string | null; kind: string | null }[];
  };
  tracking: {
    items: TrackItem[];
    pixel: { windowDays: number; lastBrowser: string | null; lastServer: string | null; hosts: string[]; events: { name: string; label: string; browser: number; server: number; emq: Num }[] } | null;
  };
  notes: { headline: string; basis: Range | null; items: Note[] };
  /** Per section, why it is empty (key missing, Meta busy, unpaid account…); the page shows this instead of zeros. */
  gaps: { shopify: Gap; ads: Gap; adsDaily: Gap; pixel: Gap; audiences: Gap; campaigns: Gap };
  /** Owner-only details: source self-checks and Meta's rate-limit reading. Removed for team and client views. */
  admin?: { shopifyChecks: ShopifySnapshot["checks"]; shopifyHidden: ShopifySnapshot["hidden"]; meta: MetaSnapshot["rate"] & { states: Record<string, TierState> } };
};
