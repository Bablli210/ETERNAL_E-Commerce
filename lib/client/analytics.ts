"use client";

import { allowed, readConsent } from "./consent-state";
import { lastTouch } from "./attribution";

/**
 * One call site for every funnel event. Each event goes to the data layer
 * (for Tag Manager), to the Meta Pixel, the TikTok pixel and GA4 when those are
 * installed (components/analytics/Analytics.tsx loads them from env IDs) and the
 * visitor has said yes to them (lib/client/consent.ts: GA4 needs analytics, the
 * pixels and their server copies need marketing), and is a no-op otherwise. An event that
 * fires before the visitor has chosen (the product page's view_item, on
 * landing) waits in this page for the answer: a yes sends it, a no drops it.
 * Purchase is not sent from here: it happens on Shopify's checkout, where the
 * Facebook & Instagram, TikTok and Google channels fire it with the same IDs.
 */
export type AnalyticsItem = {
  /** Shopify product id (numeric), for the Meta catalogue's content id. */
  productId?: string | null;
  /** Shopify variant id (numeric). */
  variantId: string;
  name: string;
  price: number;
  quantity?: number;
  variant?: string;
  category?: string | null;
};

type Event =
  | { name: "view_item"; items: AnalyticsItem[] }
  | { name: "view_item_list"; list: string; items: AnalyticsItem[] }
  /** source: where the add happened (pdp, sticky, card, pairing, finder, bag_suggestion, bag_link, bag_qty…). */
  | { name: "add_to_cart"; items: AnalyticsItem[]; source?: string }
  | { name: "remove_from_cart"; items: AnalyticsItem[] }
  | { name: "view_cart"; items: AnalyticsItem[] }
  /**
   * The Checkout tap in the bag. Shopify's own checkout fires begin_checkout and purchase (Google channel) and
   * InitiateCheckout and Purchase (Facebook & Instagram channel), so this goes out as checkout_click and CheckoutClick.
   */
  | { name: "begin_checkout"; items: AnalyticsItem[] }
  | { name: "select_item"; list: string; index: number; item: AnalyticsItem }
  | { name: "search"; term: string; results?: number }
  | { name: "finder_start" }
  | { name: "finder_step"; step: number; question: string; answer: string }
  | { name: "finder_complete"; answers: string; matches: string[] }
  | { name: "generate_lead"; method: string }
  /** Small interaction signals, sent to the data layer and GA4 only. */
  | { name: "ui"; action: "faq_open" | "gallery_swipe" | "sheet_open" | "filter_apply" | "whatsapp_click" | "not_found" | "checkout_error" | "sample_pick"; label?: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: Ttq;
  }
}

/** The TikTok pixel's command object, as its own snippet builds it. */
type Ttq = unknown[] & {
  methods: string[];
  setAndDefer: (target: Record<string, unknown>, method: string) => void;
  instance: (id: string) => unknown;
  load: (id: string, options?: Record<string, unknown>) => void;
  page: () => void;
  track: (event: string, params?: Record<string, unknown>, options?: { event_id?: string }) => void;
  grantConsent: () => void;
  revokeConsent: () => void;
  _i?: Record<string, unknown[] & { _u?: string }>;
  _t?: Record<string, number>;
  _o?: Record<string, unknown>;
};

export const CURRENCY = "EGP";

const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;

/**
 * gtag's own switch: while true, the loaded library sends nothing at all, its
 * automatic events included. Set on a no to analytics, cleared on a yes.
 */
export function setGaDisabled(off: boolean) {
  if (GA4 && typeof window !== "undefined") (window as unknown as Record<string, boolean>)[`ga-disable-${GA4}`] = off;
}

/**
 * The TikTok pixel's queue and loader: TikTok's own snippet, typed. Calls made
 * before events.js arrives wait in the queue; load() adds the script tag itself.
 */
function createTtq(): Ttq {
  const ttq = [] as unknown as Ttq;
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = (target, method) => {
    target[method] = (...args: unknown[]) => (target as unknown as unknown[]).push([method, ...args]);
  };
  for (const m of ttq.methods) ttq.setAndDefer(ttq as unknown as Record<string, unknown>, m);
  ttq.instance = (id) => {
    const e = ttq._i?.[id] ?? [];
    for (const m of ttq.methods) ttq.setAndDefer(e as unknown as Record<string, unknown>, m);
    return e;
  };
  ttq.load = (id, options) => {
    const src = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i ?? {};
    ttq._i[id] = [];
    ttq._i[id]._u = src;
    ttq._t = ttq._t ?? {};
    ttq._t[id] = Date.now();
    ttq._o = ttq._o ?? {};
    ttq._o[id] = options ?? {};
    const script = document.createElement("script");
    script.async = true;
    script.src = `${src}?sdkid=${id}&lib=ttq`;
    document.head.appendChild(script);
  };
  return ttq;
}

