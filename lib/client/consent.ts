"use client";

import { useSyncExternalStore } from "react";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, cookieRootFor, parseConsent, serializeConsent, type Consent } from "@/lib/consent";

/**
 * The cookie choice in the browser: read it, keep it, and tell everything that
 * depends on it. lib/consent.ts holds the format the server routes share.
 */
const CHANGE = "eternal:consent";
const OPEN = "eternal:consent-open";

/** Set once by the banner from the server's settings (COOKIE_DOMAIN, the checkout host, the public Storefront token). */
export type ConsentSettings = { cookieDomain: string | null; checkoutDomain: string | null; storefrontToken: string | null };
let settings: ConsentSettings = { cookieDomain: null, checkoutDomain: null, storefrontToken: null };
export const configureConsent = (s: ConsentSettings) => {
  settings = s;
};

const readCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const part = document.cookie.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return part ? part.slice(name.length + 1) : null;
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

/** The current choice, or null while the visitor has not chosen. */
export const readConsent = (): Consent | null => parseConsent(readCookie(CONSENT_COOKIE));

// useSyncExternalStore needs the same object back while nothing changed.
let lastRaw: string | null | undefined;
let lastValue: Consent | null = null;
const snapshot = (): Consent | null => {
  const raw = readCookie(CONSENT_COOKIE);
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastValue = parseConsent(raw);
  }
  return lastValue;
};
const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
};
/** On the server and during hydration the choice is unknown: "pending", so nothing renders that depends on it. */
export function useConsent(): Consent | null | "pending" {
  return useSyncExternalStore<Consent | null | "pending">(subscribe, snapshot, () => "pending");
}

/** True only when the visitor said yes to this purpose. */
export const allowed = (purpose: "analytics" | "marketing") => Boolean(readConsent()?.[purpose]);

/** Keeps the visitor's choice and applies it at once. */
export function saveConsent(choice: { analytics: boolean; marketing: boolean }) {
  const before = readConsent();
  const c: Consent = { ...choice, at: Date.now() };
  setCookie(CONSENT_COOKIE, serializeConsent(c), CONSENT_MAX_AGE);
  applyConsent(c, before);
  window.dispatchEvent(new Event(CHANGE));
}

/** Opens the banner again (the footer's Cookie settings). */
export const openConsent = () => window.dispatchEvent(new Event(OPEN));
export const onConsentOpen = (fn: () => void) => {
  window.addEventListener(OPEN, fn);
  return () => window.removeEventListener(OPEN, fn);
};

/** The Meta click id of the latest ad visit, kept by lib/client/attribution.ts. */
function storedClick(): { fbclid: string; at: number } | null {
  try {
    const t = JSON.parse(window.localStorage.getItem("eternal.attr.last.v1") ?? "null") as { fbclid?: unknown; at?: unknown } | null;
    return t && typeof t.fbclid === "string" && typeof t.at === "number" && Date.now() - t.at < 7 * 86_400_000 ? { fbclid: t.fbclid, at: t.at } : null;
  } catch {
    return null;
  }
}

/**
 * What a choice changes beyond the page's own scripts (lib/client/analytics.ts reads the choice on every event):
 * - A yes to marketing keeps the ad click (_fbc) that brought the visitor, as Meta's pixel would have on landing.
 * - A no clears the cookies the pixel or GA4 had set, and tells them to stop.
 * - Shopify's checkout is told, so its own Meta and Google pixels follow the same choice.
 */
function applyConsent(c: Consent, before: Consent | null) {
  if (c.marketing && !readCookie("_fbc")) {
    const click = storedClick();
    if (click) setCookie("_fbc", `fb.1.${click.at}.${click.fbclid.slice(0, 500)}`, 90 * 86_400);
  }
  if (!c.marketing && before?.marketing !== false) {
    window.fbq?.("consent", "revoke");
    for (const name of ["_fbp", "_fbc"]) dropCookie(name);
  }
  if (c.marketing) window.fbq?.("consent", "grant");
  const gaState = (on: boolean) => (on ? "granted" : "denied");
  window.gtag?.("consent", "update", { analytics_storage: gaState(c.analytics), ad_storage: gaState(c.marketing), ad_user_data: gaState(c.marketing), ad_personalization: gaState(c.marketing) });
  if (!c.analytics && before?.analytics !== false) {
    for (const name of document.cookie.split(/;\s*/).map((p) => p.split("=")[0]).filter((n) => n === "_ga" || n.startsWith("_ga_"))) dropCookie(name);
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
      privacyScript = null;
      resolve(null);
    };
    document.head.appendChild(s);
  });
  return privacyScript;
}

/**
 * Shopify's Customer Privacy API for a headless store: it stores the choice where checkout reads it, so the
 * Facebook & Instagram and Google & YouTube pixels on checkout follow it. It only works when the site and
 * checkout share a root domain (myeternal.net), so on eternal-storefront.vercel.app it is skipped.
 */
function shareWithCheckout(c: Consent) {
  const storefrontRoot = root();
  const { checkoutDomain, storefrontToken } = settings;
  if (!storefrontRoot || !checkoutDomain || !storefrontToken || !checkoutDomain.endsWith(storefrontRoot)) return;
  void loadCustomerPrivacy().then((api) => {
    try {
      api?.setTrackingConsent(
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
          if (result?.error) console.error("[consent] Shopify did not store the choice:", result.error);
        },
      );
    } catch (err) {
      console.error("[consent] Shopify customer privacy failed:", err);
    }
  });
}
