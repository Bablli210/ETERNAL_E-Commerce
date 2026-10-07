"use client";

import { useSyncExternalStore } from "react";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, FBCLID, checkoutFollowsChoice, cookieRootFor, fbcFrom, parseConsent, serializeConsent, type Consent } from "@/lib/consent";
import { readConsent, readCookie } from "./consent-state";
import { adoptHeldClick, forgetClicks, latestClick } from "./attribution";
import { setGaDisabled } from "./analytics";

export { allowed, readConsent } from "./consent-state";

/**
 * The cookie choice in the browser: keep it, apply it, and tell everything
 * that depends on it. lib/consent.ts holds the format the server routes share;
 * lib/client/consent-state.ts reads it.
 */
const CHANGE = "eternal:consent";
const OPEN = "eternal:consent-open";
/** The choice last handed to Shopify in this tab, so each visit re-syncs it once. */
const SYNCED = "eternal.consent.synced.v1";
/** Written on every save so other open tabs hear of it at once (the storage event); the cookie stays the record. */
const BROADCAST = "eternal.consent.v1";

/** Set once by the banner from the server's settings (COOKIE_DOMAIN, the checkout host, the public Storefront token). */
export type ConsentSettings = { cookieDomain: string | null; checkoutDomain: string | null; storefrontToken: string | null };
let settings: ConsentSettings = { cookieDomain: null, checkoutDomain: null, storefrontToken: null };
export const configureConsent = (s: ConsentSettings) => {
  settings = s;
};

const root = () => (typeof window === "undefined" ? undefined : cookieRootFor(window.location.hostname, settings.cookieDomain));

