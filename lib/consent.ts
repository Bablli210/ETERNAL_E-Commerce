/**
 * The visitor's cookie choice, shared by the browser and the server routes.
 *
 * Two optional purposes sit on top of what the shop needs to work (the bag,
 * this choice itself, and a note of which campaign brought the visitor):
 * analytics (GA4, Vercel Web Analytics) and marketing (Meta's pixel and its
 * Conversions API copy, Google's ad signals, the ad-click ids that travel with
 * an order, and the same at Shopify checkout once it can be told).
 *
 * Both are on for every visitor from the first page, at the owner's request
 * (DEFAULT_CONSENT): nobody is asked, and no banner shows. A visitor who turns
 * them off in Cookie settings (the footer, the help page) keeps that choice.
 *
 * Stored in the first-party cookie `eternal_consent` as "1.<a>.<m>.<ms>":
 * version, analytics 0/1, marketing 0/1 and when it was given. Kept 180 days
 * (set by the server, /api/consent, so Safari keeps it too), then the default
 * applies again. Should two copies exist (one per domain scope), the newer wins.
 */
export const CONSENT_COOKIE = "eternal_consent";
export const CONSENT_MAX_AGE = 180 * 86_400;
const VERSION = "1";
const FORMAT = /^1\.[01]\.[01]\.\d{10,14}$/;

export type Consent = { analytics: boolean; marketing: boolean; at: number };

/**
 * What applies while the visitor has not chosen: every purpose on (the owner's
 * choice). Set both to false to ask first again: the banner then opens on its
 * own, and the code that holds clicks and events until an answer takes over.
 */
export const DEFAULT_CONSENT: Consent = { analytics: true, marketing: true, at: 0 };

/** Anything that is not exactly the stored format counts as no choice. */
export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw || !FORMAT.test(raw)) return null;
  const [, a, m, at] = raw.split(".");
  return { analytics: a === "1", marketing: m === "1", at: Number(at) };
}

export const serializeConsent = (c: Consent) => `${VERSION}.${c.analytics ? 1 : 0}.${c.marketing ? 1 : 0}.${Math.round(c.at)}`;

/** The newest valid choice among several copies of the cookie. */
export function latestConsent(values: (string | null | undefined)[]): Consent | null {
  let best: Consent | null = null;
  for (const v of values) {
    const c = parseConsent(v);
    if (c && (!best || c.at > best.at)) best = c;
  }
  return best;
}

/** Every value a Cookie header carries for one name (a cookie can be set on the host and on its root). */
export const cookieValues = (header: string | null | undefined, name: string) =>
  (header ?? "")
    .split(/;\s*/)
    .filter((c) => c.startsWith(`${name}=`))
    .map((c) => c.slice(name.length + 1));

/** The visitor's own choice, else DEFAULT_CONSENT, or null while nobody has chosen and the default asks first. */
export const consentOrDefault = (stored: Consent | null): Consent | null => stored ?? (DEFAULT_CONSENT.analytics || DEFAULT_CONSENT.marketing ? DEFAULT_CONSENT : null);

/** The choice read from a Cookie header, for the server routes. */
export const consentFromCookieHeader = (header: string | null | undefined): Consent | null => consentOrDefault(latestConsent(cookieValues(header, CONSENT_COOKIE)));

/**
 * The root a cookie should be set on for this host: COOKIE_DOMAIN (".myeternal.net")
 * when the host sits under it, so the choice and the ad cookies reach the
 * other subdomains; nothing (a host-only cookie) on eternal-storefront.vercel.app and previews.
 */
export function cookieRootFor(host: string, cookieDomain: string | null | undefined): string | undefined {
  const root = cookieDomain?.trim().replace(/^\./, "").toLowerCase();
  if (!root) return undefined;
  const h = host.toLowerCase();
  return h === root || h.endsWith(`.${root}`) ? `.${root}` : undefined;
}

/**
 * Whether the banner can hand the choice to Shopify's checkout (its Customer
 * Privacy API): the site's host and checkout both under COOKIE_DOMAIN, and the
 * public Storefront token set. The banner, the help page and the launch
 * checklist all ask this, so the promise and the behaviour agree.
 */
export function checkoutFollowsChoice(host: string, cookieDomain: string | null | undefined, checkoutDomain: string | null | undefined, token: string | null | undefined): boolean {
  const root = cookieRootFor(host, cookieDomain);
  const checkout = checkoutDomain?.trim().toLowerCase();
  return Boolean(root && token?.trim() && checkout && `.${checkout}`.endsWith(root));
}

/** Meta's click id as Meta's own _fbc cookie writes it. */
export const FBCLID = /^[A-Za-z0-9_\-.~]{1,500}$/;
export const fbcFrom = (fbclid: string, at: number) => `fb.1.${Math.round(at)}.${fbclid}`;
