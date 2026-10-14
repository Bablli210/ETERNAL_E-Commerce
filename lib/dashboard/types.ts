/**
 * The shapes the dashboard passes around (/admin, lib/dashboard/*,
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
  /** When a newer read failed for a moment and these figures are from the read before it: when that read failed. */
  heldSince?: string | null;
};

/* ------------------------------------------------- Shopify: orders on the road */

/**
 * Where an order stands between checkout and the customer's door, from its
 * fulfillments as the courier's app reports them back to Shopify:
 * waiting (not shipped yet), in_transit (handed over, moving), out (out for
 * delivery), attempted (a try that failed, still moving), delivered, failed
 * (the courier gave up or it came back), cancelled (the order itself).
 */
export type ShipState = "waiting" | "in_transit" | "out" | "attempted" | "delivered" | "failed" | "cancelled";

/** One order, as the operations sections need it: amounts, dates, the courier's milestones, and no customer detail but the city. */
export type OrderRow = {
  name: string;
  placedAt: string;
  /** Current total after edits and refunds, EGP. */
  total: number;
  /** The products after discounts, before delivery: what the free-delivery threshold is measured on. */
  subtotal: number;
  /** The sales channel: "Eternal Headless" (this website), "Lovable" (the old one), "Online Store"… */
  channel: string | null;
  /** How it is paid: cash on delivery, InstaPay, or anything else. */
  payment: "cod" | "instapay" | "other" | null;
  financial: string | null;
  state: ShipState;
  shippedAt: string | null;
  inTransitAt: string | null;
  deliveredAt: string | null;
  /** The last courier milestone and when, for an order still moving. */
  lastEvent: { status: string; at: string } | null;
  /** Failed delivery attempts the courier reported. */
  attempts: number;
  courier: string | null;
  /** Shipping city; null when the app may not read addresses (protected customer data). */
  city: string | null;
  /** Shipping governorate as Shopify names it ("Cairo", "Giza"); null when addresses can't be read. */
  province?: string | null;
  returned: boolean;
  items: { title: string; qty: number }[];
  /** From the cart attributes the website adds at checkout (app/api/checkout). */
  inApp: boolean | null;
  source: string | null;
};

/** One abandoned checkout: someone gave their contact details at checkout and did not pay. */
export type CheckoutRow = {
  createdAt: string;
  updatedAt: string;
  /** Set when the checkout was finished later (recovered). */
  completedAt: string | null;
  subtotal: number;
  total: number;
  /** total − subtotal − tax: the delivery fee shown, when a shipping rate was chosen; 0 when none was. */
  shipping: number;
  discount: number;
  discountCodes: string[];
  /** Whether an address was entered; null when addresses can't be read. */
  hasAddress: boolean | null;
  city: string | null;
  items: { title: string; qty: number }[];
  inApp: boolean | null;
  source: string | null;
};

/** Orders and abandoned checkouts read through the Admin API (lib/dashboard/ops.ts). */
export type OpsSnapshot = {
  state: "ok" | "partial" | "off" | "error";
  failure: Failure | null;
  fetchedAt: string;
  today: string;
  /** The first day read (Shopify lets the app read 60 days of orders). */
  since: string;
  orders: OrderRow[];
  checkouts: CheckoutRow[] | null;
  hidden: { panel: string; reason: string }[];
};

/* --------------------------------------------------------------- Bosta */

/** One shipment as Bosta reports it (lib/dashboard/bosta.ts). Only fields Bosta actually sent are filled. */
export type BostaRow = {
  tracking: string;
  /** Bosta's business reference: the Shopify order name when the Shopify app made the shipment. */
  reference: string | null;
  state: ShipState | "returned" | "unknown";
  stateLabel: string;
  cod: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  attempts: number | null;
  exception: string | null;
};
export type BostaSnapshot = {
  state: "ok" | "off" | "error";
  failure: Failure | null;
  fetchedAt: string;
  rows: BostaRow[];
  /** Field names Bosta sent on its deliveries, for the owner's check (names only, never values). */
  fields: string[];
};

/* ---------------------------------------------------------------- GA4 */

