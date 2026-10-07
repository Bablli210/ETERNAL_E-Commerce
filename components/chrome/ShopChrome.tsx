"use client";

import { useSelectedLayoutSegment } from "next/navigation";

/**
 * The shop around every page (header, footer, bag, cookie banner, visitor
 * tracking), except the team dashboard under /dashboard, which has its own
 * frame and never loads the pixel or analytics. The top segment comes from the
 * router tree, so it is right on the server render, on the client, and for
 * the home page's rewrite to /home/<hero>. Unknown URLs (segment
 * "/_not-found") keep the shop.
 */
export function ShopChrome({ shop, children }: { shop: React.ReactNode; children: React.ReactNode }) {
  return useSelectedLayoutSegment() === "dashboard" ? <>{children}</> : <>{shop}</>;
}
