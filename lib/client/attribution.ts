"use client";

/**
 * Where a visitor came from, kept so the order can be attributed to the ad
 * that sent them. The landing URL's UTM and click-id parameters are stored
 * twice: the first touch (kept 30 days) and the latest touch (kept 7 days,
 * Meta's default click window). Both travel to Shopify checkout as cart
 * attributes, so every order shows its campaign on the order page. A
 * ?discount=CODE in the ad link is kept the same way and applied at checkout.
 */
const FIRST = "eternal.attr.first.v1";
const LAST = "eternal.attr.last.v1";
const DAY = 86_400_000;

const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid", "discount"] as const;
type Param = (typeof PARAMS)[number];

export type Touch = Partial<Record<Param, string>> & { landing: string; referrer: string; at: number };

function read(key: string, maxAge: number): Touch | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const t = JSON.parse(raw) as Touch;
    return typeof t.at === "number" && Date.now() - t.at < maxAge ? t : null;
  } catch {
    return null;
  }
}

function write(key: string, t: Touch) {
  try {
    window.localStorage.setItem(key, JSON.stringify(t));
  } catch {
    /* blocked storage: attribution is best effort */
  }
}

/** Call once per page load. Only a URL that carries campaign parameters counts as a touch. */
export function captureAttribution() {
  const url = new URL(window.location.href);
  const found: Partial<Record<Param, string>> = {};
  for (const p of PARAMS) {
    const v = url.searchParams.get(p);
    if (v) found[p] = v.slice(0, 200);
  }
  if (!Object.keys(found).length) return;
  const touch: Touch = { ...found, landing: url.pathname, referrer: document.referrer.slice(0, 200), at: Date.now() };
  write(LAST, touch);
  if (!read(FIRST, 30 * DAY)) write(FIRST, touch);
}

export function lastTouch() {
  return read(LAST, 7 * DAY);
}

/** Cart attributes for Shopify: shown under "Additional details" on the order. */
export function checkoutAttributes(): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  // Meta's _fbp/_fbc and GA's client id are read from cookies by the checkout route itself.
  if (/Instagram|FBAN|FBAV/i.test(navigator.userAgent)) out.push({ key: "in_app", value: /Instagram/i.test(navigator.userAgent) ? "instagram" : "facebook" });
  const last = lastTouch();
  const first = read(FIRST, 30 * DAY);
  if (last) {
    for (const p of PARAMS) if (last[p]) out.push({ key: p, value: last[p]! });
    out.push({ key: "landing_page", value: last.landing });
  }
  if (first && first.at !== last?.at) {
    if (first.utm_source) out.push({ key: "first_utm_source", value: first.utm_source });
    if (first.utm_campaign) out.push({ key: "first_utm_campaign", value: first.utm_campaign });
  }
  return out;
}
