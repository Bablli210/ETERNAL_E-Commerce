import "server-only";
import { headers } from "next/headers";

/**
 * Where invite and reset links point. Not site.url: with NEXT_PUBLIC_SITE_URL
 * unset it falls back to the project's production domain, myeternal.net,
 * which may still show the old site. The request's own host is used when it
 * is one people can open without a Vercel login: eternal-storefront.vercel.app
 * now, www.myeternal.net once the domain points at Vercel. Deployment and
 * preview URLs ask for a Vercel login only the owner has, so a link made
 * there points at the public address instead (locally, at localhost).
 */
const PUBLIC_HOSTS = new Set(["eternal-storefront.vercel.app", "www.myeternal.net"]);
const FALLBACK = "https://eternal-storefront.vercel.app";

export async function dashboardOrigin(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  if (PUBLIC_HOSTS.has(host)) return `https://${host}`;
  if (process.env.NODE_ENV !== "production" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `http://${host}`;
  return FALLBACK;
}
