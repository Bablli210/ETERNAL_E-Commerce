import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    // AVIF first: roughly 20–30% lighter than WebP for the same photograph on mobile data.
    formats: ["image/avif", "image/webp"],
    // Product and campaign images change by file name, so optimised copies can live a month.
    minimumCacheTTL: 2_678_400,
  },
};

export default nextConfig;
