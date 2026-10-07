import { addDays, daysBetween, ymdIn } from "./dates";
import type { Line, ProductRow, ReferrerRow, ShopifyCustomers, ShopifySales } from "./types";

/**
 * The Shopify reports behind the dashboard, with no I/O: what each ShopifyQL
 * report asks for, what to try when Shopify rejects part of one, and how the
 * answers (and, in the reduced mode, raw orders) become the shapes in
 * types.ts. shopify.ts does the talking to Shopify; keeping this apart lets
 * the arithmetic be checked against recorded answers without a key.
 */

/* ------------------------------------------------------------ Report specs */

export type Q = {
  from: "sales" | "sessions" | "customers";
  show: string[];
  groupBy?: string[];
  timeseries?: "day";
  since: string;
  until: string;
  compare?: boolean;
  orderBy?: string;
  limit?: number;
  /** A column's newer or older name to try when Shopify does not know it, before giving the column up. */
  alt?: Record<string, string>;
};

/** One report: the query to try first, simpler variants to fall back on, and the columns it is useless without. */
export type PanelSpec = { key: string; label: string; variants: Q[]; required: string[] };

export function toQL(q: Q): string {
  return [
    `FROM ${q.from}`,
    `SHOW ${q.show.join(", ")}`,
    q.groupBy?.length ? `GROUP BY ${q.groupBy.join(", ")}` : "",
    q.timeseries ? `TIMESERIES ${q.timeseries}` : "",
    `SINCE ${q.since}`,
    `UNTIL ${q.until}`,
    q.compare ? "COMPARE TO previous_period" : "",
    q.orderBy ? `ORDER BY ${q.orderBy}` : "",
    q.limit ? `LIMIT ${q.limit}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * N whole days ending yesterday, in the shop's days. "SINCE -Nd UNTIL -1d"
 * looks the same but counts back from this moment, and was seen to drop
 * yesterday's late order, so the bounds are snapped to midnight.
 */
const wholeDays = (n: number) => ({ since: `startOfDay(-${n}d)`, until: "endOfDay(-1d)" });

export const CUSTOMER_COLUMNS = ["customers", "new_customers", "returning_customers", "returning_customer_rate"];

/** Sales and customers for N whole days, with Shopify's own previous-period figures alongside. */
export const kpiPanel = (n: number): PanelSpec => ({
  key: `k${n}`,
  label: `Sales and customers, last ${n} days`,
  required: ["orders", "net_sales"],
  variants: [
    {
      from: "sales",
      show: ["orders", "gross_sales", "discounts", "sales_reversals", "net_sales", "total_sales", "average_order_value", ...CUSTOMER_COLUMNS],
      ...wholeDays(n),
      compare: true,
      // sales_reversals replaced returns in 2026; returns is only listed as deprecated on 2026-10.
      alt: { sales_reversals: "returns" },
    },
  ],
});

/**
 * Asked only when Shopify refused a customer column in the sales report:
 * new and returning customers from a dimension instead, else new customers
 * alone from the customers dataset.
 */
export const newReturningPanel = (n: number): PanelSpec => ({
  key: `nr${n}`,
  label: `New and returning customers, last ${n} days`,
  required: [],
  variants: [
    { from: "sales", show: ["customers"], groupBy: ["new_or_returning_customer"], ...wholeDays(n) },
    { from: "customers", show: ["new_customer_records"], ...wholeDays(n) },
  ],
});

/** A few spare rows over the 12 shown, since blank titles and return-only rows are dropped afterwards. */
export const productsPanel = (n: number): PanelSpec => ({
  key: `p${n}`,
  label: `Best sellers, last ${n} days`,
  required: ["net_sales"],
  variants: [{ from: "sales", show: ["net_items_sold", "net_sales", "orders"], groupBy: ["product_title"], ...wholeDays(n), orderBy: "net_sales DESC", limit: 20 }],
});

export const referrersPanel = (n: number): PanelSpec => ({
  key: `s${n}`,
  label: `Where orders came from, last ${n} days`,
  required: ["orders", "net_sales"],
  variants: [
    { from: "sales", show: ["orders", "net_sales"], groupBy: ["order_referrer_source", "order_referrer_name"], ...wholeDays(n), orderBy: "net_sales DESC", limit: 50 },
  ],
});

/** The last 90 full days plus today: 91 rows, every day present, today partial. */
export const DAILY_PANEL: PanelSpec = {
  key: "daily",
  label: "Daily sales",
  required: ["orders", "net_sales"],
  variants: [{ from: "sales", show: ["orders", "net_sales"], timeseries: "day", since: "startOfDay(-90d)", until: "today" }],
};

/** Cities are free text, so more rows are read than shown, to merge spellings before taking the top 8. */
export const CITIES_PANEL: PanelSpec = {
  key: "cities",
  label: "Cities",
  required: ["orders", "net_sales"],
  variants: [{ from: "sales", show: ["orders", "net_sales"], groupBy: ["shipping_city"], since: "startOfDay(-89d)", until: "today", orderBy: "net_sales DESC", limit: 50 }],
};

/** Both columns are required: completed checkouts cannot be null in the snapshot, and reading without them would show a false 0. */
export const DEVICES_PANEL: PanelSpec = {
  key: "devices",
  label: "Devices",
  required: ["sessions", "sessions_that_completed_checkout"],
  variants: [{ from: "sessions", show: ["sessions", "sessions_that_completed_checkout"], groupBy: ["session_device_type"], since: "startOfDay(-89d)", until: "today" }],
};

/**
 * Only whether any visit carried a UTM tag. At most one group has all three
 * blank, so any second row means yes and ten rows are plenty.
 */
export const UTM_PANEL: PanelSpec = {
  key: "utm",
  label: "Campaign tags",
  required: ["sessions"],
  variants: [{ from: "sessions", show: ["sessions"], groupBy: ["utm_campaign", "utm_source", "utm_medium"], since: "startOfDay(-30d)", until: "today", limit: 10 }],
};

/** Orders by sales channel over the last 7 full days and today; sales_channel is the older name of the dimension. */
export const CHANNEL_PANEL: PanelSpec = {
  key: "channel7",
  label: "Orders through the old site",
  required: ["orders"],
  variants: [
    { from: "sales", show: ["orders"], groupBy: ["order_sales_channel"], since: "startOfDay(-7d)", until: "today" },
    { from: "sales", show: ["orders"], groupBy: ["sales_channel"], since: "startOfDay(-7d)", until: "today" },
  ],
};

/* ------------------------------------------------- When Shopify says no */

/** Where a report stands: which variant, the query as now asked, and the columns given up on the way. */
export type Attempt = { v: number; q: Q; dropped: string[] };

export const firstAttempt = (p: PanelSpec): Attempt => ({ v: 0, q: structuredClone(p.variants[0]), dropped: [] });

/** Seen verbatim: "Column Not Found: Column 'sales_reversals' not found". */
const MISSING = /\b(?:column|field|metric|dimension)\s+['"`]([^'"`]+)['"`]\s+(?:was\s+)?not\s+found/gi;

/** Every column the parse errors name. Shopify was only seen naming one, but each extra one named saves a round. */
export function missingColumns(parseErrors: readonly string[]): string[] {
  return [...new Set(parseErrors.flatMap((e) => [...e.matchAll(MISSING)].map((m) => m[1])))];
}

/**
 * The next thing to ask after a parse error. Each column Shopify named is
 * tried under its other name, else left out. The customer columns go
 * together: Shopify accepts or refuses them as a family, the new/returning
 * report fills them in, and dropping them one per round could use up every
 * round before the report is read. When a named column cannot go (the
 * report is useless without it, or it is the last one shown or grouped by),
 * the next variant is tried. null means give the report up.
 */
export function degrade(p: PanelSpec, a: Attempt, parseErrors: readonly string[]): Attempt | null {
  const named = missingColumns(parseErrors);
  const q: Q = { ...a.q, show: [...a.q.show], groupBy: a.q.groupBy && [...a.q.groupBy], alt: a.q.alt && { ...a.q.alt } };
  const dropped = [...a.dropped];
  let fixed = named.length > 0;
  for (const col of named) {
    const alt = q.alt?.[col];
    if (q.alt && alt && q.show.includes(col)) {
      q.show = q.show.map((c) => (c === col ? alt : c));
      delete q.alt[col];
      continue;
    }
    const gone = (CUSTOMER_COLUMNS.includes(col) ? CUSTOMER_COLUMNS : [col]).filter((c) => q.show.includes(c) || q.groupBy?.includes(c));
    const show = q.show.filter((c) => !gone.includes(c));
    const groupBy = q.groupBy?.filter((c) => !gone.includes(c));
    if (!gone.length || gone.some((c) => p.required.includes(c)) || !show.length || (q.groupBy?.length && !groupBy?.length)) {
      fixed = false;
      break;
    }
    q.show = show;
    q.groupBy = groupBy;
    if (q.orderBy && gone.includes(q.orderBy.split(" ")[0])) q.orderBy = undefined;
    dropped.push(...gone);
  }
  if (fixed) return { v: a.v, q, dropped };
  if (a.v + 1 < p.variants.length) return { v: a.v + 1, q: structuredClone(p.variants[a.v + 1]), dropped: [] };
  return null;
}

/* ------------------------------------------------------------- Row parsing */

export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;
export type Table = { columns: string[]; rows: Row[] };

const cell = (v: unknown): Cell => (v == null || typeof v === "object" ? null : (v as Cell));

/**
 * Admin API rows are objects keyed by column name, numbers as strings and
 * blanks as null. The connector's array form (blanks as "") is accepted too,
 * by position, so a recorded answer from either can be replayed.
 */
export function toTable(t: { columns?: { name: string }[] | null; rows?: unknown } | null | undefined): Table | null {
  if (!t || !Array.isArray(t.rows)) return null;
  const columns = (t.columns ?? []).map((c) => c.name);
  const rows = t.rows.map((r: unknown): Row => {
    if (Array.isArray(r)) return Object.fromEntries(columns.map((c, i) => [c, cell(r[i])]));
    if (r && typeof r === "object") return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, cell(v)]));
    return {};
  });
  return { columns, rows };
}

