import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { moodToFamily } from "./content/taxonomy";
import { imageVersions } from "./lib/image-versions";

const nextConfig = (phase: string): NextConfig => ({
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    localPatterns: [
      // Any local image without a query, as before.
      { pathname: "/**", search: "" },
      // Site images carry their folder's version (lib/image-versions.ts). Only the current versions are admitted, so
      // the optimiser cannot be made to store endless variants of one picture. In development a file dropped in after
      // start-up changes its folder's version, which this list has not seen, so any version passes there.
      ...(phase === PHASE_DEVELOPMENT_SERVER ? [{ pathname: "/images/**" }] : imageVersions().patterns),
    ],
    // AVIF first: roughly 20–30% lighter than WebP for the same photograph on mobile data.
    formats: ["image/avif", "image/webp"],
    // A replaced site image gets a new address (its folder's version), so optimised copies can live a month.
    minimumCacheTTL: 2_678_400,
  },
  async redirects() {
    return [
      // The house page was taken down by the owner; old links and ads land on the home page instead of a 404.
      { source: "/house", destination: "/", permanent: false },
      // Shop by mood became shop by scent: each mood page forwards to its nearest scent family.
      ...Object.entries(moodToFamily).map(([mood, family]) => ({ source: `/shop/${mood}`, destination: `/shop/${family}`, permanent: true })),
      // The old Lovable site on myeternal.net (until October 2026). Its three signature scents have no product page here, so each goes to its line.
      { source: "/fragrance/eternal", destination: "/shop/unisex", permanent: false },
      { source: "/fragrance/eterna", destination: "/shop/her", permanent: false },
      { source: "/fragrance/eterno", destination: "/shop/him", permanent: false },
      // Every other old scent page has the same handle on Shopify, and running Meta ads link here; the query (UTMs, fbclid) carries over.
      { source: "/fragrance/:handle", destination: "/products/:handle", permanent: true },
      // The old site's checkout page was its bag.
      { source: "/checkout", destination: "/bag", permanent: true },
    ];
  },
  async headers() {
    // The owner's checklist is unlinked; this keeps it out of search even where the meta tag is not read.
    return [
      { source: "/launch-checklist", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // The team dashboard: never indexed, never framed (its forms change accounts), and its links never tell another site the address they came from.
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          // same-origin, not no-referrer: under no-referrer a form posted before the page's scripts load sends "Origin: null", which Next refuses. No other site is ever sent a Referer either way.
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
});

export default nextConfig;
