import "server-only";
import { unstable_cache } from "next/cache";
import { addDays, dayStartIso, SHOP_TZ, ymdIn } from "./dates";
import { adminGql, adminMissing, adminReady, isDenied, isFatal, messageFor, ShopifyError, type Gql, type GqlError } from "./shopify";
import type { CheckoutRow, OpsSnapshot, OrderRow, ShipState } from "./types";

/**
 * The store's operations, read with the same read-only Admin key as the
 * sales figures (lib/dashboard/shopify.ts): every order of the last 60 days
 * (all an app may read without read_all_orders) with the milestones the
 * courier's app reports back to Shopify, and the abandoned checkouts of the
 * same days. Amounts, dates, statuses, products and the city only: never a
 * name, phone, email or street. The city sits behind Shopify's protected
 * customer data, so it is asked for on its own and its absence only hides
 * the city table.
 */
const LOG = "[dashboard/ops]";
const DAYS = 60;
const MAX_PAGES = 25;

const ORDERS = `query DashOps($q: String!, $after: String) {
  orders(first: 15, after: $after, query: $q, sortKey: CREATED_AT, reverse: true) {
    nodes {
      name
      createdAt
      cancelledAt
      test
      displayFinancialStatus
      displayFulfillmentStatus
      returnStatus
      currentTotalPriceSet { shopMoney { amount } }
      currentSubtotalPriceSet { shopMoney { amount } }
      app { name }
      paymentGatewayNames
      customAttributes { key value }
      fulfillments(first: 2) {
        createdAt
        inTransitAt
        deliveredAt
        displayStatus
        status
        trackingInfo(first: 1) { company }
        events(first: 6, sortKey: HAPPENED_AT, reverse: true) { nodes { status happenedAt } }
      }
      lineItems(first: 8) { nodes { title quantity currentQuantity } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
type Money = { shopMoney: { amount: string } } | null;
type OrderNode = {
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  test: boolean;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  returnStatus: string | null;
  currentTotalPriceSet: Money;
  currentSubtotalPriceSet: Money;
  app: { name: string | null } | null;
  paymentGatewayNames: string[] | null;
  customAttributes: { key: string; value: string | null }[] | null;
  fulfillments: {
    createdAt: string;
    inTransitAt: string | null;
    deliveredAt: string | null;
    displayStatus: string | null;
    status: string | null;
    trackingInfo: { company: string | null }[] | null;
    events: { nodes: { status: string; happenedAt: string }[] } | null;
  }[];
  lineItems: { nodes: { title: string; quantity: number; currentQuantity: number | null }[] } | null;
};

/** Protected customer data: asked apart, so a refusal hides only the cities. */
const ORDER_CITIES = `query DashOpsCities($q: String!, $after: String) {
  orders(first: 100, after: $after, query: $q, sortKey: CREATED_AT, reverse: true) {
    nodes { name shippingAddress { city province } }
    pageInfo { hasNextPage endCursor }
  }
}`;
type CityNode = { name: string; shippingAddress: { city: string | null; province: string | null } | null };

const CHECKOUTS = `query DashCheckouts($q: String!, $after: String) {
  abandonedCheckouts(first: 25, after: $after, query: $q, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      createdAt
      updatedAt
      completedAt
      discountCodes
      customAttributes { key value }
      subtotalPriceSet { shopMoney { amount } }
      totalPriceSet { shopMoney { amount } }
      totalTaxSet { shopMoney { amount } }
      totalDiscountSet { shopMoney { amount } }
      taxesIncluded
      lineItems(first: 8) { nodes { title quantity } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
type CheckoutNode = {
  id: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  discountCodes: string[] | null;
  customAttributes: { key: string; value: string | null }[] | null;
  subtotalPriceSet: Money;
  totalPriceSet: Money;
  totalTaxSet: Money;
  totalDiscountSet: Money;
  taxesIncluded: boolean;
  lineItems: { nodes: { title: string; quantity: number }[] } | null;
};
const CHECKOUT_CITIES = `query DashCheckoutCities($q: String!, $after: String) {
  abandonedCheckouts(first: 50, after: $after, query: $q, sortKey: CREATED_AT, reverse: true) {
    nodes { id shippingAddress { city province } }
    pageInfo { hasNextPage endCursor }
  }
}`;
type CheckoutCityNode = { id: string; shippingAddress: { city: string | null; province: string | null } | null };

type Page<T> = { nodes: T[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } | null;

/** Every page of one connection, newest first, up to MAX_PAGES. */
async function pages<T>(doc: string, root: "orders" | "abandonedCheckouts", q: string): Promise<{ nodes: T[]; errors: GqlError[]; read: boolean }> {
  const nodes: T[] = [];
  const errors: GqlError[] = [];
  let after: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const r: Gql<Record<string, Page<T>>> = await adminGql<Record<string, Page<T>>>(doc, { q, after });
    errors.push(...r.errors);
    const conn: Page<T> = r.data?.[root] ?? null;
    if (!conn) return { nodes, errors, read: false };
    nodes.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) break;
    after = conn.pageInfo.endCursor;
  }
  return { nodes, errors, read: true };
}

const amount = (m: Money) => {
  const n = Number(m?.shopMoney.amount);
  return Number.isFinite(n) ? n : 0;
};

const attr = (list: { key: string; value: string | null }[] | null, key: string) => list?.find((a) => a.key === key)?.value?.trim() || null;

/** The cart attribute the website sets (app/api/checkout): "1"/"true" for Instagram's and Facebook's in-app browsers. */
const inAppOf = (list: { key: string; value: string | null }[] | null) => {
  const v = attr(list, "in_app");
  return v === null ? null : /^(1|true|yes)$/i.test(v);
};

const paymentOf = (gateways: string[] | null): OrderRow["payment"] => {
  const g = (gateways ?? []).join(" ").toLowerCase();
  if (!g) return null;
  if (/cash|cod/.test(g)) return "cod";
  if (/instapay/.test(g)) return "instapay";
  return "other";
};

/** Proper-case a city as couriers and buyers type it ("new cairo", "NEW CAIRO" → "New Cairo"). */
const cityName = (a: { city: string | null; province: string | null } | null) => {
  const raw = (a?.city || a?.province || "").trim().replace(/\s+/g, " ");
  return raw ? raw.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase()) : null;
};

const FAILED_EVENT = new Set(["FAILURE"]);
const FAILED_DISPLAY = new Set(["FAILURE", "NOT_DELIVERED", "CANCELED", "LABEL_VOIDED"]);

/**
 * One order's place on the road. Delivered wins over anything later (a return
 * after delivery is counted as a return, not a failed delivery); a fulfillment
 * the courier marked failed, or an order whose return came back before it was
 * ever delivered, is failed.
 */
function shipState(o: OrderNode): { state: ShipState; returned: boolean } {
  const returned = /RETURNED|INSPECTION_COMPLETE/.test(o.returnStatus ?? "");
  if (o.cancelledAt) return { state: "cancelled", returned };
  const fs = o.fulfillments ?? [];
  if (!fs.length) return { state: "waiting", returned };
  if (fs.some((f) => f.deliveredAt || f.displayStatus === "DELIVERED")) return { state: "delivered", returned };
  const latest = fs.map((f) => f.events?.nodes[0]?.status ?? f.displayStatus ?? "").filter(Boolean);
  if (returned || fs.every((f) => FAILED_DISPLAY.has(f.displayStatus ?? "") || FAILED_EVENT.has(f.events?.nodes[0]?.status ?? ""))) return { state: "failed", returned };
  if (latest.includes("ATTEMPTED_DELIVERY")) return { state: "attempted", returned };
  if (latest.includes("OUT_FOR_DELIVERY")) return { state: "out", returned };
  return { state: "in_transit", returned };
}

function toOrder(o: OrderNode, cities: Map<string, { city: string | null; province: string | null }> | null): OrderRow {
  const fs = [...(o.fulfillments ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const first = fs[0];
  const delivered = fs.map((f) => f.deliveredAt).filter((d): d is string => Boolean(d)).sort()[0] ?? null;
  const events = fs.flatMap((f) => f.events?.nodes ?? []).sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));
  const { state, returned } = shipState(o);
  return {
    name: o.name,
    placedAt: o.createdAt,
    total: amount(o.currentTotalPriceSet),
    subtotal: amount(o.currentSubtotalPriceSet),
    channel: o.app?.name ?? null,
    payment: paymentOf(o.paymentGatewayNames),
    financial: o.displayFinancialStatus,
    state,
    shippedAt: first?.createdAt ?? null,
    inTransitAt: fs.map((f) => f.inTransitAt).filter((d): d is string => Boolean(d)).sort()[0] ?? null,
    deliveredAt: delivered,
    lastEvent: events[0] ? { status: events[0].status, at: events[0].happenedAt } : null,
    attempts: events.filter((e) => e.status === "ATTEMPTED_DELIVERY").length,
    courier: first?.trackingInfo?.[0]?.company ?? null,
    city: cities?.get(o.name)?.city ?? null,
    province: cities?.get(o.name)?.province ?? null,
    returned,
    items: (o.lineItems?.nodes ?? []).map((l) => ({ title: l.title, qty: l.currentQuantity ?? l.quantity })).filter((l) => l.qty > 0),
    inApp: inAppOf(o.customAttributes),
    source: attr(o.customAttributes, "utm_source"),
  };
}

function toCheckout(c: CheckoutNode, cities: Map<string, { hasAddress: boolean; city: string | null }> | null): CheckoutRow {
  const subtotal = amount(c.subtotalPriceSet);
  const total = amount(c.totalPriceSet);
  const tax = c.taxesIncluded ? 0 : amount(c.totalTaxSet);
  const where = cities?.get(c.id) ?? null;
  const fee = Math.round((total - subtotal - tax) * 100) / 100;
  return {
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    completedAt: c.completedAt,
    subtotal,
    total,
    // What is left once the products and any tax are taken out is the delivery fee the checkout showed (an order-level discount
    // code would hide part of it, so with a code the fee reads low, never high); under EGP 1 is rounding, not a fee.
    shipping: fee >= 1 ? fee : 0,
    discount: amount(c.totalDiscountSet),
    discountCodes: c.discountCodes ?? [],
    hasAddress: cities ? (where?.hasAddress ?? false) : null,
    city: where?.city ?? null,
    items: (c.lineItems?.nodes ?? []).map((l) => ({ title: l.title, qty: l.quantity })),
    inApp: inAppOf(c.customAttributes),
    source: attr(c.customAttributes, "utm_source"),
  };
}

const reasonOf = (e: unknown) => messageFor(e instanceof ShopifyError ? e : new ShopifyError("internal", 0));
const deniedReason = (errors: readonly GqlError[], what: string) =>
  errors.some(isDenied) ? `Shopify did not let the app read ${what} (protected customer data, or a permission the app lacks).` : (errors[0]?.message ?? `Shopify sent no ${what}.`).slice(0, 300);

async function read(): Promise<OpsSnapshot> {
  const now = new Date();
  const today = ymdIn(now, SHOP_TZ);
  const since = addDays(today, -(DAYS - 1));
  const snap: OpsSnapshot = { state: "error", failure: null, fetchedAt: now.toISOString(), today, since, orders: [], checkouts: null, hidden: [] };
  if (!adminReady()) {
    snap.state = "off";
    snap.failure = { kind: "not_configured", message: `The Shopify key is not set. Add ${adminMissing().join(", ")} in Vercel, then redeploy.` };
    return snap;
  }
  const q = `created_at:>='${dayStartIso(since, SHOP_TZ)}'`;
  const [orders, orderCities, checkouts, checkoutCities] = await Promise.allSettled([
    pages<OrderNode>(ORDERS, "orders", q),
    pages<CityNode>(ORDER_CITIES, "orders", q),
    pages<CheckoutNode>(CHECKOUTS, "abandonedCheckouts", q),
    pages<CheckoutCityNode>(CHECKOUT_CITIES, "abandonedCheckouts", q),
  ]);
  const fatal = [orders, orderCities, checkouts, checkoutCities].find((s): s is PromiseRejectedResult => s.status === "rejected" && isFatal(s.reason));
  if (fatal) {
    snap.failure = { kind: fatal.reason instanceof ShopifyError ? fatal.reason.kind : "internal", message: reasonOf(fatal.reason) };
    return snap;
  }

  if (orders.status === "rejected" || !orders.value.read) {
    const why = orders.status === "rejected" ? reasonOf(orders.reason) : deniedReason(orders.value.errors, "orders (read_orders)");
    console.error(`${LOG} orders not read`, why);
    snap.failure = { kind: "orders", message: why };
    return snap;
  }
  let cities: Map<string, { city: string | null; province: string | null }> | null = null;
  if (orderCities.status === "fulfilled" && orderCities.value.read && !orderCities.value.errors.some(isDenied)) {
    cities = new Map(orderCities.value.nodes.map((n) => [n.name, { city: cityName(n.shippingAddress), province: n.shippingAddress?.province?.trim() || null }]));
  } else {
    snap.hidden.push({ panel: "Deliveries by city", reason: orderCities.status === "rejected" ? reasonOf(orderCities.reason) : deniedReason(orderCities.value.errors, "delivery addresses") });
  }
  snap.orders = orders.value.nodes.filter((o) => !o.test).map((o) => toOrder(o, cities));

  if (checkouts.status === "fulfilled" && checkouts.value.read) {
    let where: Map<string, { hasAddress: boolean; city: string | null }> | null = null;
    if (checkoutCities.status === "fulfilled" && checkoutCities.value.read && !checkoutCities.value.errors.some(isDenied)) {
      where = new Map(checkoutCities.value.nodes.map((n) => [n.id, { hasAddress: Boolean(n.shippingAddress), city: cityName(n.shippingAddress) }]));
    } else {
      snap.hidden.push({ panel: "How far abandoned checkouts got (address step)", reason: checkoutCities.status === "rejected" ? reasonOf(checkoutCities.reason) : deniedReason(checkoutCities.value.errors, "checkout addresses") });
    }
    snap.checkouts = checkouts.value.nodes.map((c) => toCheckout(c, where));
  } else {
    const why = checkouts.status === "rejected" ? reasonOf(checkouts.reason) : deniedReason(checkouts.value.errors, "abandoned checkouts (read_orders)");
    snap.hidden.push({ panel: "Abandoned checkouts", reason: why });
  }
  snap.state = snap.hidden.length ? "partial" : "ok";
  return snap;
}

/** Failures that pass by themselves: thrown from the cached read so a good entry stays in the cache instead. */
const passes = (kind: string | undefined) => !!kind && (["throttled", "timeout", "unreachable", "bad_response"].includes(kind) || /^(token_)?http_5\d\d$/.test(kind));

class Passing extends Error {
  constructor(readonly snap: OpsSnapshot) {
    super(`ops: ${snap.failure?.message ?? "failed for a moment"}`);
  }
}

const cachedRead = unstable_cache(
  async () => {
    const snap = await read();
    if (snap.state === "error" && passes(snap.failure?.kind)) throw new Passing(snap);
    return snap;
  },
  ["dash-ops-v1", process.env.VERCEL_DEPLOYMENT_ID ?? "local"],
  { revalidate: 600, tags: ["dash-data", "dash-ops"] },
);

/** Orders and abandoned checkouts, cached 10 minutes. Never throws. */
export async function getOpsSnapshot(): Promise<OpsSnapshot> {
  try {
    return await cachedRead();
  } catch (e) {
    if (e instanceof Passing) return e.snap;
    console.error(`${LOG} unexpected failure`, e instanceof Error ? e.message : String(e));
    const today = ymdIn(new Date(), SHOP_TZ);
    return { state: "error", failure: { kind: "internal", message: "Orders could not be read just now." }, fetchedAt: new Date().toISOString(), today, since: addDays(today, -(DAYS - 1)), orders: [], checkouts: null, hidden: [] };
  }
}