export const num = (v: Cell | undefined): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const money = (v: Cell | number | undefined): number | null => {
  const n = num(v);
  return n == null ? null : Math.round(n * 100) / 100;
};
const ratio = (v: Cell | number | undefined): number | null => {
  const n = num(v);
  return n == null ? null : Math.round(n * 10000) / 10000;
};
/** A dimension value as Shopify sent it, with blank meaning unknown. */
const raw = (v: Cell | undefined): string | null => (v == null || v === "" ? null : String(v));

const has = (t: Table, col: string) => t.columns.includes(col) || t.rows.some((r) => col in r);
const prevCol = (col: string) => `comparison_${col}__previous_period`;

/* ------------------------------------------------------------ Sales & customers */

export type Kpi = {
  sales: ShopifySales;
  prev: { net: number | null; orders: number | null; aov: number | null } | null;
  customers: ShopifyCustomers | null;
};

/**
 * One period's sales report. discounts and returns stay negative as Shopify
 * sends them (net = gross + discounts + returns), and AOV is Shopify's,
 * which leaves returns out. nr is the new/returning report, read only when
 * Shopify refused a customer column here.
 */
export function mapKpi(t: Table, nr: Table | null): Kpi {
  const r = t.rows[0] ?? {};
  const returnsCol = has(t, "sales_reversals") ? "sales_reversals" : "returns";
  const sales: ShopifySales = {
    net: money(r.net_sales),
    total: money(r.total_sales),
    gross: money(r.gross_sales),
    discounts: money(r.discounts),
    returns: money(r[returnsCol]),
    orders: num(r.orders),
    aov: money(r.average_order_value),
  };
  const prev = ["net_sales", "orders", "average_order_value"].some((c) => has(t, prevCol(c)))
    ? { net: money(r[prevCol("net_sales")]), orders: num(r[prevCol("orders")]), aov: money(r[prevCol("average_order_value")]) }
    : null;

  const c: ShopifyCustomers = {
    customers: num(r.customers),
    newCustomers: num(r.new_customers),
    returning: num(r.returning_customers),
    returningRate: ratio(r.returning_customer_rate),
  };
  if (nr) {
    if (has(nr, "new_or_returning_customer")) {
      const group = (name: string) => nr.rows.find((x) => String(x.new_or_returning_customer ?? "").toLowerCase() === name);
      // A group that is absent had nobody in it.
      c.newCustomers ??= num(group("new")?.customers) ?? 0;
      c.returning ??= num(group("returning")?.customers) ?? 0;
    } else {
      c.newCustomers ??= num(nr.rows[0]?.new_customer_records);
    }
    // New + returning can exceed customers (one person can be both), so the rate needs the distinct count.
    if (c.returningRate == null && c.returning != null && c.customers) c.returningRate = ratio(c.returning / c.customers);
  }
  const customers = Object.values(c).some((v) => v != null) ? c : null;
  return { sales, prev, customers };
}

