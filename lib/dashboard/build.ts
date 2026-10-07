import "server-only";
import { getShopifySnapshot } from "./shopify";
import { getMetaSnapshot } from "./meta";
import { getSiteProbes, liveKeys, VERCEL_ANALYTICS_URL, type SiteProbes } from "./site";
import { buildRead } from "./read";
import { fixtureDir, loadFixture } from "./fixture";
import { addDays, SHOP_TZ, ymdIn } from "./dates";
import { PERIOD_KEYS, type AttentionItem, type DashData, type MetaSnapshot, type Num, type Role, type ShopifySnapshot, type SourceChip, type TrackItem } from "./types";

/**
 * The dashboard's figures: the Shopify and Meta readings (each cached on its
 * own schedule) put into the sections the page shows, with the attention
 * rules, the tracking checklist and the weekly read worked out from them.
 * Pure arithmetic over cached data, so it runs on every page view at no cost
 * to Shopify or Meta.
 */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const egp = (v: number) => `EGP ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(v))}`;
const ratio2 = (v: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const EVENT_LABELS: Record<string, string> = {
  PageView: "Page viewed",
  ViewContent: "Scent viewed",
  AddToCart: "Added to bag",
  InitiateCheckout: "Checkout started",
  Purchase: "Purchase",
};

/** Shopify's referrer (source, name) as the page names it. */
function referrerLabel(source: string | null, name: string | null) {
  const n = (name ?? "").toLowerCase();
  const s = (source ?? "").toLowerCase();
  if (/instagram/.test(n)) return "Instagram";
  if (/facebook|fb\b/.test(n)) return "Facebook";
  if (/eternal-storefront|www\.myeternal\.net/.test(n)) return "New website";
  if (/myeternal/.test(n)) return "myeternal.net (old site)";
  if (/google/.test(n)) return "Google";
  if (/tiktok/.test(n)) return "TikTok";
  if (!n && !s) return "Direct or unknown";
  const raw = name ?? source ?? "";
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Direct or unknown";
}

async function settled<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    console.error("[dashboard] source read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** A source that could not even be read (the cache function threw): shown as unavailable, never as zeros. */
function emptyShopify(today: string): ShopifySnapshot {
  return {
    state: "error",
    failure: { kind: "unavailable", message: "Shopify could not be read just now." },
    fetchedAt: new Date().toISOString(),
    timezone: null,
    today,
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

function emptyMeta(): MetaSnapshot {
  const tier = { state: "error" as const, failure: { kind: "unavailable", message: "Meta could not be read just now." }, fetchedAt: null };
  return {
    configured: true,
    ads: { ...tier, account: null, today: null, periods: {}, daily: [], campaigns: [] },
    pixel: { ...tier, windowDays: 27, lastBrowser: null, lastServer: null, hosts: [], events: [] },
    slow: { ...tier, emq: null, emqState: "error", audiences: null, audiencesState: "error" },
    rate: { tier: null, maxPct: null, calls: 0 },
  };
}

/** Why Shopify's sections are empty, in words for the page; null when they have figures. */
function shopifyGap(s: ShopifySnapshot): string | null {
  if (s.state === "off") return "Shopify isn't connected to the dashboard yet. The owner adds the read-only Shopify key in Vercel.";
  if (s.state === "error") return s.failure?.message ?? "Shopify could not be read just now.";
  return null;
}

/** Why the ad figures are missing; null when Meta's ad figures are there (even if a little old). */
function adsGap(m: MetaSnapshot): string | null {
  const t = m.ads;
  const hasData = Object.keys(t.periods).length > 0;
  if (t.state === "off") return "Meta isn't connected to the dashboard yet. The owner adds the read-only Meta key in Vercel.";
  if (hasData) return null;
  if (t.state === "unsettled") return "Meta isn't giving ad figures while the ad account has an unpaid balance. They return once it is paid.";
  if (t.state === "throttled") return "Meta asked the dashboard to slow down. The ad figures come back within a few minutes.";
  if (t.state === "key_invalid") return "Meta rejected the dashboard's key (expired or revoked). The owner makes a new one.";
  if (t.state === "no_permission") return "The current Meta key can't read the ad account's figures.";
  return t.failure?.message ?? "Meta's ad figures could not be read just now.";
}

function tierGap(state: string, failure: { message: string } | null, what: string): string | null {
  if (state === "ok") return null;
  if (state === "off") return "Meta isn't connected to the dashboard yet.";
  if (state === "no_permission") return `${what} isn't readable with the current Meta key.`;
  if (state === "throttled") return `Meta asked the dashboard to slow down. ${what} comes back within the hour.`;
  if (state === "key_invalid") return "Meta rejected the dashboard's key (expired or revoked).";
  return failure?.message ?? `${what} could not be read just now.`;
}

function attentionFor(s: ShopifySnapshot, m: MetaSnapshot, data: Pick<DashData, "periods" | "daily">, zonesDiffer: string | null, emqPurchase: Num): AttentionItem[] {
  const out: AttentionItem[] = [];
  const acct = m.ads.account;
  if (m.ads.state === "key_invalid")
    out.push({
      level: "critical",
      title: "The Meta key stopped working",
      detail: "Meta rejected the dashboard's key, so ad and pixel figures can't be read. Make a new key for the eternal-dashboard-read system user and replace META_ACCESS_TOKEN in Vercel.",
      owner: "Seif",
    });
  if (acct && acct.status !== null && acct.status !== 1)
    out.push({
      level: "critical",
      title: "Meta ad account payment overdue",
      detail: `The ad account reads "${acct.statusName ?? "not active"}". Ads stop while it is unpaid, and new audiences can't be made. Pay in Ads Manager > Billing & payments.`,
      owner: "Seif",
      next: { title: "Pay the overdue Meta balance", body: "Settle the ad account in Ads Manager > Billing & payments. Until then ads stay off, figures stay frozen and no new audiences can be made." },
    });
  if (s.state === "error")
    out.push({ level: "critical", title: "Shopify can't be read", detail: s.failure?.message ?? "The dashboard couldn't read the store just now.", owner: "Seif" });
  if (isNum(s.oldSiteOrders7) && s.oldSiteOrders7 > 0)
    out.push({
      level: "warning",
      title: "Sales still run through the old site",
      detail: `${s.oldSiteOrders7} ${s.oldSiteOrders7 === 1 ? "order" : "orders"} in the last 7 days came through the old Lovable site. myeternal.net still points there, so the new website's tracking only counts once the domain is switched.`,
      owner: "Seif + web team",
      next: { title: "Switch myeternal.net to the new website", body: "Point myeternal.net's DNS at Vercel (the records are under Vercel > eternal-storefront > Settings > Domains), so every visit and order goes through the new site and its tracking." },
    });
  if (s.metaChannelSync === false)
    out.push({
      level: "warning",
      title: "Shopify isn't sending products to Meta",
      detail: "Turn on catalog sync in Shopify's Facebook & Instagram app, so ads can show the exact scent someone viewed.",
      owner: "Seif (Shopify admin)",
    });
  const a30 = data.periods["30"]?.ads;
  if (a30 && isNum(a30.spend) && a30.spend > 1000 && isNum(a30.roas) && a30.roas < 1)
    out.push({
      level: "warning",
      title: "Ads are bringing back less than they cost",
      detail: `In the last 30 full days ads spent ${egp(a30.spend)} and Meta credits ${egp(a30.purchaseValue ?? 0)} in purchases: EGP ${ratio2(a30.roas)} back per EGP 1.`,
    });
  const a7 = data.periods["7"]?.ads;
  if (a7 && isNum(a7.spend) && a7.spend > 1000 && (a7.purchases ?? 0) === 0) {
    const today = data.daily.days.find((d) => d.d === data.daily.today);
    const todayNote = today && (today.purchases ?? 0) > 0 ? ` Meta credits ${today.purchases} today so far.` : "";
    out.push({ level: "warning", title: "No purchases from ads in the last 7 days", detail: `Ads spent ${egp(a7.spend)} in the last 7 full days and Meta credits no purchase.${todayNote}` });
  }
  if (zonesDiffer) out.push({ level: "warning", title: "Meta counts days in another time zone", detail: zonesDiffer, owner: "Seif" });
  if (isNum(emqPurchase) && emqPurchase < 6)
    out.push({
      level: "info",
      title: "Meta matches few purchases to people",
      detail: `Purchase match quality is ${emqPurchase.toFixed(1)} out of 10. In Shopify's Facebook & Instagram app, set data sharing to Maximum.`,
      owner: "Seif (Shopify admin)",
    });
  return out;
}

function trackingFor(s: ShopifySnapshot, m: MetaSnapshot, probes: SiteProbes | null, requestHost: string): TrackItem[] {
  const k = liveKeys();
  const notProd = (label: string): TrackItem => ({ label, status: "unknown", detail: "Checked on the live site only (this is a preview or local copy)." });
  const acct = m.ads.account;
  const domainLive: boolean | null = k.production && requestHost === "www.myeternal.net" ? true : (probes?.www.onVercel ?? null);
  const apexLive = probes?.apex.onVercel ?? null;

  const account: TrackItem = !m.configured
    ? { label: "Ad account in good standing", status: "unknown", detail: "Not checked: the Meta key isn't set." }
    : acct?.status === 1
      ? { label: "Ad account in good standing", status: "ok", detail: "The Meta ad account is active." }
      : acct
        ? { label: "Ad account in good standing", status: "blocked", detail: `The ad account reads "${acct.statusName ?? "not active"}".`, action: "Pay the balance in Ads Manager > Billing & payments", owner: "Seif" }
        : { label: "Ad account in good standing", status: "unknown", detail: "Couldn't read the ad account just now." };

  const domainLabel = "myeternal.net shows the new website";
  const domain: TrackItem =
    domainLive === null
      ? { label: domainLabel, status: "unknown", detail: "Couldn't reach www.myeternal.net just now; checked again within 15 minutes." }
      : domainLive && apexLive !== false
        ? { label: domainLabel, status: "ok", detail: "myeternal.net is served by the new website." }
        : domainLive
          ? { label: domainLabel, status: "partial", detail: "www.myeternal.net is on the new website; myeternal.net without www still goes elsewhere.", action: "Point the apex record at Vercel (Vercel > eternal-storefront > Settings > Domains)", owner: "Seif + web team" }
          : { label: domainLabel, status: "missing", detail: "myeternal.net still opens the old Lovable site, so customers and ads land there.", action: "Point myeternal.net's DNS at Vercel (records under Vercel > eternal-storefront > Settings > Domains)", owner: "Seif + web team" };

  // A host counts as the new website only when it really is: www/apex only once the probe sees Vercel there.
  const newHosts = m.pixel.hosts.filter((h) => h === "eternal-storefront.vercel.app" || (domainLive === true && (h === "www.myeternal.net" || h === "myeternal.net")));
  const pixelLabel = "Meta pixel on the new website";
  const pixel: TrackItem = !k.production
    ? notProd(pixelLabel)
    : !k.pixelSet || !k.pixelIsDataset
      ? { label: pixelLabel, status: "missing", detail: k.pixelSet ? "The website uses a different pixel from the 'My Eternal' dataset." : "The new website has no Meta pixel.", action: "Set NEXT_PUBLIC_META_PIXEL_ID to 28723169773968178 in Vercel (Production) and redeploy", owner: "Web team" }
      : m.pixel.state !== "ok" && !m.pixel.hosts.length
        ? { label: pixelLabel, status: "partial", detail: "The pixel is in the website; whether Meta receives its events couldn't be checked just now." }
        : newHosts.length
          ? { label: pixelLabel, status: "ok", detail: `Meta received events from ${newHosts.join(" and ")} in the last 7 days.` }
          : { label: pixelLabel, status: "partial", detail: domainLive ? "The pixel is in the website, but Meta has received no events from it in 7 days." : "The pixel is in the website; its events grow once myeternal.net moves to it." };

  const capiLabel = "Meta server events from the new website";
  const capi: TrackItem = !k.production
    ? notProd(capiLabel)
    : k.capiToken && k.capiFlag
      ? { label: capiLabel, status: "ok", detail: "The website sends a server copy of views and adds to Meta." }
      : k.capiToken || k.capiFlag
        ? { label: capiLabel, status: "partial", detail: k.capiToken ? "The token is set but the switch isn't on, so nothing is sent." : "Switched on, but no Conversions API token is set, so the copies are dropped.", action: "Set both META_CAPI_TOKEN and NEXT_PUBLIC_META_CAPI=1 (Production), then redeploy", owner: "Web team" }
        : { label: capiLabel, status: "missing", detail: "No server copies: views and adds from browsers that block the pixel never reach Meta.", action: "Create a Conversions API token in Events Manager and add it to Vercel", owner: "Seif + web team" };

  const purchase = m.pixel.events.find((e) => e.name === "Purchase");
  const emq = m.slow.emq?.Purchase ?? null;
  const checkoutLabel = "Shopify checkout sends purchases to Meta";
  const checkout: TrackItem =
    m.pixel.state !== "ok" && !m.pixel.events.length
      ? { label: checkoutLabel, status: "unknown", detail: "Couldn't read what the pixel received just now." }
      : !purchase || (purchase.browser === 0 && purchase.server === 0)
        ? { label: checkoutLabel, status: "missing", detail: `Meta received no purchase in the last ${m.pixel.windowDays} days.`, action: "Connect the 'My Eternal' dataset in Shopify's Facebook & Instagram app", owner: "Seif (Shopify admin)" }
        : purchase.browser > 0 && (emq === null || emq >= 6)
          ? { label: checkoutLabel, status: "ok", detail: `Meta received ${purchase.browser} browser and ${purchase.server} server purchases in ${m.pixel.windowDays} days${emq === null ? " (match quality not checked with this key)" : ""}.` }
          : {
              label: checkoutLabel,
              status: "partial",
              detail: purchase.browser === 0 ? `Purchases reach Meta from the server only (${purchase.server} in ${m.pixel.windowDays} days), none from the browser pixel.` : `Purchases arrive, but match quality is ${emq?.toFixed(1)} out of 10.`,
              action: "In Shopify's Facebook & Instagram app, set data sharing to Maximum",
              owner: "Seif (Shopify admin)",
            };

  const catalogLabel = "Products sync from Shopify to Meta";
  const catalog: TrackItem =
    s.metaChannelSync === true
      ? { label: catalogLabel, status: "ok", detail: "Shopify publishes products to the Facebook & Instagram channel." }
      : s.metaChannelSync === false
        ? { label: catalogLabel, status: "missing", detail: "No products are published to the Facebook & Instagram channel.", action: "Turn on catalog sync in Shopify's Facebook & Instagram app", owner: "Seif (Shopify admin)" }
        : { label: catalogLabel, status: "unknown", detail: "Not checked: the Shopify key can't read sales channels." };

  const ga4: TrackItem = !k.production
    ? notProd("Google Analytics 4")
    : k.ga4Set
      ? { label: "Google Analytics 4", status: "ok", detail: "The GA4 tag is on the website (whether data arrives is checked in GA4)." }
      : { label: "Google Analytics 4", status: "missing", detail: "No GA4 tag on the website.", action: "Connect a GA4 property in Shopify's Google & YouTube app and add the same G- ID to Vercel", owner: "Seif" };

  const visitsLabel = "Website visits (Vercel Analytics)";
  const visits: TrackItem = !k.production
    ? notProd(visitsLabel)
    : !k.vaFlag
      ? { label: visitsLabel, status: "missing", detail: "Visits are not being counted.", action: "Vercel > eternal-storefront > Analytics > Enable, then set NEXT_PUBLIC_VERCEL_ANALYTICS=1 and redeploy", owner: "Web team" }
      : domainLive !== true
        ? { label: visitsLabel, status: "partial", detail: "On in the website; visits count once myeternal.net moves to it.", href: VERCEL_ANALYTICS_URL }
        : probes?.insights === true
          ? { label: visitsLabel, status: "ok", detail: "Visits are being counted. The numbers are in Vercel Analytics.", href: VERCEL_ANALYTICS_URL }
          : probes?.insights === false
            ? { label: visitsLabel, status: "partial", detail: "The website sends visits, but Analytics isn't enabled in Vercel.", action: "Vercel > eternal-storefront > Analytics > Enable, then redeploy", owner: "Web team", href: VERCEL_ANALYTICS_URL }
            : { label: visitsLabel, status: "unknown", detail: "Couldn't check just now.", href: VERCEL_ANALYTICS_URL };

  const utmLabel = "Campaign tags on ad links";
  const utm: TrackItem =
    s.hasUtm === true
      ? { label: utmLabel, status: "ok", detail: "Visits carry campaign tags, so orders can be traced to the ad." }
      : s.hasUtm === false
        ? { label: utmLabel, status: "missing", detail: "No visit in 30 days carried a campaign tag.", action: "In Ads Manager add URL parameters: utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}", owner: "Whoever runs the ads" }
        : { label: utmLabel, status: "unknown", detail: "Couldn't check Shopify's sessions just now." };

  return [account, domain, pixel, capi, checkout, catalog, ga4, visits, utm];
}

function sourcesFor(s: ShopifySnapshot, m: MetaSnapshot, tracking: TrackItem[]): SourceChip[] {
  const k = liveKeys();
  const shop: SourceChip =
    s.state === "off"
      ? { label: "Shopify", ok: null, note: "not connected yet" }
      : s.state === "error"
        ? { label: "Shopify", ok: false, note: "couldn't read" }
        : { label: "Shopify", ok: s.state === "fallback" ? null : true, note: s.state === "fallback" ? "orders only (limited)" : "orders and customers" };
  const ads = m.ads.state;
  const meta: SourceChip = !m.configured
    ? { label: "Meta", ok: null, note: "not connected yet" }
    : ads === "ok"
      ? { label: "Meta", ok: true, note: "ads and pixel" }
      : ads === "unsettled"
        ? { label: "Meta", ok: false, note: "unpaid balance" }
        : ads === "key_invalid"
          ? { label: "Meta", ok: false, note: "key rejected" }
          : { label: "Meta", ok: null, note: ads === "throttled" ? "busy, figures from earlier" : "partly read" };
  const domain = tracking[1];
  const pixel = tracking[2];
  const site: SourceChip = !k.production
    ? { label: "New website", ok: null, note: "checked on the live site only" }
    : domain.status === "unknown"
      ? { label: "New website", ok: null, note: "couldn't check" }
      : domain.status === "missing"
        ? { label: "New website", ok: null, note: "not live yet: myeternal.net shows the old site" }
        : { label: "New website", ok: pixel.status === "ok", note: pixel.status === "ok" ? "live, tracking on" : "live, tracking off" };
  const ga: SourceChip = { label: "Google Analytics", ok: k.production && k.ga4Set ? true : null, note: !k.production ? "checked on the live site only" : k.ga4Set ? "tag on the website" : "not connected" };
  return [shop, meta, site, ga];
}

export function assemble(s: ShopifySnapshot, m: MetaSnapshot, probes: SiteProbes | null, requestHost: string): DashData {
  const today = s.today || ymdIn(new Date(), SHOP_TZ);
  const shopTz = s.timezone;
  const metaTz = m.ads.account?.timezone ?? null;
  const zonesDiffer =
    shopTz && metaTz && shopTz !== metaTz
      ? `The ad account counts days in ${metaTz} while Shopify counts them in ${shopTz}, so a Meta 'day' covers different hours from a Shopify day. Daily ad and sales figures won't line up exactly.`
      : null;
  const shopOk = s.state !== "off" && s.state !== "error";
  const adsOk = Object.keys(m.ads.periods).length > 0;

  const periods: DashData["periods"] = {};
  for (const k of PERIOD_KEYS) {
    const sp = shopOk ? s.periods[k] : undefined;
    const mp = adsOk ? m.ads.periods[k] : undefined;
    if (!sp && !mp) continue;
    periods[k] = {
      range: sp?.range ?? mp?.range ?? null,
      sales: sp?.sales ?? null,
      prev: sp?.prev ?? null,
      customers: sp?.customers ?? null,
      ads: mp?.ads ?? null,
      adsPrev: mp?.adsPrev ?? null,
      approximate: sp?.approximate ?? false,
    };
  }

  // One row per day for the last 90 full days and today, sales and spend side by side; unknown stays null.
  const shopDays = new Map(s.daily.map((d) => [d.d, d]));
  const metaDays = new Map(m.ads.daily.map((d) => [d.d, d]));
  const days: DashData["daily"]["days"] = [];
  for (let i = 90; i >= 0; i--) {
    const d = addDays(today, -i);
    const sd = shopOk ? shopDays.get(d) : undefined;
    const md = adsOk ? metaDays.get(d) : undefined;
    days.push({
      d,
      net: sd ? sd.net : shopOk && s.daily.length ? 0 : null,
      orders: sd ? sd.orders : shopOk && s.daily.length ? 0 : null,
      spend: md ? md.spend : adsOk && m.ads.daily.length ? 0 : null,
      purchases: md ? md.purchases : adsOk && m.ads.daily.length ? 0 : null,
      lpv: md ? md.lpv : null,
      atc: md ? md.atc : null,
    });
  }

  const sources: DashData["sources"] = {};
  for (const k of PERIOD_KEYS) {
    const rows = s.referrers[k];
    if (!shopOk || !rows) continue;
    const merged = new Map<string, { source: string; orders: number; net: number }>();
    for (const r of rows) {
      const label = referrerLabel(r.source, r.name);
      const e = merged.get(label) ?? { source: label, orders: 0, net: 0 };
      e.orders += r.orders;
      e.net = Math.round((e.net + r.net) * 100) / 100;
      merged.set(label, e);
    }
    sources[k] = [...merged.values()].filter((r) => r.orders > 0 || r.net > 0).sort((a, b) => b.orders - a.orders || b.net - a.net);
  }
  if (shopOk && s.hasUtm === false) sources.note = "Shopify sees only the site a buyer came from, not the ad or campaign. Campaign tags on every ad link fix this.";

  const emq = m.slow.emq;
  const tracking = trackingFor(s, m, probes, requestHost);
  const partial: Pick<DashData, "periods" | "daily"> = { periods, daily: { days, today } };
  const attention = attentionFor(s, m, partial, zonesDiffer, emq?.Purchase ?? null);
  const stamps = [shopOk ? s.fetchedAt : null, adsOk ? m.ads.fetchedAt : null].filter((t): t is string => Boolean(t)).sort();

  const data: DashData = {
    status: {
      updatedAt: stamps[0] ?? null,
      sources: sourcesFor(s, m, tracking),
      attention,
      dayLabel: zonesDiffer ? `Shopify days are ${shopTz} days; Meta days are ${metaTz} days.` : "Days are Cairo days.",
    },
    periods,
    daily: { days, today },
    products: shopOk ? s.products : {},
    sources,
    campaigns: { period: "Last 30 days", rows: adsOk || m.ads.campaigns.length ? m.ads.campaigns : [] },
    audience: {
      customers: s.counts?.customers ?? null,
      buyers: s.counts?.buyers ?? null,
      repeatBuyers: s.counts?.repeatBuyers ?? null,
      emailSubscribed: s.counts?.emailSubscribed ?? null,
      smsSubscribed: s.counts?.smsSubscribed ?? null,
      cities: s.cities ?? [],
      devices: s.devices ?? [],
      metaAudiences: m.slow.audiences ?? [],
    },
    tracking: {
      items: tracking,
      pixel:
        m.pixel.state === "off" && !m.pixel.events.length
          ? null
          : {
              windowDays: m.pixel.windowDays,
              lastBrowser: m.pixel.lastBrowser,
              lastServer: m.pixel.lastServer,
              hosts: m.pixel.hosts,
              events: m.pixel.events.map((e) => ({ ...e, label: EVENT_LABELS[e.name] ?? e.name, emq: emq?.[e.name] ?? null })),
            },
    },
    notes: { headline: "This week's read", basis: null, items: [] },
    gaps: {
      shopify: shopifyGap(s),
      ads: adsGap(m),
      pixel: m.pixel.events.length ? null : tierGap(m.pixel.state, m.pixel.failure, "What the website reported to Meta"),
      audiences: m.slow.audiences ? null : tierGap(m.slow.audiencesState, m.slow.failure, "Meta's audiences"),
      campaigns: m.ads.campaigns.length ? null : adsGap(m),
    },
    admin: {
      shopifyChecks: s.checks,
      shopifyHidden: s.hidden,
      meta: { ...m.rate, states: { ads: m.ads.state, pixel: m.pixel.state, audiences: m.slow.audiencesState, matchQuality: m.slow.emqState } },
    },
  };
  data.notes = buildRead(data);
  return data;
}

/** Everything the page needs, read from the caches (or, in development, a fixture folder). */
export async function getDashData(requestHost: string): Promise<DashData> {
  const dir = fixtureDir();
  if (dir) return loadFixture(dir);
  const k = liveKeys();
  const [s, m, probes] = await Promise.all([settled(getShopifySnapshot()), settled(getMetaSnapshot()), settled(getSiteProbes(k.deploymentId, k.vaBase))]);
  return assemble(s ?? emptyShopify(ymdIn(new Date(), SHOP_TZ)), m ?? emptyMeta(), probes, requestHost);
}

/** What each role may see. Owners also get the source self-checks and Meta's rate reading; nobody else receives them at all. */
export function viewFor(role: Role, data: DashData): DashData {
  if (role === "owner") return data;
  const { admin: _admin, ...rest } = data;
  return rest;
}