/**
 * The pixels' and gtag's command queues, created on first use. A product page
 * fires view_item as soon as it hydrates, usually before fbevents.js, TikTok's
 * events.js and gtag.js have loaded; with the queues in place those calls wait
 * instead of being dropped, and each library replays them when it arrives
 * (components/analytics/Analytics.tsx loads fbevents.js and gtag.js; the TikTok
 * queue loads its own script).
 */
export function ensureQueues(): { pixel: boolean; tiktok: boolean; ga: boolean } {
  const fresh = { pixel: false, tiktok: false, ga: false };
  if (typeof window === "undefined") return fresh;
  if (PIXEL && !window.fbq && allowed("marketing")) {
    fresh.pixel = true;
    type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; push: unknown; loaded: boolean; version: string };
    const fbq = function (this: unknown) {
      // The pixel library expects the queue to hold Arguments objects, as its own snippet does.
      // eslint-disable-next-line prefer-rest-params, prefer-spread
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments as unknown as unknown[]);
      // eslint-disable-next-line prefer-rest-params
      else fbq.queue.push(arguments);
    } as unknown as Fbq;
    fbq.queue = [];
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    (window as unknown as { _fbq: Fbq })._fbq = fbq;
    fbq("consent", "grant");
    fbq("init", PIXEL);
    fbq("track", "PageView");
    initPageView = window.location.pathname;
  }
  if (TIKTOK && !window.ttq && allowed("marketing")) {
    fresh.tiktok = true;
    const ttq = createTtq();
    window.ttq = ttq;
    (window as unknown as { TiktokAnalyticsObject: string }).TiktokAnalyticsObject = "ttq";
    ttq.load(TIKTOK);
    ttq.page();
    // Both pixels are created together (the same yes), so one marker covers the first page view of each.
    initPageView = window.location.pathname;
  }
  if (GA4 && !window.gtag && allowed("analytics")) {
    fresh.ga = true;
    setGaDisabled(false);
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function () {
      // gtag.js reads Arguments objects from the data layer, not arrays.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    // Consent Mode v2: analytics is granted (gtag only loads then); ad signals follow the marketing choice.
    const ads = allowed("marketing") ? "granted" : "denied";
    window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: ads, ad_user_data: ads, ad_personalization: ads });
    window.gtag("js", new Date());
    window.gtag("config", GA4, { send_page_view: false });
  }
  return fresh;
}

/** The page the pixels' first page view (sent with their init) counted, until Analytics claims it. */
let initPageView: string | null = null;
/**
 * One-shot: the page ensureQueues already sent the pixel's PageView for. The
 * queue can be created by a page's own event (a product page's view_item)
 * before Analytics counts the page, and that page must not get two PageViews.
 */
export function takeInitPageView() {
  const path = initPageView;
  initPageView = null;
  return path;
}

/** GA4 and the pixel, each only while the visitor's choice allows it (a later "no" stops a library already loaded). */
const ga = (): Window["gtag"] => (allowed("analytics") ? window.gtag : undefined);
const meta = (): Window["fbq"] => (allowed("marketing") ? window.fbq : undefined);
const tiktok = (): Window["ttq"] => (allowed("marketing") ? window.ttq : undefined);

/** The content id the Shopify Facebook & Instagram channel gives catalogue items, so dynamic ads match. */
const contentId = (i: AnalyticsItem) => (i.productId ? `shopify_EG_${i.productId}_${i.variantId}` : i.variantId);
const value = (items: AnalyticsItem[]) => Math.round(items.reduce((n, i) => n + i.price * (i.quantity ?? 1), 0) * 100) / 100;

const ga4Items = (items: AnalyticsItem[]) =>
  items.map((i) => ({ item_id: i.variantId, item_name: i.name, price: i.price, quantity: i.quantity ?? 1, item_variant: i.variant, item_category: i.category ?? undefined }));

const metaPayload = (items: AnalyticsItem[]) => ({
  content_ids: items.map(contentId),
  content_type: "product",
  contents: items.map((i) => ({ id: contentId(i), quantity: i.quantity ?? 1, item_price: i.price })),
  content_name: items.length === 1 ? items[0].name : undefined,
  num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  value: value(items),
  currency: CURRENCY,
});

/**
 * TikTok's product fields. content_id is the Shopify variant id, which is what
 * Shopify's TikTok channel puts in the catalogue it syncs.
 */
