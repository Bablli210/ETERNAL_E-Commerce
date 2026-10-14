import { addDays, fullDays, prevDays, SHOP_TZ, ymdIn } from "./dates";
import { itemKey } from "./item-key";
import {
  PERIOD_KEYS,
  type BostaSnapshot,
  type CheckoutView,
  type DeliveriesView,
  type DeliveryPromise,
  type Finding,
  type Ga4Snapshot,
  type OpsSnapshot,
  type OrderRow,
  type ProductHealthRow,
  type ProductRow,
  type ShipState,
  type WebsiteView,
} from "./types";

/**
 * What the operations, checkout and website figures say, worked out by fixed
 * rules (no model): each section's numbers, then findings that cite those
 * numbers and say what to do. A rule needs enough cases to mean something
 * (MIN_CASES) and stays quiet otherwise, so a slow week never reads as a
 * crisis. Pure arithmetic over the cached snapshots, run on every page view.
 */

const MIN_CASES = 5;
const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const egp = (v: number) => `EGP ${fmt.format(Math.round(v))}`;
/** Whole percents, but one decimal under 10% so a 0.4% conversion never reads as 0%. */
const pct = (v: number) => (v > 0 && v < 0.1 ? `${fmt1.format(v * 100)}%` : `${fmt.format(Math.round(v * 100))}%`);
/** "10 Oct". */
const dayLabel = (ymd: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${ymd}T12:00:00Z`));
const days1 = (v: number) => `${fmt1.format(v)} ${v === 1 ? "day" : "days"}`;
const plural = (n: number, one: string, many = `${one}s`) => `${fmt.format(n)} ${n === 1 ? one : many}`;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const HOUR = 3_600_000;
const hoursBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / HOUR;

function quantile(values: number[], q: number): number | null {
  const v = values.filter(isNum).sort((a, b) => a - b);
  if (!v.length) return null;
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}
const median = (v: number[]) => quantile(v, 0.5);
const share = (part: number, whole: number) => (whole > 0 ? part / whole : null);

/** Cairo's working days for couriers: Sunday to Thursday. */
const isWorkDay = (ymd: string) => new Date(`${ymd}T12:00:00Z`).getUTCDay() <= 4;
/** Working days after the day an order was placed, up to and including the day it arrived (same day = 0). */
function workingDays(fromIso: string, toIso: string): number {
  const from = ymdIn(new Date(fromIso), SHOP_TZ);
  const to = ymdIn(new Date(toIso), SHOP_TZ);
  let n = 0;
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) if (isWorkDay(d)) n++;
  return n;
}
const dayOf = (iso: string) => ymdIn(new Date(iso), SHOP_TZ);
const inRange = (iso: string | null, r: { from: string; to: string }) => !!iso && dayOf(iso) >= r.from && dayOf(iso) <= r.to;

const MOVING: ShipState[] = ["in_transit", "out", "attempted"];
const EVENT_WORDS: Record<string, string> = {
  IN_TRANSIT: "in transit",
  OUT_FOR_DELIVERY: "out for delivery",
  ATTEMPTED_DELIVERY: "delivery attempted",
  DELAYED: "delayed",
  CARRIER_PICKED_UP: "picked up by the courier",
  LABEL_PRINTED: "label printed",
  LABEL_PURCHASED: "label made",
  CONFIRMED: "handed to the courier",
  READY_FOR_PICKUP: "ready for pickup",
  FAILURE: "failed",
};

/* ------------------------------------------------------------- Deliveries */

/** The working days an order was promised: its governorate's zone, or the fast figure when the governorate isn't known. */
const promisedDays = (p: DeliveryPromise, province: string | null | undefined) =>
  !province || p.fastGovernorates.some((g) => g.toLowerCase() === province.toLowerCase()) ? p.fastDays : p.otherDays;

/** "the 2 working days promise", or "the delivery promise" when it differs by governorate. */
const promiseName = (p: DeliveryPromise) => (p.fastDays === p.otherDays ? `the ${p.fastDays} working ${p.fastDays === 1 ? "day" : "days"} promise` : "the delivery promise");

export function deliveriesView(ops: OpsSnapshot, bosta: BostaSnapshot | null, promise: DeliveryPromise): DeliveriesView {
  const today = ops.today;
  const now = new Date().toISOString();
  const live = ops.orders.filter((o) => o.state !== "cancelled");
  const waiting = live.filter((o) => o.state === "waiting");
  const moving = live.filter((o) => MOVING.includes(o.state));
  const delivered = live.filter((o) => o.state === "delivered" && o.deliveredAt);
  const failed = live.filter((o) => o.state === "failed");
  const sum = (list: OrderRow[]) => list.reduce((s, o) => s + o.total, 0);

  const periods: DeliveriesView["periods"] = {};
  for (const k of PERIOD_KEYS) {
    const r = fullDays(Number(k), today);
    const from = r.from < ops.since ? ops.since : r.from;
    const range = { from, to: r.to };
    const placed = live.filter((o) => inRange(o.placedAt, range));
    const got = delivered.filter((o) => inRange(o.deliveredAt, range));
    const lost = failed.filter((o) => inRange(o.lastEvent?.at ?? o.placedAt, range));
    periods[k] = {
      placed: placed.length,
      placedValue: sum(placed),
      delivered: got.length,
      deliveredValue: sum(got),
      failed: lost.length,
      failedValue: sum(lost),
      cancelled: ops.orders.filter((o) => o.state === "cancelled" && inRange(o.placedAt, range)).length,
    };
  }

  const toShip = live.filter((o) => o.shippedAt).map((o) => hoursBetween(o.placedAt, o.shippedAt!));
  const transit = delivered.filter((o) => o.shippedAt).map((o) => hoursBetween(o.shippedAt!, o.deliveredAt!) / 24);
  const toDoor = delivered.map((o) => hoursBetween(o.placedAt, o.deliveredAt!) / 24);
  const onTime = delivered.filter((o) => workingDays(o.placedAt, o.deliveredAt!) <= promisedDays(promise, o.province)).length;
  const finished = delivered.length + failed.length;

  const known = live.filter((o) => o.city);
  let byCity: DeliveriesView["byCity"] = null;
  if (known.length) {
    const cities = new Map<string, { delivered: number; days: number[]; failed: number }>();
    for (const o of known) {
      if (o.state !== "delivered" && o.state !== "failed") continue;
      const c = cities.get(o.city!) ?? { delivered: 0, days: [], failed: 0 };
      if (o.state === "delivered" && o.deliveredAt) {
        c.delivered++;
        c.days.push(hoursBetween(o.placedAt, o.deliveredAt) / 24);
      } else c.failed++;
      cities.set(o.city!, c);
    }
    byCity = [...cities.entries()]
      .map(([city, c]) => ({ city, delivered: c.delivered, days: median(c.days), failed: c.failed }))
      .sort((a, b) => b.delivered + b.failed - (a.delivered + a.failed))
      .slice(0, 10);
  }

  const late = moving
    .filter((o) => workingDays(o.placedAt, now) > promisedDays(promise, o.province))
    .sort((a, b) => a.placedAt.localeCompare(b.placedAt))
    .map((o) => ({
      name: o.name,
      placedAt: o.placedAt,
      days: Math.floor(hoursBetween(o.placedAt, now) / 24),
      state: o.state,
      city: o.city,
      last: o.lastEvent ? `${EVENT_WORDS[o.lastEvent.status] ?? o.lastEvent.status.toLowerCase().replace(/_/g, " ")}, ${dayOf(o.lastEvent.at)}` : null,
    }));
  const waitingList = waiting
    .map((o) => ({ name: o.name, placedAt: o.placedAt, hours: Math.floor(hoursBetween(o.placedAt, now)), total: o.total }))
    .sort((a, b) => b.hours - a.hours);

  let bostaPart: DeliveriesView["bosta"] = null;
  if (bosta) {
    const rows = bosta.rows;
    const codOf = (states: string[]) => rows.filter((r) => states.includes(r.state) && isNum(r.cod)).reduce((s, r) => s + (r.cod ?? 0), 0);
    const reasons = new Map<string, number>();
    for (const r of rows) if (r.exception) reasons.set(r.exception, (reasons.get(r.exception) ?? 0) + 1);
    const tries = rows.map((r) => r.attempts).filter(isNum);
    bostaPart = {
      state: bosta.state,
      note: bosta.state === "ok" ? null : (bosta.failure?.message ?? null),
      codCollected: bosta.state === "ok" ? codOf(["delivered"]) : null,
      codOnTheRoad: bosta.state === "ok" ? codOf(["in_transit", "out", "attempted", "waiting"]) : null,
      returned: rows.filter((r) => r.state === "returned").length,
      exceptions: [...reasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      attempts: tries.length ? tries.reduce((s, n) => s + n, 0) / tries.length : null,
    };
  }

  const view: DeliveriesView = {
    basis: { from: ops.since, to: today },
    now: {
      waiting: waiting.length,
      waitingValue: sum(waiting),
      onTheRoad: moving.length,
      onTheRoadValue: sum(moving),
      attempted: moving.filter((o) => o.state === "attempted").length,
      oldestWaitingHours: waitingList[0]?.hours ?? null,
    },
    periods,
    speed: {
      delivered: delivered.length,
      toShipHours: median(toShip),
      transitDays: median(transit),
      toDoorDays: median(toDoor),
      toDoorP90: quantile(toDoor, 0.9),
      withinPromise: share(onTime, delivered.length),
      promise,
      failRate: share(failed.length, finished),
    },
    byCity,
    late,
    waiting: waitingList,
    bosta: bostaPart,
    says: [],
  };
  view.says = deliveryFindings(view, finished);
  return view;
}

function deliveryFindings(v: DeliveriesView, finished: number): Finding[] {
  const out: Finding[] = [];
  const s = v.speed;
  const promise = promiseName(s.promise);
  const stale = v.waiting.filter((w) => w.hours >= 24);
  if (stale.length)
    out.push({
      level: stale.some((w) => w.hours >= 48) ? "critical" : "warning",
      title: `${plural(stale.length, "order")} waiting to be handed to the courier`,
      evidence: `${stale.slice(0, 4).map((w) => `${w.name} (${Math.round(w.hours)} h)`).join(", ")}${stale.length > 4 ? "…" : ""}. Every day here comes out of the delivery promise.`,
      fix: "Hand them to Bosta today, or tell the customers on WhatsApp when they will ship.",
    });
  if (v.late.length)
    out.push({
      level: "warning",
      title: `${plural(v.late.length, "order")} past ${promise} and still moving`,
      evidence: v.late
        .slice(0, 4)
        .map((l) => `${l.name}, ${plural(l.days, "day")}${l.last ? ` (${l.last})` : ""}`)
        .join("; "),
      fix: "Chase these with Bosta and message the customers before they ask.",
    });
  if (s.delivered >= MIN_CASES && isNum(s.withinPromise)) {
    if (s.withinPromise < 0.8)
      out.push({
        level: "warning",
        title: `Only ${pct(s.withinPromise)} of deliveries keep ${promise}`,
        evidence: `Order to door takes ${days1(s.toDoorDays ?? 0)} in the middle case and ${days1(s.toDoorP90 ?? 0)} for the slowest tenth (${plural(s.delivered, "delivery", "deliveries")}). Of that, the wait before Bosta collects is ${fmt.format(Math.round(s.toShipHours ?? 0))} h.`,
        fix: (s.toShipHours ?? 0) >= 24 ? "Most of the delay is before Bosta collects: book pickups daily." : "Raise the delays with Bosta, or promise what is real on the site so reviews stay kind.",
      });
    else
      out.push({ level: "good", title: `${pct(s.withinPromise)} of deliveries arrive within ${promise}`, evidence: `Order to door takes ${days1(s.toDoorDays ?? 0)} in the middle case, across ${plural(s.delivered, "delivery", "deliveries")}.` });
  }
  if (finished >= MIN_CASES && isNum(s.failRate) && s.failRate >= 0.1) {
    const worst = (v.byCity ?? []).filter((c) => c.failed >= 2).sort((a, b) => b.failed - a.failed)[0];
    out.push({
      level: s.failRate >= 0.2 ? "critical" : "warning",
      title: `${pct(s.failRate)} of deliveries fail or come back`,
      evidence: `With cash on delivery a failed delivery costs the shipping both ways and the sale.${worst ? ` ${worst.city} has the most (${worst.failed}).` : ""}${v.bosta?.exceptions[0] ? ` Bosta's top reason: "${v.bosta.exceptions[0].reason}".` : ""}`,
      fix: "Confirm every cash-on-delivery order on WhatsApp before it ships, and ask for a landmark with the address.",
    });
  }
  if (v.now.onTheRoadValue > 0)
    out.push({
      level: "info",
      title: `${egp(v.now.onTheRoadValue)} is on the road`,
      evidence: `${plural(v.now.onTheRoad, "order")} with the courier, not yet delivered${v.now.attempted ? `, ${v.now.attempted} after a failed attempt` : ""}. With cash on delivery this is money not yet collected.`,
    });
  return out;
}

/* ------------------------------------------------------------- Checkout */

const STEP_LABELS: [string, string][] = [
  ["checkout_click", "Tapped Checkout in the bag"],
  ["begin_checkout", "Checkout opened"],
  ["add_shipping_info", "Delivery details given"],
  ["add_payment_info", "Payment chosen"],
  ["purchase", "Ordered"],
];

export function checkoutView(ops: OpsSnapshot, ga4: Ga4Snapshot | null, threshold: number | null): CheckoutView | null {
  if (!ops.checkouts) return null;
  const range = { from: addDays(ops.today, -29), to: ops.today };
  const all = ops.checkouts.filter((c) => inRange(c.createdAt, range));
  const left = all.filter((c) => !c.completedAt);
  const back = all.filter((c) => c.completedAt);
  const orders = ops.orders.filter((o) => o.state !== "cancelled" && inRange(o.placedAt, range));
  const sumSub = (l: { subtotal: number }[]) => l.reduce((s, x) => s + x.subtotal, 0);
  const addressKnown = left.every((c) => c.hasAddress !== null);
  const feeSeen = left.filter((c) => c.shipping > 0);
  const knownIn = (l: { inApp: boolean | null }[]) => l.filter((x) => x.inApp !== null);
  const items = new Map<string, { title: string; count: number }>();
  for (const c of left)
    for (const it of c.items) {
      const k = itemKey(it.title);
      const e = items.get(k) ?? { title: it.title.replace(/\s+[-–—]\s+.*$/, ""), count: 0 };
      e.count += it.qty;
      items.set(k, e);
    }
  const events = ga4?.periods["30"]?.events;
  const steps = events && Object.keys(events).length ? STEP_LABELS.map(([key, label]) => ({ key, label, count: events[key] ?? 0 })).filter((s, i) => i === 0 || s.count > 0 || s.key === "purchase") : null;
  const devices = ga4 && Object.keys(ga4.stepsByDevice).length ? [...new Set(Object.values(ga4.stepsByDevice).flatMap((d) => Object.keys(d)))].map((device) => ({ device, started: ga4.stepsByDevice.begin_checkout?.[device] ?? 0, purchased: ga4.stepsByDevice.purchase?.[device] ?? 0 })).filter((d) => d.started > 0) : null;
  const codes = [...new Set(left.flatMap((c) => c.discountCodes))];

  const view: CheckoutView = {
    basis: range,
    steps,
    abandoned: left.length,
    abandonedValue: sumSub(left),
    recovered: back.length,
    recoveredValue: sumSub(back),
    orders: orders.length,
    completion: share(orders.length, orders.length + left.length),
    reached: addressKnown ? { contact: left.filter((c) => !c.hasAddress && c.shipping === 0).length, address: left.filter((c) => c.hasAddress && c.shipping === 0).length, delivery: feeSeen.length } : null,
    fee: { count: feeSeen.length, average: feeSeen.length ? feeSeen.reduce((s, c) => s + c.shipping, 0) / feeSeen.length : null },
    threshold,
    under: threshold === null ? { abandoned: null, orders: null } : { abandoned: share(left.filter((c) => c.subtotal < threshold).length, left.length), orders: share(orders.filter((o) => o.subtotal < threshold).length, orders.length) },
    avgValue: { abandoned: left.length ? sumSub(left) / left.length : null, orders: orders.length ? sumSub(orders) / orders.length : null },
    codes: { count: left.filter((c) => c.discountCodes.length).length, codes: codes.slice(0, 6) },
    inApp: knownIn(left).length || knownIn(orders).length ? { abandoned: share(knownIn(left).filter((c) => c.inApp).length, knownIn(left).length), orders: share(knownIn(orders).filter((o) => o.inApp).length, knownIn(orders).length) } : null,
    byDevice: devices,
    topItems: [...items.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    says: [],
  };
  view.says = checkoutFindings(view, events ?? null);
  return view;
}

/** Why people leave at checkout, ranked: each reason needs its own evidence in the figures, and the strongest come first. */
function checkoutFindings(v: CheckoutView, events: Record<string, number> | null): Finding[] {
  const out: (Finding & { weight: number })[] = [];
  const n = v.abandoned;
  if (isNum(v.completion) && v.orders + n >= MIN_CASES)
    out.push({
      level: v.completion < 0.5 ? "warning" : "info",
      weight: 1,
      title: `${pct(v.completion)} of people who start checking out finish`,
      evidence: `In the last 30 days ${plural(v.orders, "order")} were placed and ${plural(n, "checkout")} left after giving contact details, worth ${egp(v.abandonedValue)}. ${v.recovered ? `${plural(v.recovered, "came", "came")} back later (${egp(v.recoveredValue)}).` : "None came back on their own."}`,
    });
  if (n >= MIN_CASES && v.threshold !== null && isNum(v.under.abandoned) && isNum(v.under.orders) && v.under.abandoned - v.under.orders >= 0.15)
    out.push({
      level: "warning",
      weight: 10 * (v.under.abandoned - v.under.orders) + v.fee.count / n,
      title: "The delivery fee is the likeliest reason people leave",
      evidence: `${pct(v.under.abandoned)} of the carts left behind were under the free-delivery line of ${egp(v.threshold)}, against ${pct(v.under.orders)} of the orders that went through.${v.fee.count ? ` ${plural(v.fee.count, "person", "people")} left with a delivery fee of ${egp(v.fee.average ?? 0)} on screen.` : ""}`,
      fix: "Show the delivery fee in the bag before checkout, and test free delivery from a lower amount, or a lower fee for cash on delivery.",
    });
  if (v.reached && n >= MIN_CASES) {
    const early = share(v.reached.contact, n) ?? 0;
    const fee = share(v.reached.delivery, n) ?? 0;
    if (early >= 0.5)
      out.push({
        level: "warning",
        weight: 3 * early,
        title: "Most leave on the first checkout screen, before the address",
        evidence: `${plural(v.reached.contact, "of the people who left", "of the people who left")} gave contact details and stopped (${pct(early)}). The checkout is in English, opens on a new address and asks for details before anything reassures them.`,
        fix: "Say 'Cash on delivery, no extra fee · delivered in 2 working days' at the top of checkout (Shopify > Settings > Checkout), and offer to finish the order on WhatsApp.",
      });
    else if (fee >= 0.4)
      out.push({
        level: "warning",
        weight: 3 * fee,
        title: "People leave once the delivery fee appears",
        evidence: `${pct(fee)} of the people who left had chosen a delivery option, so they saw the full price including delivery and stopped there.`,
        fix: "Show delivery costs on product pages and in the bag, so the total at checkout is no surprise.",
      });
  }
  if (v.inApp && isNum(v.inApp.abandoned) && isNum(v.inApp.orders) && n >= MIN_CASES && v.inApp.abandoned - v.inApp.orders >= 0.15)
    out.push({
      level: "warning",
      weight: 5 * (v.inApp.abandoned - v.inApp.orders),
      title: "Instagram's in-app browser loses checkouts",
      evidence: `${pct(v.inApp.abandoned)} of the abandoned checkouts came from Instagram's or Facebook's in-app browser, against ${pct(v.inApp.orders)} of the orders. Typing an address inside the app is harder, and saved details aren't there.`,
      fix: "Offer 'Order on WhatsApp' next to Checkout for in-app visitors, so they can finish without the form.",
    });
  if (v.byDevice) {
    const mobile = v.byDevice.find((d) => d.device === "mobile");
    const desktop = v.byDevice.find((d) => d.device === "desktop");
    if (mobile && desktop && mobile.started >= MIN_CASES && desktop.started >= MIN_CASES) {
      const m = mobile.purchased / mobile.started;
      const dsk = desktop.purchased / desktop.started;
      if (dsk - m >= 0.15)
        out.push({
          level: "info",
          weight: 2 * (dsk - m),
          title: "Phones finish checkout less often than computers",
          evidence: `${pct(m)} of checkouts started on a phone end in an order, against ${pct(dsk)} on a computer (GA4, 30 days).`,
          fix: "Walk through checkout on a phone: the fields, the keyboard for the phone number, and how long the page takes.",
        });
    }
  }
  if (isNum(v.avgValue.abandoned) && isNum(v.avgValue.orders) && n >= MIN_CASES && v.avgValue.abandoned >= v.avgValue.orders * 1.4)
    out.push({
      level: "info",
      weight: 1.5,
      title: "Bigger carts are the ones left behind",
      evidence: `An abandoned cart averaged ${egp(v.avgValue.abandoned)}, against ${egp(v.avgValue.orders)} for an order. The total at checkout may be a surprise.`,
      fix: "Offer a set price for two bottles, and remind them a free 5 ml comes with every bottle.",
    });
  if (v.codes.count >= 3)
    out.push({
      level: "warning",
      weight: 2 + v.codes.count / Math.max(1, n),
      title: `${plural(v.codes.count, "person", "people")} tried a discount code and left`,
      evidence: `Codes tried: ${v.codes.codes.join(", ")}. A code from an ad that fails at checkout ends the sale.`,
      fix: "Check each code works in Shopify (Discounts) and hasn't expired.",
    });
  if (events) {
    const tap = events.checkout_click ?? 0;
    const open = events.begin_checkout ?? 0;
    const errors = events.checkout_error ?? 0;
    if (tap >= MIN_CASES && open < tap * 0.6)
      out.push({
        level: "warning",
        weight: 4,
        title: "Checkout taps don't all reach checkout",
        evidence: `The bag's Checkout button was tapped ${fmt.format(tap)} times but checkout opened ${fmt.format(open)} times (GA4, 30 days)${errors ? `, and the bag showed ${plural(errors, "error")}` : ""}. Some of the gap is people who decline cookies, the rest is a slow or failed hand-off.`,
        fix: "Test the Checkout button on a phone inside Instagram, and check the server log for checkout errors.",
      });
  }
  if (n >= MIN_CASES && v.recovered / Math.max(1, n + v.recovered) < 0.1)
    out.push({
      level: "info",
      weight: 1.2,
      title: "Few people come back to an abandoned checkout",
      evidence: `${plural(v.recovered, "checkout")} of ${fmt.format(n + v.recovered)} was finished later. A reminder in the first hour brings some back.`,
      fix: "Turn on Shopify's abandoned checkout email (Marketing > Automations), and send a WhatsApp reminder for cash-on-delivery carts.",
    });
  return out.sort((a, b) => b.weight - a.weight).map((f) => ({ level: f.level, title: f.title, evidence: f.evidence, fix: f.fix }));
}

