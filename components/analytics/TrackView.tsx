"use client";

import { useEffect } from "react";
import { track, type AnalyticsItem } from "@/lib/client/analytics";

/** Sends view_item once when a product page mounts. */
export function TrackView({ item }: { item: AnalyticsItem }) {
  const key = `${item.productId}:${item.variantId}`;
  useEffect(() => {
    track({ name: "view_item", items: [item] });
    // Only once per product, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
