import "server-only";
import { unstable_cache } from "next/cache";

/**
 * Checks on the website itself, for "Can we trust the data?", without a
 * Vercel key (every Vercel token can also write, so the dashboard has none):
 *
 * - which tracking keys the RUNNING deployment was built with. NEXT_PUBLIC_*
 *   values are fixed into the build, so a key added in Vercel counts only
 *   after a redeploy, which is the truth about the live site. Each is read
 *   with a literal process.env.NAME so Next inlines it, and only yes/no
 *   leaves this file. These are trusted on Production only; a preview or a
 *   laptop answers "unknown".
 * - whether myeternal.net is served by Vercel (the new site) or still by the
 *   old host, by asking it once every 15 minutes and looking for Vercel's
 *   response headers. Cached per deployment; nothing is stored.
 */
export const DATASET_ID = "28723169773968178";
export const VERCEL_ANALYTICS_URL = "https://vercel.com/bablli-claude/eternal-storefront/analytics";

export function liveKeys() {
  const pixel = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").trim();
  const ga4 = (process.env.NEXT_PUBLIC_GA4_ID ?? "").trim();
  return {
    production: process.env.VERCEL_ENV === "production",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? "local",
    pixelSet: pixel.length > 0,
    pixelIsDataset: pixel === DATASET_ID,
    ga4Set: /^G-[A-Z0-9]{4,}$/.test(ga4),
    capiToken: Boolean(process.env.META_CAPI_TOKEN?.trim()),
    capiFlag: process.env.NEXT_PUBLIC_META_CAPI === "1",
    vaFlag: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "1",
    vaBase: process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_BASEPATH ?? "",
  };
}

export type Probe = { onVercel: boolean | null; status: number | null };

async function probe(url: string): Promise<Probe> {
  try {
    const r = await fetch(url, { redirect: "manual", cache: "no-store", headers: { "user-agent": "eternal-dashboard-check/1" }, signal: AbortSignal.timeout(5000) });
    await r.body?.cancel();
    const vercel = (r.headers.has("x-vercel-id") || /vercel/i.test(r.headers.get("server") ?? "")) && !r.headers.has("x-vercel-error");
    return { onVercel: vercel, status: r.status };
  } catch {
    // DNS, TLS (a certificate still being issued during the switch) or a timeout: unknown, not "missing".
    return { onVercel: null, status: null };
  }
}

async function insightsServed(base: string): Promise<boolean | null> {
  const path = base ? `${base.replace(/\/+$/, "")}/insights/script.js` : "/_vercel/insights/script.js";
  try {
    const r = await fetch(`https://www.myeternal.net${path}`, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(5000) });
    await r.body?.cancel();
    if (r.status === 200 && /javascript/i.test(r.headers.get("content-type") ?? "")) return true;
    return r.status === 404 ? false : null;
  } catch {
    return null;
  }
}

/** The domain probes, cached for 15 minutes per deployment (the arguments are part of the key). */
export const getSiteProbes = unstable_cache(
  async (_deploymentId: string, vaBase: string) => {
    const [www, apex] = await Promise.all([probe("https://www.myeternal.net/"), probe("https://myeternal.net/")]);
    const insights = www.onVercel ? await insightsServed(vaBase) : null;
    return { www, apex, insights, checkedAt: new Date().toISOString() };
  },
  ["dash-site-v1"],
  { revalidate: 900, tags: ["dash-data", "dash-site"] },
);
export type SiteProbes = Awaited<ReturnType<typeof getSiteProbes>>;
