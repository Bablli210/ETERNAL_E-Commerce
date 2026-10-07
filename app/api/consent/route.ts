import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, FBCLID, cookieRootFor, cookieValues, fbcFrom, parseConsent } from "@/lib/consent";

/**
 * Keeps the visitor's cookie choice from the server. The banner writes the
 * choice into the page at once (lib/client/consent.ts), then posts it here so
 * the same cookie is set again by the server: Safari keeps a cookie a page
 * script sets for 7 days only, and the choice should last its 180.
 *
 * With a yes to marketing it also sets Meta's click cookie (_fbc) from the ad
 * click the browser kept, for 90 days, as proxy.ts does for a visitor who had
 * already said yes when they clicked. With a no, _fbc goes.
 */
export const dynamic = "force-dynamic";

const DAY = 86_400;
/** Meta's own click window: an older click no longer explains a visit. */
const CLICK_WINDOW_MS = 7 * DAY * 1000;
const FBC = /^fb\.1\.\d{10,14}\.[A-Za-z0-9_\-.~]{1,500}$/;

const hostOf = (url: string | null) => {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

/** Only the storefront's own pages may set the choice (same check as app/api/meta). */
function sameOrigin(req: Request) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";
  const origin = hostOf(req.headers.get("origin"));
  return origin !== null && (origin === req.headers.get("host") || origin === hostOf(site.url));
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  let body: { value?: unknown; click?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const value = typeof body?.value === "string" ? body.value : null;
  const consent = parseConsent(value);
  if (!value || !consent) return new NextResponse(null, { status: 400 });

  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.hostname;
  const base = { path: "/", sameSite: "lax" as const, secure: url.protocol === "https:", domain: cookieRootFor(host.split(":")[0], process.env.COOKIE_DOMAIN) };
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(CONSENT_COOKIE, value, { ...base, maxAge: CONSENT_MAX_AGE });

  const header = req.headers.get("cookie");
  if (consent.marketing) {
    const click = body.click as { fbclid?: unknown; at?: unknown } | null;
    const fbclid = typeof click?.fbclid === "string" && FBCLID.test(click.fbclid) ? click.fbclid : null;
    const at = typeof click?.at === "number" && Number.isFinite(click.at) ? Math.round(click.at) : null;
    const now = Date.now();
    if (fbclid && at && at <= now + DAY * 1000 && now - at < CLICK_WINDOW_MS) {
      // The same click keeps the cookie it already has (its first time); a newer click replaces it.
      const current = cookieValues(header, "_fbc").find((v) => FBC.test(v) && v.endsWith(`.${fbclid}`));
      res.cookies.set("_fbc", current ?? fbcFrom(fbclid, at), { ...base, maxAge: 90 * DAY });
    }
  } else if (cookieValues(header, "_fbc").length) {
    res.cookies.set("_fbc", "", { ...base, maxAge: 0 });
  }
  return res;
}