/** The last day the daily report covers: Shopify's own "today". */
export function lastDay(t: Table): string | null {
  const days = t.rows.map((r) => raw(r.day)?.slice(0, 10)).filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d));
  return days.length ? days.sort().at(-1)! : null;
}

/** 91 days ending today, oldest first; a day Shopify left out had no sales. */
export function mapDaily(t: Table, today: string): { d: string; net: number; orders: number }[] {
  const byDay = new Map<string, Row>();
  for (const r of t.rows) {
    const d = raw(r.day)?.slice(0, 10);
    if (d) byDay.set(d, r);
  }
  return daysBetween(addDays(today, -90), today).map((d) => {
    const r = byDay.get(d);
    return { d, net: money(r?.net_sales) ?? 0, orders: num(r?.orders) ?? 0 };
  });
}

/* ---------------------------------------------------------------- Products */

/**
 * Product lines come from tags. Exact matches only: "eterna" is a prefix of
 * "eternal". The line names win over the audience tags.
 */
const LINE_TAGS: [string, Line][] = [
  ["eterna", "eterna"],
  ["eterno", "eterno"],
  ["eternal", "eternal"],
  ["for her", "eterna"],
  ["for him", "eterno"],
  ["unisex", "eternal"],
];

export function lineOf(tags: readonly string[]): Line | null {
  const set = new Set(tags.map((t) => t.trim().toLowerCase()));
  return LINE_TAGS.find(([tag]) => set.has(tag))?.[1] ?? null;
}

