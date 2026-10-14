import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkoutView, deliveriesView, productHealth, websiteView, workOn } from "./insights";
import type { BostaSnapshot, DashData, Ga4Snapshot, OpsSnapshot } from "./types";
import { site } from "@/content/site";

/**
 * Development only: the dashboard's figures from a folder of JSON files (one
 * per section, as the old claude.ai page stored them), so the page can be
 * built and checked without the Shopify and Meta keys. Point
 * DASHBOARD_FIXTURE_DIR at the folder; it is never read in production, and
 * the figures never belong in this repository.
 */
export function fixtureDir(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  return process.env.DASHBOARD_FIXTURE_DIR?.trim() || null;
}

const read = (dir: string, name: string) => {
  try {
    return JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export function loadFixture(dir: string): DashData {
  /* eslint-disable @typescript-eslint/no-explicit-any -- loose by nature: hand-written files */
  const status = (read(dir, "status") ?? {}) as any;
  const periods = (read(dir, "periods") ?? {}) as any;
  const daily = (read(dir, "daily") ?? { days: [] }) as any;
  const campaigns = (read(dir, "campaigns") ?? { period: "Last 30 days", rows: [] }) as any;
  const audience = (read(dir, "audience") ?? {}) as any;
  const tracking = (read(dir, "tracking") ?? { items: [] }) as any;
  const notes = (read(dir, "notes") ?? { items: [] }) as any;
  const days = (daily.days ?? []) as DashData["daily"]["days"];
  // The newer sections run through the same rules as live figures (lib/dashboard/insights.ts), so the fixture tests them.
  const ops = read(dir, "ops") as unknown as OpsSnapshot | null;
  const ga4 = read(dir, "ga4") as unknown as Ga4Snapshot | null;
  const bosta = read(dir, "bosta") as unknown as BostaSnapshot | null;
  const products = (read(dir, "products") ?? {}) as DashData["products"];
  const deliveries = ops ? deliveriesView(ops, bosta, site.deliveryPromise) : null;
  const checkout = ops ? checkoutView(ops, ga4, 2190) : null;
  const website = ga4 ? websiteView(ga4) : null;
  const health = productHealth(products["30"], ga4, ops);
  for (const k of Object.keys(periods)) Object.assign(periods[k], { approximate: false, adsRange: periods[k].adsRange ?? null });
  return {
    status: { updatedAt: status.updatedAt ?? null, sources: status.sources ?? [], attention: status.attention ?? [], dayLabel: "Cairo days" },
    periods,
    daily: { days, today: days.at(-1)?.d ?? "" },
    products,
    sources: (read(dir, "sources") ?? {}) as DashData["sources"],
    campaigns: { period: campaigns.period ?? "Last 30 days", rows: (campaigns.rows ?? []).map((r: any) => ({ ...r, active: /active/i.test(r.status ?? "") })) },
    audience: {
      customers: audience.customers ?? null,
      buyers: audience.buyers ?? null,
      repeatBuyers: audience.repeatBuyers ?? null,
      emailSubscribed: audience.emailSubscribed ?? null,
      smsSubscribed: audience.smsSubscribed ?? null,
      cities: audience.cities ?? [],
      devices: audience.devices ?? [],
      metaAudiences: audience.metaAudiences ?? [],
    },
    tracking: { items: tracking.items ?? [], pixel: tracking.pixel ?? null },
    notes: { headline: notes.headline ?? "This week's read", basis: periods["7"]?.range ?? null, items: notes.items ?? [] },
    deliveries,
    checkout,
    website,
    productHealth: health,
    workOn: workOn([deliveries?.says ?? [], checkout?.says ?? [], website?.says ?? []], health),
    gaps: {
      shopify: null,
      ads: null,
      adsDaily: null,
      pixel: null,
      audiences: null,
      campaigns: null,
      ops: ops ? null : "No ops.json in the fixture folder.",
      checkout: ops?.checkouts ? null : "No abandoned checkouts in the fixture.",
      website: ga4 ? null : "No ga4.json in the fixture folder.",
      bosta: bosta ? null : "No bosta.json in the fixture folder.",
    },
    admin: {
      shopifyChecks: [{ id: "fixture", level: "warn", detail: `Figures from the fixture folder ${dir}, not from Shopify or Meta.` }],
      shopifyHidden: [],
      meta: { tier: null, maxPct: null, calls: 0, states: {} },
    },
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