/* -------------------------------------------------------------- Website */

const FUNNEL: [string, string][] = [
  ["page_view", "Pages viewed"],
  ["view_item", "Scent pages viewed"],
  ["add_to_cart", "Added to bag"],
  ["checkout_click", "Tapped Checkout"],
  ["begin_checkout", "Checkout opened"],
  ["purchase", "Ordered"],
];

export function websiteView(ga4: Ga4Snapshot): WebsiteView {
  // The GA4 tag can be younger than a period (it went on the new website on 10 Oct 2026), and GA4 sends no rows for days without visits.
  const today = ymdIn(new Date(), SHOP_TZ);
  const first = ga4.daily.find((r) => r.sessions > 0)?.d ?? null;
  const startsIn = (n: number) => (first && first > fullDays(n, today).from ? first : null);
  const periods: WebsiteView["periods"] = {};
  for (const k of PERIOD_KEYS) {
    const p = ga4.periods[k];
    if (!p) continue;
    periods[k] = {
      totals: p.totals,
      prev: p.prev,
      funnel: FUNNEL.map(([key, label]) => ({ key, label, count: key === "page_view" ? (p.totals.sessions ?? 0) : (p.events[key] ?? 0) })).map((s, i) => (i === 0 ? { ...s, label: "Visits" } : s)),
      since: startsIn(Number(k)),
    };
  }
  const view: WebsiteView = { periods, since: startsIn(90), daily: ga4.daily, channels: ga4.channels, landings: ga4.landings, devices: ga4.devices, inApp: ga4.inApp, vitals: ga4.vitals, says: [] };
  view.says = websiteFindings(view);
  return view;
}