const tiktokPayload = (items: AnalyticsItem[]) => ({
  contents: items.map((i) => ({ content_id: i.variantId, content_type: "product", content_name: i.name, quantity: i.quantity ?? 1, price: i.price })),
  content_type: "product",
  value: value(items),
  currency: CURRENCY,
});

/** Where an event happened, for slicing every report by page template. */
export const pageType = (path: string) =>
  path === "/" ? "home" : path.startsWith("/products/") ? "product" : path.startsWith("/shop") ? "collection" : path.startsWith("/finder") ? "finder" : path.startsWith("/tales") ? "tale" : path.startsWith("/bag") ? "bag" : "other";

/** Instagram's, Facebook's and TikTok's in-app browsers, where most ad visitors arrive. */
export const inApp = () => typeof navigator !== "undefined" && /Instagram|FBAN|FBAV|musical_ly|BytedanceWebview|TikTok/i.test(navigator.userAgent);

/**
 * The server half of the pixel (app/api/meta): the same event, with the same
 * id, sent from the server so Meta keeps it when the browser blocks the pixel
 * and deduplicates the pair. On only when NEXT_PUBLIC_META_CAPI=1.
 */
function capi(eventName: string, eventId: string, customData: Record<string, unknown>, sourceUrl: string) {
  if (process.env.NEXT_PUBLIC_META_CAPI !== "1" || typeof navigator === "undefined" || !navigator.sendBeacon || !allowed("marketing")) return;
  const body = JSON.stringify({ event_name: eventName, event_id: eventId, event_source_url: sourceUrl, custom_data: customData });
  navigator.sendBeacon("/api/meta", new Blob([body], { type: "application/json" }));
}

/**
 * The server half of the TikTok pixel (app/api/tiktok, the Events API): the
 * same event and id, so TikTok keeps one of the pair. It carries the ad click
 * id the visitor landed with, which the pixel misses when it loads only after
 * the cookie banner is answered. On only when NEXT_PUBLIC_TIKTOK_EVENTS=1.
 */
function tiktokServer(eventName: string, eventId: string, properties: Record<string, unknown>, sourceUrl: string) {
  if (process.env.NEXT_PUBLIC_TIKTOK_EVENTS !== "1" || typeof navigator === "undefined" || !navigator.sendBeacon || !allowed("marketing")) return;
  const ttclid = lastTouch()?.ttclid;
  const body = JSON.stringify({ event: eventName, event_id: eventId, url: sourceUrl, ttclid, properties });
  navigator.sendBeacon("/api/tiktok", new Blob([body], { type: "application/json" }));
}

/** Core Web Vitals from real visitors, tagged with the page template and the in-app flag. */
export function trackVital(metric: { name: string; value: number; id: string; rating?: string }) {
  if (typeof window === "undefined") return;
  try {
    const params = { metric_id: metric.id, value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value), rating: metric.rating, page_type: pageType(window.location.pathname), in_app: inApp() };
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: `web_vital_${metric.name.toLowerCase()}`, ...params });
    ga()?.("event", metric.name, { ...params, non_interaction: true });
  } catch {
    /* never break the page */
  }
}

const eventId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

/** Events from before the visitor's choice, with their ids and pages, until the banner is answered. */
type Held = { e: Event; id: string; url: string };
const held: Held[] = [];
const MAX_HELD = 30;

