/**
 * The visitor's cookie choice, shared by the browser and the server routes.
 *
 * Two optional purposes sit on top of what the shop needs to work (the bag,
 * this choice itself, and a note of which campaign brought the visitor):
 * analytics (GA4, Vercel Web Analytics) and marketing (Meta's pixel and its
 * Conversions API copy, Google's ad signals, the ad-click ids that travel with
 * an order, and the same at Shopify checkout). Nothing that identifies the
 * visitor to Meta or Google is set or sent until they say yes to that purpose.
 * Egypt's Personal Data Protection Law (151/2020) asks for that consent first.
 *
 * Stored in the first-party cookie `eternal_consent` as "1.<a>.<m>.<ms>":
 * version, analytics 0/1, marketing 0/1 and when it was given. Kept 180 days
 * (set by the server, /api/consent, so Safari keeps it too), then the banner
 * asks again. Should two copies exist (one per domain scope), the newer wins.
 */
export const CONSENT_COOKIE = "eternal_consent";
export const CONSENT_MAX_AGE = 180 * 86_400;
const VERSION = "1";
const FORMAT = /^1\.[01]\.[01]\.\d{10,14}$/;

export type Consent = { analytics: boolean; marketing: boolean; at: number };

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

/** The choice read from a Cookie header, for the server routes. */
export const consentFromCookieHeader = (header: string | null | undefined): Consent | null => latestConsent(cookieValues(header, CONSENT_COOKIE));

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

/** Meta's click id as Meta's own _fbc cookie writes it. */
export const FBCLID = /^[A-Za-z0-9_\-.~]{1,500}$/;
export const fbcFrom = (fbclid: string, at: number) => `fb.1.${Math.round(at)}.${fbclid}`;