function websiteFindings(v: WebsiteView): Finding[] {
  const out: Finding[] = [];
  const p = v.periods["30"];
  if (!p) return out;
  const t = p.totals;
  const sessions = t.sessions ?? 0;
  const ev = Object.fromEntries(p.funnel.map((s) => [s.key, s.count]));
  // "in 30 days" only when GA4 covers all 30; a comparison only when it also covers the 30 days before.
  const span = p.since ? `since ${dayLabel(p.since)}` : "in 30 days";
  const prevCovered = !v.since || v.since <= prevDays(30, ymdIn(new Date(), SHOP_TZ)).from;
  if (sessions >= 50 && prevCovered && isNum(p.prev?.sessions) && p.prev.sessions > 0) {
    const ch = (sessions - p.prev.sessions) / p.prev.sessions;
    if (Math.abs(ch) >= 0.15)
      out.push({
        level: ch > 0 ? "good" : "warning",
        title: `Visits ${ch > 0 ? "up" : "down"} ${pct(Math.abs(ch))} on the 30 days before`,
        evidence: `${fmt.format(sessions)} visits in the last 30 days against ${fmt.format(p.prev.sessions)}.${ch < 0 ? " Check whether ad spend dropped or an ad stopped." : ""}`,
      });
  }
  if (sessions >= 100) {
    const orders = ev.purchase ?? 0;
    const views = ev.view_item ?? 0;
    const adds = ev.add_to_cart ?? 0;
    const conv = orders / sessions;
    out.push({
      level: "info",
      title: `${pct(conv)} of visits end in an order`,
      evidence: `${fmt.format(sessions)} visits, ${fmt.format(views)} scent pages viewed, ${fmt.format(adds)} ${adds === 1 ? "add" : "adds"} to bag and ${fmt.format(orders)} ${orders === 1 ? "order" : "orders"} ${span}.`,
    });
    if (views >= 100 && adds / views < 0.04)
      out.push({
        level: "warning",
        title: "Scent pages are viewed but rarely added to the bag",
        evidence: `${pct(adds / views)} of scent page views lead to an add to bag. Visitors look, then leave the product page.`,
        fix: "Check the product page on a phone: price and 'Inspired by' visible at once, the free 5 ml and cash on delivery next to Add to bag, and photos that load fast.",
      });
  }
  const weak = v.landings.filter((l) => l.sessions >= 40 && l.engagementRate < 0.4).sort((a, b) => b.sessions - a.sessions)[0];
  if (weak)
    out.push({
      level: "warning",
      title: `${weak.page === "/" ? "The home page" : weak.page} loses most visitors on arrival`,
      evidence: `${fmt.format(weak.sessions)} visits landed there ${span} and only ${pct(weak.engagementRate)} stayed to look around.`,
      fix: "Match the page to the ad that sends people there: same scent, same picture, price in view.",
    });
  const paid = v.channels.find((c) => /paid social/i.test(c.channel));
  const organic = v.channels.filter((c) => /organic social|direct|organic search/i.test(c.channel));
  if (paid && paid.sessions >= 100) {
    const orgSessions = organic.reduce((s, c) => s + c.sessions, 0);
    const orgBuys = organic.reduce((s, c) => s + c.purchases, 0);
    const paidRate = paid.purchases / paid.sessions;
    const orgRate = orgSessions ? orgBuys / orgSessions : null;
    out.push({
      level: "info",
      title: `Paid social brings ${pct(paid.sessions / Math.max(1, v.channels.reduce((s, c) => s + c.sessions, 0)))} of visits`,
      evidence: `${fmt.format(paid.sessions)} visits from ads and ${fmt.format(paid.purchases)} orders (${pct(paidRate)})${isNum(orgRate) ? `, against ${pct(orgRate)} for people who came by themselves` : ""}.`,
    });
  }
  const lcp = v.vitals?.find((x) => x.metric === "LCP");
  if (lcp && lcp.good + lcp.needsWork + lcp.poor >= 50) {
    const slow = (lcp.poor + lcp.needsWork) / (lcp.good + lcp.needsWork + lcp.poor);
    if (slow >= 0.25)
      out.push({
        level: "warning",
        title: `Pages load slowly for ${pct(slow)} of visitors`,
        evidence: `The main picture took longer than 2.5 seconds to show on ${pct(slow)} of page loads (real visitors, ${p.since ? span : "30 days"}). On Instagram's in-app browser every second loses people.`,
        fix: "Make the first picture on ad landing pages smaller, and keep the hero video off phones on mobile data.",
      });
  }
  const inApp = v.inApp?.find((x) => /instagram/i.test(x.inApp));
  const other = v.inApp?.find((x) => /other/i.test(x.inApp));
  if (inApp && other && inApp.sessions >= 100 && other.sessions >= 50) {
    const a = inApp.purchases / inApp.sessions;
    const b = other.purchases / other.sessions;
    if (b > 0 && a < b * 0.6)
      out.push({
        level: "warning",
        title: "Visitors inside Instagram buy less often",
        evidence: `${pct(inApp.sessions / (inApp.sessions + other.sessions))} of visits are inside Instagram's or Facebook's app; ${pct(a)} of them order, against ${pct(b)} in other browsers.`,
        fix: "Keep the in-app path short: one tap to add, and an 'Order on WhatsApp' option at checkout.",
      });
  }
  return out;
}

