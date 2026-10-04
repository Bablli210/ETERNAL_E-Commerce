import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    // AVIF first: roughly 20–30% lighter than WebP for the same photograph on mobile data.
    formats: ["image/avif", "image/webp"],
    // Product and campaign images change by file name, so optimised copies can live a month.
    minimumCacheTTL: 2_678_400,
  },
  // The house page was taken down by the owner; old links and ads land on the home page instead of a 404.
  async redirects() {
    return [{ source: "/house", destination: "/", permanent: false }];
  },
  async headers() {
    // The owner's checklist is unlinked; this keeps it out of search even where the meta tag is not read.
    return [{ source: "/launch-checklist", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
