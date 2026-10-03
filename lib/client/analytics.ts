"use client";

/**
 * One call site for every funnel event. Each event goes to the data layer
 * (for Tag Manager), to the Meta Pixel and to GA4 when those are installed
 * (components/analytics/Analytics.tsx loads them from env IDs), and is a
 * no-op otherwise. Purchase is not sent from here: it happens on Shopify's
 * checkout, where the Facebook & Instagram channel and Google channel fire it
 * with the same IDs.
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
  | { name: "add_to_cart"; items: AnalyticsItem[] }
  | { name: "remove_from_cart"; items: AnalyticsItem[] }
  | { name: "view_cart"; items: AnalyticsItem[] }
  | { name: "begin_checkout"; items: AnalyticsItem[] }
  | { name: "search"; term: string }
  | { name: "finder_start" }
  | { name: "finder_complete"; answers: string; matches: string[] }
  | { name: "generate_lead"; method: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export const CURRENCY = "EGP";

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

const eventId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

export function track(e: Event) {
  if (typeof window === "undefined") return;
  try {
    const id = eventId();
    const fbq = window.fbq;
    const gtag = window.gtag;
    window.dataLayer = window.dataLayer ?? [];

    switch (e.name) {
      case "view_item":
      case "add_to_cart":
      case "remove_from_cart":
      case "view_cart":
      case "begin_checkout": {
        const ecommerce = { currency: CURRENCY, value: value(e.items), items: ga4Items(e.items) };
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({ event: e.name, event_id: id, ecommerce });
        gtag?.("event", e.name, ecommerce);
        const meta = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout" } as const;
        if (e.name in meta) fbq?.("track", meta[e.name as keyof typeof meta], metaPayload(e.items), { eventID: id });
        else fbq?.("trackCustom", e.name === "view_cart" ? "ViewCart" : "RemoveFromCart", metaPayload(e.items), { eventID: id });
        break;
      }
      case "view_item_list": {
        const ecommerce = { item_list_name: e.list, items: ga4Items(e.items) };
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({ event: e.name, event_id: id, ecommerce });
        gtag?.("event", e.name, ecommerce);
        break;
      }
      case "search":
        window.dataLayer.push({ event: "search", event_id: id, search_term: e.term });
        gtag?.("event", "search", { search_term: e.term });
        fbq?.("track", "Search", { search_string: e.term }, { eventID: id });
        break;
      case "finder_start":
        window.dataLayer.push({ event: "finder_start", event_id: id });
        gtag?.("event", "finder_start");
        fbq?.("trackCustom", "FinderStart", {}, { eventID: id });
        break;
      case "finder_complete":
        window.dataLayer.push({ event: "finder_complete", event_id: id, answers: e.answers, matches: e.matches });
        gtag?.("event", "finder_complete", { answers: e.answers, matches: e.matches.join(",") });
        fbq?.("trackCustom", "FinderComplete", { answers: e.answers, matches: e.matches }, { eventID: id });
        break;
      case "generate_lead":
        window.dataLayer.push({ event: "generate_lead", event_id: id, method: e.method });
        gtag?.("event", "generate_lead", { method: e.method });
        fbq?.("track", "Lead", { content_name: e.method }, { eventID: id });
        break;
    }
  } catch {
    /* analytics must never break the page */
  }
}