/* ----------------------------------------------------- Products, end to end */

export function productHealth(products: ProductRow[] | undefined, ga4: Ga4Snapshot | null, ops: OpsSnapshot | null): ProductHealthRow[] | null {
  if (!products?.length && !ga4?.items.length) return null;
  const rows = new Map<string, ProductHealthRow>();
  const get = (title: string) => {
    const k = itemKey(title);
    let r = rows.get(k);
    if (!r) {
      r = { title: title.replace(/\s+[-–—]\s+.*$/, ""), line: null, views: null, adds: null, addRate: null, checkouts: null, units: null, net: null, abandoned: 0, failed: 0, verdict: null };
      rows.set(k, r);
    }
    return r;
  };
  for (const p of products ?? []) {
    const r = get(p.title);
    r.line = p.line;
    r.units = p.units;
    r.net = p.net;
  }
  for (const it of ga4?.items ?? []) {
    const r = get(it.name);
    r.views = it.views;
    r.adds = it.adds;
    r.checkouts = it.checkouts;
    r.addRate = it.views > 0 ? it.adds / it.views : null;
  }
  if (ops) {
    const since = addDays(ops.today, -29);
    for (const c of ops.checkouts ?? []) if (!c.completedAt && dayOf(c.createdAt) >= since) for (const it of c.items) get(it.title).abandoned += it.qty;
    for (const o of ops.orders) if (o.state === "failed" && dayOf(o.placedAt) >= since) for (const it of o.items) get(it.title).failed += it.qty;
  }
  const list = [...rows.values()].filter((r) => (r.views ?? 0) > 0 || (r.units ?? 0) > 0 || r.abandoned > 0);
  // The typical add-to-bag rate, from scents seen often enough for their rate to mean something.
  const typical = median(list.filter((r) => (r.views ?? 0) >= 20 && isNum(r.addRate)).map((r) => r.addRate as number));
  const units = median(list.map((r) => r.units ?? 0).filter((u) => u > 0)) ?? 0;
  for (const r of list) {
    const views = r.views ?? 0;
    const sold = r.units ?? 0;
    if (r.failed >= 2) r.verdict = { kind: "delivery", text: `${plural(r.failed, "bottle")} in failed deliveries this month` };
    else if (r.abandoned >= 2 && r.abandoned > sold) r.verdict = { kind: "checkout", text: "Left in more checkouts than it sold" };
    else if (isNum(typical) && isNum(r.addRate) && views >= 30 && r.addRate < typical * 0.5) r.verdict = { kind: "page", text: "Viewed a lot, rarely added: check its price, photos and notes" };
    else if (sold >= 3 && sold >= units && (!isNum(typical) || !isNum(r.addRate) || r.addRate >= typical)) r.verdict = { kind: "star", text: "Converts well: lead ads with it" };
    else if (ga4 && views < 10 && sold === 0) r.verdict = { kind: "quiet", text: "Barely seen: feature it, or let it go" };
  }
  return list.sort((a, b) => (b.net ?? 0) - (a.net ?? 0) || (b.views ?? 0) - (a.views ?? 0));
}

/** The "what to work on" list: every warning-or-worse finding, most urgent first, then the products that need a look. */
export function workOn(groups: Finding[][], products: ProductHealthRow[] | null): Finding[] {
  const rank = { critical: 0, warning: 1, info: 2, good: 3 } as const;
  const found = groups.flat().filter((f) => f.level === "critical" || f.level === "warning");
  const fixProducts = (products ?? []).filter((p) => p.verdict && p.verdict.kind !== "star" && p.verdict.kind !== "quiet").slice(0, 3);
  if (fixProducts.length)
    found.push({
      level: "info",
      title: `${plural(fixProducts.length, "scent")} to look at`,
      evidence: fixProducts.map((p) => `${p.title}: ${p.verdict!.text.charAt(0).toLowerCase()}${p.verdict!.text.slice(1)}`).join("; "),
    });
  return found.sort((a, b) => rank[a.level] - rank[b.level]).slice(0, 10);
}