export const titleKey = (title: string) => title.trim().toLowerCase();

/** Product title → line, from the catalog; the first product with a line wins when titles repeat. */
export function lineMap(products: readonly { title: string; tags: readonly string[] }[]): Map<string, Line | null> {
  const out = new Map<string, Line | null>();
  for (const p of products) {
    const key = titleKey(p.title);
    if (!out.get(key)) out.set(key, lineOf(p.tags));
  }
  return out;
}

type ProductTally = { title: string | null; units: number | null; orders: number | null; net: number | null };

/** Best first, at most 12, without blank titles or rows that are only a return (no order, no positive net). */
function topProducts(rows: ProductTally[], lines: Map<string, Line | null> | null): ProductRow[] {
  return rows
    .filter((r): r is ProductTally & { title: string } => !!r.title && !((r.orders ?? 0) === 0 && (r.net ?? 0) <= 0))
    .sort((a, b) => (b.net ?? 0) - (a.net ?? 0))
    .slice(0, 12)
    .map((r) => ({ title: r.title, line: lines?.get(titleKey(r.title)) ?? null, units: r.units, orders: r.orders, net: money(r.net) }));
}

export function mapProducts(t: Table, lines: Map<string, Line | null> | null): ProductRow[] {
  return topProducts(
    t.rows.map((r) => ({ title: raw(r.product_title)?.trim() || null, units: num(r.net_items_sold), orders: num(r.orders), net: money(r.net_sales) })),
    lines,
  );
}

