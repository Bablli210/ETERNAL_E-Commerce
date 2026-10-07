"use client";

import { QUIZ_PROFILE_KEY } from "@/lib/finder";
import { readConsent } from "./consent-state";

/**
 * Where a visitor came from, kept so the order can be attributed to the ad
 * that sent them. The landing URL's UTM and click-id parameters are stored
 * twice: the first touch (kept 30 days) and the latest touch (kept 7 days,
 * Meta's default click window). Both travel to Shopify checkout as cart
 * attributes, so every order shows its campaign on the order page. A
 * ?discount=CODE in the ad link is kept the same way and applied at checkout.
 *
 * The ad click ids (fbclid, gclid, ttclid) identify the visitor to the ad
 * network, so they are only kept with a yes to marketing (lib/consent.ts).
 * Before the visitor has chosen, the touch is kept without them and the
 * click waits in this tab's session storage: a yes adopts it, a no forgets
 * it. The referrer is kept as its site only (https://www.instagram.com).
 */
const FIRST = "eternal.attr.first.v1";
const LAST = "eternal.attr.last.v1";
/** The click waiting for the cookie choice, in session storage. */
const HELD = "eternal.attr.held.v1";
/** When this browser first saw the finder profile now stored, for a profile written without a time. */
const QUIZ_SEEN = "eternal.quiz.seen.v1";
const DAY = 86_400_000;
/** A finder profile explains an order for a week, like a click; after that it no longer travels to checkout. */
const QUIZ_MAX_AGE = 7 * DAY;
/** The codes /api/checkout passes on to Shopify; anything else is dropped there. */
const DISCOUNT_CODE = /^[A-Za-z0-9_-]{2,40}$/;

const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid", "discount"] as const;
type Param = (typeof PARAMS)[number];
const CLICK_IDS = new Set<Param>(["fbclid", "gclid", "ttclid"]);

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

const referrerSite = () => {
  try {
    return document.referrer ? new URL(document.referrer).origin : "";
  } catch {
    return "";
  }
};

const hasClick = (t: Partial<Record<Param, string>>) => [...CLICK_IDS].some((p) => t[p]);
const withoutClicks = <T extends Partial<Record<Param, string>>>(t: T): T => {
  const out = { ...t };
  for (const p of CLICK_IDS) delete out[p];
  return out;
};

function readHeld(): Touch | null {
  try {
    const t = JSON.parse(window.sessionStorage.getItem(HELD) ?? "null") as Touch | null;
    return t && typeof t.at === "number" && Date.now() - t.at < 7 * DAY ? t : null;
  } catch {
    return null;
  }
}

/** Call once per page load. Only a URL that carries campaign parameters counts as a touch. */
export function captureAttribution() {
  quizProfile();
  const url = new URL(window.location.href);
  const found: Partial<Record<Param, string>> = {};
  for (const p of PARAMS) {
    const v = url.searchParams.get(p);
    // Meta's click ids run past 200 characters; _fbc needs the whole id.
    if (v) found[p] = v.slice(0, CLICK_IDS.has(p) ? 500 : 200);
  }
  if (!Object.keys(found).length) return;
  const touch: Touch = { ...found, landing: url.pathname, referrer: referrerSite(), at: Date.now() };
  const consent = readConsent();
  if (!consent?.marketing && hasClick(found)) {
    // No choice yet: the whole touch waits in this tab for the banner's answer (the same click seen again keeps its first time).
    if (!consent) {
      const held = readHeld();
      if (!held || PARAMS.some((p) => (held[p] ?? "") !== (found[p] ?? ""))) {
        try {
          window.sessionStorage.setItem(HELD, JSON.stringify(touch));
        } catch {
          /* blocked storage: the click is simply not kept */
        }
      }
    }
    for (const p of CLICK_IDS) delete found[p];
    if (!Object.keys(found).length) return;
  }
  // The same click seen again (Back to the landing page, a reload) keeps its first time, so one visit never reads as two touches.
  const prev = read(LAST, 7 * DAY);
  if (prev && PARAMS.every((p) => (prev[p] ?? "") === (found[p] ?? ""))) return;
  const kept: Touch = { ...found, landing: touch.landing, referrer: touch.referrer, at: touch.at };
  write(LAST, kept);
  if (!read(FIRST, 30 * DAY)) write(FIRST, kept);
}

/**
 * The Meta click a yes adopted, for _fbc, when a later visit (without a click) is the latest touch. In local
 * storage, shared by every tab, so a no in any tab forgets it even in a tab that was asleep at the time.
 */
const ADOPTED = "eternal.attr.adopted.v1";

function readAdopted(): { fbclid: string; at: number } | null {
  try {
    const a = JSON.parse(window.localStorage.getItem(ADOPTED) ?? "null") as { fbclid?: unknown; at?: unknown } | null;
    return a && typeof a.fbclid === "string" && typeof a.at === "number" && Date.now() - a.at < 7 * DAY ? { fbclid: a.fbclid, at: a.at } : null;
  } catch {
    return null;
  }
}

/**
 * A yes to marketing: the click that waited for it becomes the latest touch, unless a later visit already is.
 * True when it held a Meta click.
 */
export function adoptHeldClick(): boolean {
  const held = readHeld();
  try {
    window.sessionStorage.removeItem(HELD);
  } catch {
    /* nothing held */
  }
  if (!held) return false;
  if (held.fbclid) {
    try {
      window.localStorage.setItem(ADOPTED, JSON.stringify({ fbclid: held.fbclid, at: held.at }));
    } catch {
      /* blocked storage: the latest touch below still carries it */
    }
  }
  const last = read(LAST, 7 * DAY);
  if (!(last && last.at > held.at)) {
    write(LAST, held);
    const first = read(FIRST, 30 * DAY);
    if (!first || first.at === held.at) write(FIRST, held);
  }
  return Boolean(held.fbclid);
}

/** A no to marketing: the click ids go, the campaign stays. */
export function forgetClicks() {
  try {
    window.sessionStorage.removeItem(HELD);
    window.localStorage.removeItem(ADOPTED);
  } catch {
    /* nothing kept */
  }
  for (const [key, maxAge] of [
    [LAST, 7 * DAY],
    [FIRST, 30 * DAY],
  ] as const) {
    const t = read(key, maxAge);
    if (t && hasClick(t)) write(key, withoutClicks(t));
  }
}

/** Meta's click id from the latest ad visit, for _fbc. */
export function latestClick(): { fbclid: string; at: number } | null {
  const t = read(LAST, 7 * DAY);
  const adopted = readAdopted();
  if (t?.fbclid && (!adopted || t.at >= adopted.at)) return { fbclid: t.fbclid, at: t.at };
  return adopted;
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
  // Ad click ids identify the visitor to the ad network, so they go with the order only after a yes to marketing.
  const marketing = Boolean(readConsent()?.marketing);
  if (last) {
    for (const p of PARAMS) if (last[p] && (marketing || !CLICK_IDS.has(p))) out.push({ key: p, value: last[p]!.slice(0, 200) });
    out.push({ key: "landing_page", value: last.landing });
  }
  if (first && first.at !== last?.at) {
    if (first.utm_source) out.push({ key: "first_utm_source", value: first.utm_source });
    if (first.utm_campaign) out.push({ key: "first_utm_campaign", value: first.utm_campaign });
  }
  return out;
}
