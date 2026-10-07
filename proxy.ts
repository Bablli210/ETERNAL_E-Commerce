import { NextResponse, type NextRequest } from "next/server";
import { heroByHandle, heroes } from "@/content/heroes";

/**
 * Two jobs, each on its own requests (see the matcher).
 *
 * The home page: every request for "/" is rewritten to /home/<handle>, one
 * static page per campaign still (content/heroes.ts), picked at random, so
 * each visit can open on a different bottle at no rendering cost. An ad link
 * pins one with ?hero=<handle>.
 *
 * Ad clicks: on page requests that carry a click id or a campaign, keeps
 * the click as first-party cookies set by the server, which outlive Safari's
 * 7-day cap on script-set cookies and travel to checkout when it shares the
 * root domain (COOKIE_DOMAIN, e.g. ".myeternal.net", applied on hosts under it).
 *
 * - _fbc: Meta's click id, in Meta's own format (fb.1.<ms>.<fbclid>).
 * - eternal_utm: the landing campaign, kept 30 days. /api/checkout falls back
 *   to it when the browser's own copy of the campaign is gone.
 */
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const DAY = 86_400;

/**
 * COOKIE_DOMAIN (".myeternal.net") only where the request's own host sits under it. The same deployment also
 * answers on eternal-storefront.vercel.app and preview URLs, where a browser would refuse a cookie for another domain.
 */
function cookieDomain(host: string) {
  const root = process.env.COOKIE_DOMAIN?.trim().replace(/^\./, "").toLowerCase();
  if (!root) return undefined;
  return host === root || host.endsWith(`.${root}`) ? `.${root}` : undefined;
}

/** The home page with the still an ad asked for, or one at random. */
function homeWithHero(url: NextRequest["nextUrl"]) {
  const hero = heroByHandle(url.searchParams.get("hero")?.toLowerCase()) ?? heroes[Math.floor(Math.random() * heroes.length)];
  const to = url.clone();
  to.pathname = `/home/${hero.handle}`;
  return NextResponse.rewrite(to);
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const fbclid = url.searchParams.get("fbclid");
  const utm = UTM.flatMap((k) => {
    const v = url.searchParams.get(k);
    return v ? [[k, v.slice(0, 100)] as const] : [];
  });
  let res = url.pathname === "/" ? homeWithHero(url) : NextResponse.next();
  if (!fbclid && !utm.length) return res;

  // A product link typed with capitals in an ad lands on the lowercase page with its campaign intact
  // (the page's own redirect cannot keep the query).
  const lower = url.pathname.startsWith("/products/") ? url.pathname.toLowerCase() : url.pathname;
  if (lower !== url.pathname) {
    const to = url.clone();
    to.pathname = lower;
    res = NextResponse.redirect(to, 308);
  }
  const base = { path: "/", sameSite: "lax" as const, secure: url.protocol === "https:", domain: cookieDomain(url.hostname) };
  if (fbclid) {
    // Keep the original timestamp when the same click lands again.
    const current = request.cookies.get("_fbc")?.value;
    if (!current?.endsWith(`.${fbclid}`)) res.cookies.set("_fbc", `fb.1.${Date.now()}.${fbclid.slice(0, 500)}`, { ...base, maxAge: 90 * DAY });
  }
  if (utm.length) res.cookies.set("eternal_utm", JSON.stringify({ ...Object.fromEntries(utm), landing: url.pathname }), { ...base, maxAge: 30 * DAY });
  return res;
}

export const config = {
  // "/" always. Otherwise pages only (never static files, images, API routes or
  // metadata files), and only when the URL carries a click id or a campaign: a
  // plain page view or a router prefetch never pays for a proxy invocation.
  // Next reads the matcher at build time, so each entry is written out in full.
  matcher: [
    // The home page, every request (prefetches too, so a client navigation home also gets a still).
    "/",
    { source: "/((?!_next/|api/|images/|videos/|icon|favicon|robots|sitemap).*)", has: [{ type: "query", key: "fbclid" }], missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/((?!_next/|api/|images/|videos/|icon|favicon|robots|sitemap).*)", has: [{ type: "query", key: "utm_source" }], missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/((?!_next/|api/|images/|videos/|icon|favicon|robots|sitemap).*)", has: [{ type: "query", key: "utm_medium" }], missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/((?!_next/|api/|images/|videos/|icon|favicon|robots|sitemap).*)", has: [{ type: "query", key: "utm_campaign" }], missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/((?!_next/|api/|images/|videos/|icon|favicon|robots|sitemap).*)", has: [{ type: "query", key: "utm_content" }], missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/((?!_next/|api/|images/|videos/|icon|favicon|robots|sitemap).*)", has: [{ type: "query", key: "utm_term" }], missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
  ],
};