/* ----------------------------------------------------------------- Sources */

/** Source and name stay as Shopify sent them; the page gives them labels. */
export function mapReferrers(t: Table): ReferrerRow[] {
  return t.rows
    .map((r) => ({ source: raw(r.order_referrer_source), name: raw(r.order_referrer_name), orders: num(r.orders) ?? 0, net: money(r.net_sales) ?? 0 }))
    .filter((r) => !(r.orders === 0 && r.net <= 0))
    .sort((a, b) => b.net - a.net || b.orders - a.orders);
}

/* ------------------------------------------------------------------ Cities */

/**
 * Buyers type their city, in English or Arabic, in many spellings. These
 * cover the obvious ones for Egypt's main places; matching runs on a folded
 * form (lower case, Arabic-Indic digits as 0-9, hamza, alef maqsura and taa
 * marbuta unified, punctuation as spaces).
 */
const KNOWN_CITIES: [string, RegExp][] = [
  ["6th of October", /^(?:(?:the )?(?:6|sixth)(?:th)? ?(?:of )?)?october(?: city)?$|^(?:مدينه )?(?:6 ?|السادس من )?اكتوبر$/],
  ["Sheikh Zayed", /^(?:(?:el|al) ?)?sh[aeiy]{1,3}kh ?zay[ae]d(?: city)?$|^(?:مدينه )?(?:ال)?شيخ ?زايد$/],
  ["Kafr El Sheikh", /^kafr ?(?:(?:el|al) ?)?sh[aeiy]{1,3}kh$|^كفر ?(?:ال)?شيخ$/],
  ["Sharm El Sheikh", /^sharm(?: (?:(?:el|al) ?)?sh[aeiy]{1,3}kh)?$|^شرم ?(?:ال)?شيخ$/],
  ["Cairo", /^(?:cairo|(?:el|al) ?qahira)$|^(?:ال)?قاهره$/],
  ["New Cairo", /^new cairo(?: city)?$|^(?:ال)?قاهره (?:ال)?جديده$/],
  ["Fifth Settlement", /^(?:the )?(?:5th|fifth) settlement$|^(?:ال)?تجمع (?:ال)?خامس$/],
  ["Nasr City", /^(?:nasr(?: city)?|madinat nasr)$|^مدينه نصر$/],
  ["Heliopolis", /^(?:heliopolis|masr (?:el|al) ?gedida)$|^مصر (?:ال)?جديده$/],
  ["Maadi", /^(?:(?:el|al) ?)?maadi$|^(?:ال)?معادي$/],
  ["Giza", /^(?:(?:el|al) ?)?gizah?$|^(?:ال)?جيزه$/],
  ["Alexandria", /^alex(?:andria)?$|^(?:ال)?اسكندريه$/],
  ["Hurghada", /^(?:hurghada|(?:el|al) ?ghardaqa)$|^(?:ال)?غردقه$/],
  ["Mansoura", /^(?:(?:el|al) ?)?mansoura?h?$|^(?:ال)?منصوره$/],
  ["Tanta", /^tanta$|^طنطا$/],
  ["Zagazig", /^(?:(?:el|al) ?)?zagazig$|^(?:ال)?زقازيق$/],
  ["Ismailia", /^(?:(?:el|al) ?)?ismailia$|^(?:ال)?اسماعيليه$/],
  ["Port Said", /^port ?said$|^بور ?سعيد$/],
  ["Suez", /^(?:(?:el|al) ?)?suez$|^(?:ال)?سويس$/],
];

const ARABIC = /[؀-ۿ]/;

