import type { NextConfig } from "next";
import { moodToFamily } from "./content/taxonomy";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    // AVIF first: roughly 20–30% lighter than WebP for the same photograph on mobile data.
    formats: ["image/avif", "image/webp"],
    // Product and campaign images change by file name, so optimised copies can live a month.
    minimumCacheTTL: 2_678_400,
  },
  async redirects() {
    return [
      // The house page was taken down by the owner; old links and ads land on the home page instead of a 404.
      { source: "/house", destination: "/", permanent: false },
      // Shop by mood became shop by scent: each mood page forwards to its nearest scent family.
      ...Object.entries(moodToFamily).map(([mood, family]) => ({ source: `/shop/${mood}`, destination: `/shop/${family}`, permanent: true })),
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
};

export default nextConfig;
