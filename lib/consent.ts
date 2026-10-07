/**
 * The visitor's cookie choice, shared by the browser and the server routes.
 *
 * Two optional purposes sit on top of what the shop needs to work (the bag,
 * this choice itself): analytics (GA4, Vercel Web Analytics) and marketing
 * (the Meta pixel and its Conversions API copy, and the ad-click ids that go
 * with an order). Nothing optional loads, and no optional cookie is set,
 * until the visitor says yes to that purpose. Egypt's Personal Data
 * Protection Law (151/2020) asks for that consent first.
 *
 * Stored in the first-party cookie `eternal_consent` as "1.<a>.<m>.<ms>":
 * version, analytics 0/1, marketing 0/1 and when it was given. Kept 180 days,
 * then the banner asks again.
 */
export const CONSENT_COOKIE = "eternal_consent";
export const CONSENT_MAX_AGE = 180 * 86_400;
const VERSION = "1";

export type Consent = { analytics: boolean; marketing: boolean; at: number };

export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw) return null;
  const [v, a, m, at] = decodeURIComponent(raw).split(".");
  if (v !== VERSION || !/^[01]$/.test(a ?? "") || !/^[01]$/.test(m ?? "") || !/^\d{10,14}$/.test(at ?? "")) return null;
  return { analytics: a === "1", marketing: m === "1", at: Number(at) };
}

export const serializeConsent = (c: Consent) => `${VERSION}.${c.analytics ? 1 : 0}.${c.marketing ? 1 : 0}.${Math.round(c.at)}`;

/** The choice read from a Cookie header, for the server routes. */
export function consentFromCookieHeader(header: string | null | undefined): Consent | null {
  const part = header?.split(/;\s*/).find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(part?.slice(CONSENT_COOKIE.length + 1));
}

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
