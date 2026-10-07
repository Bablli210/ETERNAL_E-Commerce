"use client";

import { QUIZ_PROFILE_KEY } from "@/lib/finder";

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
/** When this browser first saw the finder profile now stored, for a profile written without a time. */
const QUIZ_SEEN = "eternal.quiz.seen.v1";
const DAY = 86_400_000;
/** A finder profile explains an order for a week, like a click; after that it no longer travels to checkout. */
const QUIZ_MAX_AGE = 7 * DAY;
/** The codes /api/checkout passes on to Shopify; anything else is dropped there. */
const DISCOUNT_CODE = /^[A-Za-z0-9_-]{2,40}$/;

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
  quizProfile();
  const url = new URL(window.location.href);
  const found: Partial<Record<Param, string>> = {};
  for (const p of PARAMS) {
    const v = url.searchParams.get(p);
    if (v) found[p] = v.slice(0, 200);
  }
  if (!Object.keys(found).length) return;
  // The same click seen again (Back to the landing page, a reload) keeps its first time, so one visit never reads as two touches.
  const prev = read(LAST, 7 * DAY);
  if (prev && PARAMS.every((p) => (prev[p] ?? "") === (found[p] ?? ""))) return;
  const touch: Touch = { ...found, landing: url.pathname, referrer: document.referrer.slice(0, 200), at: Date.now() };
  write(LAST, touch);
  if (!read(FIRST, 30 * DAY)) write(FIRST, touch);
}

export function lastTouch() {
  return read(LAST, 7 * DAY);
}

/** The ad link's discount code, when it is one checkout passes on to Shopify. */
export function discountCode(): string | null {
  const code = lastTouch()?.discount;
  return code && DISCOUNT_CODE.test(code) ? code : null;
}

/** who=her&notes=amber-spice%2Cgourmand reads who=her&notes=amber-spice,gourmand on the order page. */
const decodeProfile = (profile: string) =>
  Array.from(new URLSearchParams(profile))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

/**
 * The finder's answers, decoded, while they are less than a week old. The
 * finder stores either { profile, at } or the bare query string; a bare
 * string is timed from the first time this browser saw it (every page view
 * and every checkout looks).
 */
function quizProfile(): string | null {
  try {
    const raw = window.localStorage.getItem(QUIZ_PROFILE_KEY);
    if (!raw) return null;
    let profile = raw;
    let at: number | null = null;
    if (raw.startsWith("{")) {
      const v = JSON.parse(raw) as { profile?: unknown; at?: unknown };
      if (typeof v.profile !== "string") return null;
      profile = v.profile;
      if (typeof v.at === "number") at = v.at;
    }
    if (at === null) {
      const seen = JSON.parse(window.localStorage.getItem(QUIZ_SEEN) ?? "null") as { profile?: unknown; at?: unknown } | null;
      if (seen?.profile === raw && typeof seen.at === "number") at = seen.at;
      else {
        at = Date.now();
        window.localStorage.setItem(QUIZ_SEEN, JSON.stringify({ profile: raw, at }));
      }
    }
    return Date.now() - at < QUIZ_MAX_AGE ? decodeProfile(profile) || null : null;
  } catch {
    return null;
  }
}

/** Cart attributes for Shopify: shown under "Additional details" on the order. */
export function checkoutAttributes(): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  // Meta's _fbp/_fbc and GA's client id are read from cookies by the checkout route itself.
  // The finder's answers, so orders can be read by taste profile.
  const quiz = quizProfile();
  if (quiz) out.push({ key: "quiz_profile", value: quiz.slice(0, 200) });
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