export function track(e: Event) {
  if (typeof window === "undefined") return;
  try {
    ensureQueues();
    const id = eventId();
    window.dataLayer = window.dataLayer ?? [];
    send(e, id, window.location.href, false);
    if ((PIXEL || TIKTOK || GA4) && readConsent() === null && held.length < MAX_HELD) held.push({ e, id, url: window.location.href });
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * The banner was answered: what waited goes to whichever library the answer
 * allows, with its original id (the data layer already has it), and the rest
 * is dropped. GA4 and the Conversions API copy keep the page the event
 * happened on; the pixel has no per-event page, so it reports the page the
 * visitor said yes on. Called once the libraries' queues exist.
 */
export function replayPending() {
  const events = held.splice(0);
  if (!readConsent()) return;
  for (const h of events) {
    try {
      send(h.e, h.id, h.url, true);
    } catch {
      /* never break the page */
    }
  }
}

/** One event to the data layer (unless replayed), GA4 and the pixels; ga(), meta() and tiktok() check the choice. */
function send(e: Event, id: string, url: string, replay: boolean) {
  const fbq = meta();
  const ttq = tiktok();
  const g = ga();
  // A replayed event keeps the page it happened on in GA4 (the pixel stamps the current page), and is already in the data layer.
  const gtag = g ? (cmd: string, name: string, params?: Record<string, unknown>) => (replay ? g(cmd, name, { ...params, page_location: url }) : params ? g(cmd, name, params) : g(cmd, name)) : undefined;
  const dataLayer = {
    push: (o: Record<string, unknown>) => {
      if (!replay) window.dataLayer!.push(o);
    },
  };

  switch (e.name) {
    case "view_item":
    case "add_to_cart":
    case "remove_from_cart":
    case "view_cart":
    case "begin_checkout": {
      const source = e.name === "add_to_cart" ? e.source : undefined;
      const ecommerce = { currency: CURRENCY, value: value(e.items), items: ga4Items(e.items) };
      // Shopify's checkout sends GA4's begin_checkout itself; the tap that leads there is its own event, so it is never counted twice.
      const gaName = e.name === "begin_checkout" ? "checkout_click" : e.name;
      dataLayer.push({ ecommerce: null });
      dataLayer.push({ event: gaName, event_id: id, source, ecommerce });
      gtag?.("event", gaName, source ? { ...ecommerce, source } : ecommerce);
      // InitiateCheckout and Purchase belong to Shopify's checkout (Facebook & Instagram channel),
      // so the bag's Checkout tap is a custom CheckoutClick and never double counts.
      const standard = { view_item: "ViewContent", add_to_cart: "AddToCart" } as const;
      const custom = { view_cart: "ViewCart", remove_from_cart: "RemoveFromCart", begin_checkout: "CheckoutClick" } as const;
      if (e.name in standard) {
        const name = standard[e.name as keyof typeof standard];
        const payload = source ? { ...metaPayload(e.items), source } : metaPayload(e.items);
        fbq?.("track", name, payload, { eventID: id });
        capi(name, id, payload, url);
        // The same names on TikTok. Its InitiateCheckout and CompletePayment come from Shopify's TikTok channel on checkout.
        const tt = tiktokPayload(e.items);
        ttq?.track(name, tt, { event_id: id });
        if (ttq) tiktokServer(name, id, tt, url);
      } else {
        fbq?.("trackCustom", custom[e.name as keyof typeof custom], metaPayload(e.items), { eventID: id });
        if (e.name === "begin_checkout") ttq?.track("CheckoutClick", tiktokPayload(e.items), { event_id: id });
      }
      break;
    }
    case "view_item_list": {
      const ecommerce = { item_list_name: e.list, items: ga4Items(e.items) };
      dataLayer.push({ ecommerce: null });
      dataLayer.push({ event: e.name, event_id: id, ecommerce });
      gtag?.("event", e.name, ecommerce);
      break;
    }
    case "select_item": {
      const ecommerce = { item_list_name: e.list, items: ga4Items([e.item]).map((i) => ({ ...i, index: e.index })) };
      dataLayer.push({ ecommerce: null });
      dataLayer.push({ event: e.name, event_id: id, ecommerce });
      gtag?.("event", e.name, ecommerce);
      break;
    }
    case "finder_step":
      dataLayer.push({ event: "finder_step", event_id: id, step: e.step, question: e.question, answer: e.answer });
      gtag?.("event", "finder_step", { step: e.step, question: e.question, answer: e.answer });
      break;
    case "ui":
      dataLayer.push({ event: e.action, event_id: id, label: e.label });
      gtag?.("event", e.action, { label: e.label });
      break;
    case "search":
      dataLayer.push({ event: "search", event_id: id, search_term: e.term, results: e.results });
      gtag?.("event", "search", { search_term: e.term, results: e.results });
      fbq?.("track", "Search", { search_string: e.term }, { eventID: id });
      ttq?.track("Search", { search_string: e.term }, { event_id: id });
      break;
    case "finder_start":
      dataLayer.push({ event: "finder_start", event_id: id });
      gtag?.("event", "finder_start");
      fbq?.("trackCustom", "FinderStart", {}, { eventID: id });
      break;
    case "finder_complete":
      dataLayer.push({ event: "finder_complete", event_id: id, answers: e.answers, matches: e.matches });
      gtag?.("event", "finder_complete", { answers: e.answers, matches: e.matches.join(",") });
      fbq?.("trackCustom", "FinderComplete", { answers: e.answers, matches: e.matches }, { eventID: id });
      break;
    case "generate_lead":
      dataLayer.push({ event: "generate_lead", event_id: id, method: e.method });
      gtag?.("event", "generate_lead", { method: e.method });
      fbq?.("track", "Lead", { content_name: e.method }, { eventID: id });
      ttq?.track("SubmitForm", { content_name: e.method }, { event_id: id });
      break;
  }
}
