import type { DashData, Note, Num, PeriodKey, Range } from "./types";

/**
 * "This week's read": up to five plain-language notes worked out from the
 * figures on the page (no model, nothing stored), recomputed with every
 * refresh so they never disagree with the tiles above them. Each cites its
 * numbers; sales are Shopify's amounts, and anything Meta attributes to its
 * ads says "Meta credits". A note that would run past 45 words is dropped,
 * never cut mid-sentence.
 */
type Candidate = Note & { score: number };
type Period = NonNullable<DashData["periods"][PeriodKey]>;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const n0 = (v: Num | undefined) => (isNum(v) ? v : 0);
const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const egp = (v: number) => `EGP ${fmt.format(Math.round(v))}`;
const int = (v: number) => fmt.format(v);
const plural = (k: number, one: string, many = `${one}s`) => `${int(k)} ${k === 1 ? one : many}`;
const day = (d: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${d}T12:00:00Z`));
const pctChange = (now: number, before: number) => Math.round(((now - before) / Math.abs(before)) * 100);
/** "ETERNAL | Prospecting | Egypt 18-45 | Purchase" → "Prospecting, Egypt 18-45": the part people say out loud. */
const shortName = (s: string) =>
  s
    .replace(/^ETERNAL\s*\|\s*/i, "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

export const wordCount = (s: string) => s.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
const MAX_WORDS = 45;

function salesWeek(p: Period | undefined, today: { orders: number; net: number } | null): Candidate | null {
  if (!p?.range || !isNum(p.sales?.net) || !isNum(p.sales?.orders)) return null;
  const net = p.sales.net;
  const orders = p.sales.orders;
  const returned = Math.abs(n0(p.sales.returns));
  const pNet = p.prev?.net;
  const pOrd = p.prev?.orders;
  const span = `${day(p.range.from)} to ${day(p.range.to)}`;
  const before = !isNum(pNet) || !isNum(pOrd) ? "" : pOrd === 0 && pNet === 0 ? ", and none the 7 days before" : `, against ${egp(pNet)} from ${plural(pOrd, "order")} the 7 days before`;
  const todayText = today && today.orders > 0 ? ` Today has ${plural(today.orders, "order")} so far (${egp(today.net)}).` : "";
  if (orders === 0) {
    const refund = returned > 0 ? ` and refunded ${egp(returned)}` : "";
    return { kind: "risk", score: 100, title: "No new orders in the last 7 full days", body: `From ${span} the shop took no new orders${refund}, so net sales were ${egp(net)}${before}.${todayText}` };
  }
  if (!isNum(pNet) || pNet <= 0) return { kind: "win", score: 40, title: "Sales in the last 7 full days", body: `From ${span} the shop took ${plural(orders, "order")} for ${egp(net)} in net sales.${todayText}` };
  const ch = pctChange(net, pNet);
  if (Math.abs(ch) < 10) return { kind: "win", score: 30, title: "Sales held steady this week", body: `From ${span} net sales were ${egp(net)} from ${plural(orders, "order")}${before}.${todayText}` };
  return ch > 0
    ? { kind: "win", score: 70, title: `Sales up ${ch}% on the week before`, body: `From ${span} net sales were ${egp(net)} from ${plural(orders, "order")}${before}.${todayText}` }
    : { kind: "risk", score: 80, title: `Sales down ${Math.abs(ch)}% on the week before`, body: `From ${span} net sales were ${egp(net)} from ${plural(orders, "order")}${before}.${todayText}` };
}

function adsReturn(p30: Period | undefined, p7: Period | undefined): Candidate | null {
  const a = p30?.ads;
  if (!a || !isNum(a.spend) || a.spend < 500) return null; // too little spend to judge
  const value = n0(a.purchaseValue);
  const roas = value / a.spend;
  const head = `In the last 30 full days ads spent ${egp(a.spend)} and Meta credits them with ${egp(value)} in purchases, EGP ${fmt2.format(roas)} back per EGP 1.`;
  const w = p7?.ads;
  const week = w && isNum(w.spend) && w.spend > 0 && n0(w.purchases) === 0 ? ` The last 7 full days spent ${egp(w.spend)} for ${plural(n0(w.atc), "add-to-bag")}, but Meta credits no purchase.` : "";
  return roas < 1 ? { kind: "risk", score: 90, title: "Ads cost more than they bring back", body: head + week } : { kind: "win", score: 60, title: "Ads are paying for themselves", body: head + week };
}

function topSource(p30: Period | undefined, rows: { source: string; orders: number; net: number }[] | undefined): Candidate | null {
  const total = p30?.sales?.orders;
  const totalNet = p30?.sales?.net;
  const list = (rows ?? []).filter((r) => r.orders > 0);
  if (!isNum(total) || total < 3 || !list.length || !isNum(totalNet)) return null;
  const top = [...list].sort((a, b) => b.orders - a.orders || b.net - a.net)[0];
  if (top.orders / total < 0.4 || /unknown/i.test(top.source)) return null;
  const prev = p30?.prev?.net;
  const growth = isNum(prev) && prev > 0 && totalNet > prev * 1.5 ? ` The 30 days before, the whole shop made ${egp(prev)}.` : "";
  return {
    kind: "win",
    score: 65,
    title: `${top.source} brings most orders`,
    body: `${top.source} brought ${int(top.orders)} of ${plural(total, "order")} and ${egp(top.net)} of ${egp(totalNet)} net sales in the last 30 full days.${growth}`,
  };
}

function topScent(rows: DashData["products"][PeriodKey]): Candidate | null {
  const list = (rows ?? []).filter((r) => n0(r.net) > 0);
  if (list.length < 2) return null;
  const [a, b] = list;
  if (n0(a.units) < 3) return null;
  return { kind: "win", score: 45, title: `${a.title} is the best seller`, body: `${a.title} sold ${plural(n0(a.units), "bottle")} for ${egp(n0(a.net))} in the last 30 full days, ahead of ${b.title} at ${egp(n0(b.net))}.` };
}

function adSetMix(rows: DashData["campaigns"]["rows"]): Candidate | null {
  const sets = rows.filter((r) => r.level === "adset");
  const selling = sets.filter((r) => n0(r.purchases) > 0).sort((x, y) => n0(y.purchases) - n0(x.purchases));
  const activeDry = sets.filter((r) => r.active && n0(r.purchases) === 0 && n0(r.spend) > 0);
  if (!selling.length || !activeDry.length) return null;
  const best = selling[0];
  if (best.active) return null; // the one that sells is already running
  const drySpend = activeDry.reduce((s, r) => s + n0(r.spend), 0);
  const each = isNum(best.cpa) ? ` (${egp(best.cpa)} each)` : "";
  return {
    kind: "next",
    score: 75,
    title: "The ad set that sells is paused",
    body: `Meta credits ${plural(n0(best.purchases), "purchase")} in 30 days to ${shortName(best.name)}${each}, now paused. The ${plural(activeDry.length, "active ad set")} spent ${egp(drySpend)} with none. Consider restarting the one that sells.`,
  };
}

function nextStep(d: DashData): Candidate | null {
  const order = { critical: 0, warning: 1, info: 2 } as const;
  const top = [...d.status.attention].sort((a, b) => order[a.level] - order[b.level]).find((a) => a.next);
  if (top?.next) return { kind: "next", score: 95, title: top.next.title, body: top.next.body };
  const t = d.tracking.items.find((i) => i.status !== "ok" && i.status !== "unknown" && i.action);
  if (t?.action) return { kind: "next", score: 50, title: `Fix: ${t.label}`, body: `${t.action}${/[.!?]$/.test(t.action) ? "" : "."}${t.owner ? ` Who: ${t.owner}.` : ""}` };
  const best = (d.products["30"] ?? []).filter((r) => n0(r.net) > 0)[0];
  if (best && n0(best.units) >= 3)
    return {
      kind: "next",
      score: 20,
      title: `Lead with ${best.title}`,
      body: `${best.title} sold ${plural(n0(best.units), "bottle")} in the last 30 full days, more than any other scent. Show it first in the next ads and on the home page.`,
    };
  return null;
}

export function buildRead(d: DashData): { headline: string; basis: Range | null; items: Note[] } {
  const p7 = d.periods["7"];
  const p30 = d.periods["30"];
  const t = d.daily.days.find((x) => x.d === d.daily.today);
  const today = t ? { orders: n0(t.orders), net: n0(t.net) } : null;
  const all = [salesWeek(p7, today), adsReturn(p30, p7), topSource(p30, d.sources["30"]), topScent(d.products["30"]), adSetMix(d.campaigns.rows), nextStep(d)].filter(
    (c): c is Candidate => !!c && wordCount(c.body) <= MAX_WORDS,
  );
  const nexts = all.filter((c) => c.kind === "next").sort((a, b) => b.score - a.score);
  const rest = all.filter((c) => c.kind !== "next").sort((a, b) => b.score - a.score);
  // At most two "next" items (the most urgent first), five in all; risks, then wins, then next steps.
  const picked = [...rest.slice(0, 5 - Math.min(2, nexts.length)), ...nexts.slice(0, 2)];
  const rank = { risk: 0, win: 1, next: 2 } as const;
  const items = picked.sort((a, b) => rank[a.kind] - rank[b.kind] || b.score - a.score).map(({ kind, title, body }) => ({ kind, title, body }));
  return { headline: "This week's read", basis: p7?.range ?? null, items };
}