const foldCity = (s: string) =>
  s
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[.,'’`_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SMALL_WORDS = new Set(["of", "and"]);
const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

/** The name a city is shown under: a known place's English name, else Latin names title-cased and Arabic as typed. */
export function cityName(input: string): string | null {
  const s = input.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (!s) return null;
  const folded = foldCity(s);
  const known = KNOWN_CITIES.find(([, re]) => re.test(folded));
  if (known) return known[0];
  return ARABIC.test(s) ? s : titleCase(s);
}

export function mapCities(t: Table): { name: string; orders: number; net: number }[] {
  const merged = new Map<string, { name: string; orders: number; net: number }>();
  for (const r of t.rows) {
    const name = cityName(raw(r.shipping_city) ?? "");
    if (!name) continue;
    const e = merged.get(name) ?? { name, orders: 0, net: 0 };
    e.orders += num(r.orders) ?? 0;
    e.net += num(r.net_sales) ?? 0;
    merged.set(name, e);
  }
  return [...merged.values()]
    .map((e) => ({ ...e, net: money(e.net) ?? 0 }))
    .sort((a, b) => b.net - a.net || b.orders - a.orders)
    .slice(0, 8);
}

/* -------------------------------------------------------- Devices, UTMs, channel */

const DEVICE_NAMES: Record<string, string> = { mobile: "Mobile", desktop: "Desktop", tablet: "Tablet" };

export function mapDevices(t: Table): { name: string; sessions: number; completed: number }[] {
  const merged = new Map<string, { name: string; sessions: number; completed: number }>();
  for (const r of t.rows) {
    const name = DEVICE_NAMES[String(r.session_device_type ?? "").trim().toLowerCase()] ?? "Other";
    const e = merged.get(name) ?? { name, sessions: 0, completed: 0 };
    e.sessions += num(r.sessions) ?? 0;
    e.completed += num(r.sessions_that_completed_checkout) ?? 0;
    merged.set(name, e);
  }
  return [...merged.values()].sort((a, b) => b.sessions - a.sessions);
}

export const hasUtm = (t: Table): boolean =>
  t.rows.some((r) => ["utm_campaign", "utm_source", "utm_medium"].some((c) => raw(r[c]) != null) && (num(r.sessions) ?? 1) > 0);

/** The old Lovable site still checks out through its own Shopify sales channel. */
const OLD_SITE = /^lovable$/i;

export function oldSiteOrders(t: Table): number {
  return t.rows
    .filter((r) => OLD_SITE.test(String(r.order_sales_channel ?? r.sales_channel ?? "").trim()))
    .reduce((s, r) => s + Math.max(0, num(r.orders) ?? 0), 0);
}

/* ------------------------------------------- Reduced mode: rebuilt from orders */

type MoneyBag = { shopMoney: { amount: string } | null } | null;

/** One order as the reduced mode reads it: amounts and a customer id, never a name, email, phone or address. */
export type OrderNode = {
  createdAt: string;
  test: boolean;
  subtotalPriceSet: MoneyBag;
  totalDiscountsSet: MoneyBag;
  currentSubtotalPriceSet: MoneyBag;
  customer: { id: string; numberOfOrders: string | number } | null;
  app: { name: string | null } | null;
};

export type LineOrderNode = {
  createdAt: string;
  test: boolean;
  lineItems: {
    nodes: { title: string | null; quantity: number; currentQuantity: number; discountedUnitPriceAfterAllDiscountsSet: MoneyBag }[];
  } | null;
};

const amount = (m: MoneyBag) => Number(m?.shopMoney?.amount ?? 0) || 0;

/** The orders placed on the days from..to (inclusive) in the shop's time zone, test orders left out. */
export const ordersOn = <T extends { createdAt: string; test: boolean }>(nodes: readonly T[], tz: string, from: string, to: string) =>
  nodes.filter((o) => {
    if (o.test) return false;
    const d = ymdIn(new Date(o.createdAt), tz);
    return d >= from && d <= to;
  });

/**
 * A period's figures from its orders. They reconciled exactly with
 * ShopifyQL over one 30-day window, with two differences that make them
 * approximate: a return counts on the order's day, not the return's, and
 * "new" uses each customer's lifetime order count as of now. Total sales
 * (with shipping and taxes) is not rebuilt. customersKnown is false when
 * Shopify withheld the customer field.
 */
export function aggregateOrders(nodes: readonly OrderNode[], customersKnown: boolean): { sales: ShopifySales; customers: ShopifyCustomers | null } {
  const orders = nodes.length;
  const discounts = -nodes.reduce((s, o) => s + amount(o.totalDiscountsSet), 0);
  const gross = nodes.reduce((s, o) => s + amount(o.subtotalPriceSet) + amount(o.totalDiscountsSet), 0);
  const returns = -nodes.reduce((s, o) => s + amount(o.subtotalPriceSet) - amount(o.currentSubtotalPriceSet), 0);
  const net = nodes.reduce((s, o) => s + amount(o.currentSubtotalPriceSet), 0);
  const sales: ShopifySales = {
    net: money(net),
    total: null,
    gross: money(gross),
    discounts: money(discounts),
    returns: money(returns),
    orders,
    aov: orders ? money((gross + discounts) / orders) : null,
  };
  if (!customersKnown) return { sales, customers: null };
  const per = new Map<string, { inWindow: number; lifetime: number }>();
  for (const o of nodes) {
    if (!o.customer) continue;
    const e = per.get(o.customer.id) ?? { inWindow: 0, lifetime: Number(o.customer.numberOfOrders) || 0 };
    e.inWindow++;
    per.set(o.customer.id, e);
  }
  const all = [...per.values()];
  const returning = all.filter((e) => e.lifetime > e.inWindow || e.inWindow >= 2).length;
  return {
    sales,
    customers: {
      customers: per.size,
      newCustomers: all.filter((e) => e.lifetime === e.inWindow).length,
      returning,
      returningRate: per.size ? ratio(returning / per.size) : null,
    },
  };
}

/** 91 days ending today; a day without orders shows 0, including days older than the orders Shopify lets the app read. */
export function ordersDaily(nodes: readonly OrderNode[], tz: string, today: string): { d: string; net: number; orders: number }[] {
  const byDay = new Map<string, { net: number; orders: number }>();
  for (const o of nodes) {
    if (o.test) continue;
    const d = ymdIn(new Date(o.createdAt), tz);
    const e = byDay.get(d) ?? { net: 0, orders: 0 };
    e.net += amount(o.currentSubtotalPriceSet);
    e.orders++;
    byDay.set(d, e);
  }
  return daysBetween(addDays(today, -90), today).map((d) => {
    const e = byDay.get(d);
    return { d, net: money(e?.net ?? 0) ?? 0, orders: e?.orders ?? 0 };
  });
}

/**
 * Best sellers from order lines: units still in the order, at the price
 * after every discount. Only the first 10 lines of an order are read, plenty
 * for this shop's baskets.
 */
export function productsFromLines(orders: readonly LineOrderNode[], lines: Map<string, Line | null> | null): ProductRow[] {
  const tally = new Map<string, ProductTally & { title: string }>();
  for (const o of orders) {
    const seen = new Set<string>();
    for (const li of o.lineItems?.nodes ?? []) {
      const title = li.title?.trim();
      if (!title) continue;
      const e = tally.get(title) ?? { title, units: 0, orders: 0, net: 0 };
      e.units = (e.units ?? 0) + li.currentQuantity;
      e.net = (e.net ?? 0) + amount(li.discountedUnitPriceAfterAllDiscountsSet) * li.currentQuantity;
      if (li.currentQuantity > 0 && !seen.has(title)) {
        seen.add(title);
        e.orders = (e.orders ?? 0) + 1;
      }
      tally.set(title, e);
    }
  }
  return topProducts([...tally.values()], lines);
}

export const isOldSiteApp = (name: string | null | undefined) => OLD_SITE.test((name ?? "").trim());