export type Ga4Totals = { sessions: Num; users: Num; newUsers: Num; engaged: Num; engagementRate: Num; avgSeconds: Num; views: Num };
/** Google Analytics 4 through the Data API (lib/dashboard/ga4.ts), whole Cairo days ending yesterday. */
export type Ga4Snapshot = {
  state: "ok" | "partial" | "off" | "error";
  failure: Failure | null;
  fetchedAt: string;
  periods: Partial<Record<PeriodKey, { totals: Ga4Totals; prev: Ga4Totals | null; events: Record<string, number> }>>;
  daily: { d: string; sessions: number; purchases: number }[];
  /** Last 30 days. */
  channels: { channel: string; sessions: number; engaged: number; purchases: number; revenue: number }[];
  sources: { source: string; sessions: number; purchases: number }[];
  landings: { page: string; sessions: number; engagementRate: number; addToCarts: number; purchases: number }[];
  devices: { device: string; sessions: number; engagementRate: number; checkouts: number; purchases: number }[];
  /** Funnel steps by device, last 30 days: event name → device → count. */
  stepsByDevice: Record<string, Record<string, number>>;
  items: { name: string; views: number; adds: number; checkouts: number; purchases: number; revenue: number }[];
  /** Custom dimensions the site sends, when registered in GA4: the in-app browser split and page speed ratings. */
  inApp: { inApp: string; sessions: number; checkouts: number; purchases: number }[] | null;
  vitals: { metric: string; good: number; needsWork: number; poor: number }[] | null;
  hidden: { panel: string; reason: string }[];
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

/** A finding the rules worked out, with the figures behind it and what to do about it. */
export type Finding = { level: "critical" | "warning" | "info" | "good"; title: string; evidence: string; fix?: string };

/** Orders between checkout and the door, and how the courier is doing (Shopify fulfillments, plus Bosta when connected). */
/** Working days promised after the order day: fastDays in fastGovernorates (Shopify's names), otherDays elsewhere. */
export type DeliveryPromise = { fastDays: number; otherDays: number; fastGovernorates: readonly string[] };

export type DeliveriesView = {
  /** The days the figures cover, e.g. orders placed in the last 60 days. */
  basis: Range;
  now: { waiting: number; waitingValue: number; onTheRoad: number; onTheRoadValue: number; attempted: number; oldestWaitingHours: Num };
  /** Per period, by delivery date (delivered) or order date (the rest). */
  periods: Partial<Record<PeriodKey, { placed: number; placedValue: number; delivered: number; deliveredValue: number; failed: number; failedValue: number; cancelled: number }>>;
  speed: {
    delivered: number;
    /** Order placed → handed to the courier, median hours. */
    toShipHours: Num;
    /** Handed to the courier → delivered, median days. */
    transitDays: Num;
    /** Order placed → delivered, median and slowest tenth, days. */
    toDoorDays: Num;
    toDoorP90: Num;
    /** Share delivered within the promise (working days, Sunday to Thursday), each order held to its governorate's. */
    withinPromise: Num;
    promise: DeliveryPromise;
    /** Share of finished deliveries that failed or came back. */
    failRate: Num;
  };
  byCity: { city: string; delivered: number; days: Num; failed: number }[] | null;
  /** Orders still moving well past the promise, oldest first. */
  late: { name: string; placedAt: string; days: number; state: ShipState; city: string | null; last: string | null }[];
  /** Orders not handed to the courier yet, oldest first. */
  waiting: { name: string; placedAt: string; hours: number; total: number }[];
  bosta: { state: BostaSnapshot["state"]; note: string | null; codCollected: Num; codOnTheRoad: Num; returned: number; exceptions: { reason: string; count: number }[]; attempts: Num } | null;
  says: Finding[];
};

/** Why people reach checkout and leave (abandoned checkouts, and GA4's checkout steps when connected). */
export type CheckoutView = {
  basis: Range;
  /** Storefront "Checkout" taps → Shopify checkout started → shipping → payment → purchase, from GA4; null without GA4. */
  steps: { key: string; label: string; count: number }[] | null;
  abandoned: number;
  abandonedValue: number;
  recovered: number;
  recoveredValue: number;
  /** Orders placed in the same days, for the completion rate. */
  orders: number;
  /** Orders ÷ (orders + abandoned): of the people who gave contact details, how many paid. */
  completion: Num;
  /** How far the abandoned checkouts got. */
  reached: { contact: number; address: number; delivery: number } | null;
  /** Abandoned checkouts that had a delivery fee on screen, and its average. */
  fee: { count: number; average: Num };
  threshold: number | null;
  /** Share of abandoned checkouts and of orders under the free-delivery threshold. */
  under: { abandoned: Num; orders: Num };
  avgValue: { abandoned: Num; orders: Num };
  codes: { count: number; codes: string[] };
  inApp: { abandoned: Num; orders: Num } | null;
  byDevice: { device: string; started: number; purchased: number }[] | null;
  topItems: { title: string; count: number }[];
  says: Finding[];
};

/** How the website itself is doing, from GA4. */
export type WebsiteView = {
  /** since: GA4's first day with a visit when it falls inside the period, so its figures cover fewer days than the period's name says. */
  periods: Partial<Record<PeriodKey, { totals: Ga4Totals; prev: Ga4Totals | null; funnel: { key: string; label: string; count: number }[]; since: string | null }>>;
  /** GA4's first day with a visit in the 90 days read, or null when visits go back further. */
  since: string | null;
  daily: { d: string; sessions: number; purchases: number }[];
  channels: Ga4Snapshot["channels"];
  landings: Ga4Snapshot["landings"];
  devices: Ga4Snapshot["devices"];
  inApp: Ga4Snapshot["inApp"];
  vitals: Ga4Snapshot["vitals"];
  says: Finding[];
};

/** Each scent from first look to the customer's door: GA4 views and adds, Shopify sales, abandoned checkouts, failed deliveries. */
export type ProductHealthRow = {
  title: string;
  line: Line | null;
  views: Num;
  adds: Num;
  addRate: Num;
  checkouts: Num;
  units: Num;
  net: Num;
  abandoned: number;
  failed: number;
  verdict: { kind: "star" | "page" | "checkout" | "delivery" | "quiet"; text: string } | null;
};

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
  deliveries: DeliveriesView | null;
  checkout: CheckoutView | null;
  website: WebsiteView | null;
  productHealth: ProductHealthRow[] | null;
  /** Everything the rules found, most urgent first: the "what to work on" list. */
  workOn: Finding[];
  /** Per section, why it is empty (key missing, Meta busy, unpaid account…); the page shows this instead of zeros. */
  gaps: { shopify: Gap; ads: Gap; adsDaily: Gap; pixel: Gap; audiences: Gap; campaigns: Gap; ops: Gap; checkout: Gap; website: Gap; bosta: Gap };
  /** Owner-only details: source self-checks and Meta's rate-limit reading. Removed for team and client views. */
  admin?: {
    shopifyChecks: ShopifySnapshot["checks"];
    shopifyHidden: ShopifySnapshot["hidden"];
    meta: MetaSnapshot["rate"] & { states: Record<string, TierState> };
    /** The newer readers: what each could not read and why, and the field names Bosta sends (names only). */
    sources?: { name: string; state: string; detail: string }[];
  };
};