function setCookie(name: string, value: string, maxAge: number) {
  const domain = root();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${domain ? `; Domain=${domain}` : ""}${secure}`;
}

/** Removes a cookie wherever it may have been set: this host and the shared root. */
function dropCookie(name: string) {
  const host = window.location.hostname;
  const domains = new Set<string | undefined>([undefined, root(), `.${host}`, `.${host.split(".").slice(-2).join(".")}`]);
  for (const d of domains) document.cookie = `${name}=; Path=/; Max-Age=0${d ? `; Domain=${d}` : ""}`;
}

const cookieNames = () => document.cookie.split(/;\s*/).map((p) => p.split("=")[0]);

// useSyncExternalStore needs the same object back while nothing changed.
let lastKey: string | null | undefined;
let lastValue: Consent | null = null;
const keyOf = (c: Consent | null) => (c ? serializeConsent(c) : null);
const snapshot = (): Consent | null => {
  const c = readConsent();
  const key = keyOf(c);
  if (key !== lastKey) {
    lastKey = key;
    lastValue = c;
  }
  return lastValue;
};

/** The choice this page has acted on; undefined until the page first reads it. */
let applied: string | null | undefined;
/**
 * Another tab may have changed the choice (the cookie is shared): this tab
 * follows as soon as it hears (the storage event), or when it is shown or
 * hidden again, so a no given elsewhere stops this tab's pixel and GA4 too, and
 * a yes keeps this tab's ad click.
 */
function followOtherTabs() {
  const c = readConsent();
  const key = keyOf(c);
  if (applied === undefined) applied = key;
  if (key === applied) return;
  const before = applied ? parseConsent(applied) : null;
  applied = key;
  if (c) {
    if (c.marketing) adoptHeldClick();
    else forgetClicks();
    applyInPage(c, before);
    // A click this tab was holding: the server sets _fbc again, so Safari keeps it its full 90 days.
    const click = c.marketing ? latestClick() : null;
    if (click && key) keepOnServer(key, click);
  }
}

const subscribe = (onChange: () => void) => {
  if (applied === undefined) applied = keyOf(readConsent());
  // Every subscriber re-reads (React skips the render when nothing changed); the page acts on a change once.
  const recheck = () => {
    followOtherTabs();
    onChange();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === BROADCAST) recheck();
  };
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", recheck);
  document.addEventListener("visibilitychange", recheck);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", recheck);
    document.removeEventListener("visibilitychange", recheck);
  };
};
/** On the server and during hydration the choice is unknown: "pending", so nothing renders that depends on it. */
export function useConsent(): Consent | null | "pending" {
  return useSyncExternalStore<Consent | null | "pending">(subscribe, snapshot, () => "pending");
}

/** Keeps the visitor's choice and applies it at once. */
export function saveConsent(choice: { analytics: boolean; marketing: boolean }) {
  const before = readConsent();
  const c: Consent = { ...choice, at: Date.now() };
  const value = serializeConsent(c);
  // One copy only: an older one on another domain scope would otherwise linger beside it.
  dropCookie(CONSENT_COOKIE);
  setCookie(CONSENT_COOKIE, value, CONSENT_MAX_AGE);
  if (c.marketing) adoptHeldClick();
  else forgetClicks();
  const click = c.marketing ? latestClick() : null;
  applyInPage(c, before);
  applied = value;
  keepOnServer(value, click);
  shareWithCheckout(c);
  try {
    window.localStorage.setItem(BROADCAST, value);
  } catch {
    /* other tabs follow on focus instead */
  }
  window.dispatchEvent(new Event(CHANGE));
}

/**
 * The same cookies again from the server (app/api/consent), so they last
 * their full time: Safari keeps cookies a page script sets for 7 days only.
 */
function keepOnServer(value: string, click: { fbclid: string; at: number } | null) {
  try {
    void fetch("/api/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value, click }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      /* the page's own copy stands */
    });
  } catch {
    /* the page's own copy stands */
  }
}

/** Opens the banner again (the footer's Cookie settings). */
export const openConsent = () => window.dispatchEvent(new Event(OPEN));
export const onConsentOpen = (fn: () => void) => {
  window.addEventListener(OPEN, fn);
  return () => window.removeEventListener(OPEN, fn);
};

/**
 * What a choice changes in this page beyond its own scripts (lib/client/analytics.ts reads the choice on every event):
 * - A yes to marketing keeps the ad click (_fbc) that brought the visitor, as Meta's pixel would have on landing.
 * - A no clears the cookies the pixel, GA4 or Google's ad signals had set, and tells them to stop.
 */
function applyInPage(c: Consent, before: Consent | null) {
  const click = c.marketing ? latestClick() : null;
  if (click && FBCLID.test(click.fbclid) && !readCookie("_fbc")?.endsWith(`.${click.fbclid}`)) setCookie("_fbc", fbcFrom(click.fbclid, click.at), 90 * 86_400);
  if (!c.marketing && before?.marketing !== false) {
    window.fbq?.("consent", "revoke");
    for (const name of cookieNames().filter((n) => n === "_fbp" || n === "_fbc" || n.startsWith("_gcl_") || n.startsWith("_gac_"))) dropCookie(name);
  }
  if (c.marketing) window.fbq?.("consent", "grant");
  const gaState = (on: boolean) => (on ? "granted" : "denied");
  window.gtag?.("consent", "update", { analytics_storage: gaState(c.analytics), ad_storage: gaState(c.marketing), ad_user_data: gaState(c.marketing), ad_personalization: gaState(c.marketing) });
  setGaDisabled(!c.analytics);
  if (!c.analytics && before?.analytics !== false) {
    for (const name of cookieNames().filter((n) => n === "_ga" || n.startsWith("_ga_"))) dropCookie(name);
  }
}

/** Once per visit, the stored choice goes to Shopify again (its own record can lapse or be cleared). */
export function syncCheckoutOnce() {
  const c = readConsent();
  if (!c) return;
  try {
    if (window.sessionStorage.getItem(SYNCED) === serializeConsent(c)) return;
  } catch {
    /* no session storage: sync every page */
  }
  shareWithCheckout(c);
}

type CustomerPrivacy = { setTrackingConsent: (consent: Record<string, unknown>, done?: (result?: { error?: string }) => void) => void };
declare global {
  interface Window {
    Shopify?: { customerPrivacy?: CustomerPrivacy };
  }
}

let privacyScript: Promise<CustomerPrivacy | null> | null = null;
function loadCustomerPrivacy(): Promise<CustomerPrivacy | null> {
  if (window.Shopify?.customerPrivacy) return Promise.resolve(window.Shopify.customerPrivacy);
  privacyScript ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js";
    s.async = true;
    s.onload = () => resolve(window.Shopify?.customerPrivacy ?? null);
    s.onerror = () => {
      s.remove();
      privacyScript = null;
      resolve(null);
    };
    document.head.appendChild(s);
  });
  return privacyScript;
}

/** Whether this page can hand the choice to checkout (lib/consent.ts checkoutFollowsChoice); the banner's copy says so only then. */
export const checkoutFollows = () =>
  typeof window !== "undefined" && checkoutFollowsChoice(window.location.hostname, settings.cookieDomain, settings.checkoutDomain, settings.storefrontToken);

/**
 * Shopify's Customer Privacy API for a headless store: it stores the choice where checkout reads it, so the
 * Facebook & Instagram and Google & YouTube pixels on checkout follow it. It needs the public Storefront token,
 * SHOPIFY_CHECKOUT_DOMAIN and COOKIE_DOMAIN, with the site and checkout under that one root domain
 * (myeternal.net), so on eternal-storefront.vercel.app it is skipped. A script that fails to load is tried once more.
 */
function shareWithCheckout(c: Consent, attempt = 1) {
  if (!checkoutFollows()) return;
  const storefrontRoot = root()!;
  const checkoutDomain = settings.checkoutDomain!.trim().toLowerCase();
  const storefrontToken = settings.storefrontToken!.trim();
  const value = serializeConsent(c);
  // A newer choice has its own call; an older one must never overwrite it.
  const current = () => keyOf(readConsent()) === value;
  void loadCustomerPrivacy().then((api) => {
    if (!current()) return;
    if (!api) {
      if (attempt < 2) window.setTimeout(() => shareWithCheckout(c, attempt + 1), 3000);
      return;
    }
    try {
      api.setTrackingConsent(
        {
          analytics: c.analytics,
          marketing: c.marketing,
          preferences: c.analytics,
          sale_of_data: c.marketing,
          headlessStorefront: true,
          checkoutRootDomain: checkoutDomain,
          storefrontRootDomain: storefrontRoot.replace(/^\./, ""),
          storefrontAccessToken: storefrontToken,
        },
        (result) => {
          if (result?.error) {
            console.error("[consent] Shopify did not store the choice:", result.error);
            return;
          }
          try {
            window.sessionStorage.setItem(SYNCED, value);
          } catch {
            /* synced; just not remembered */
          }
        },
      );
    } catch (err) {
      console.error("[consent] Shopify customer privacy failed:", err);
    }
  });
}
