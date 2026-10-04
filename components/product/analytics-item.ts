import type { ScentIndexEntry } from "@/lib/catalogue";
import type { AnalyticsItem } from "@/lib/client/analytics";

/** A card's product as the funnel events report it: the 55 ml variant, its price and its line. */
export const analyticsItem = (e: ScentIndexEntry): AnalyticsItem => ({
  productId: e.productId,
  variantId: e.bottle?.numericId ?? e.productId,
  name: e.title,
  price: parseFloat(e.price.amount),
  variant: e.bottle?.label,
  category: e.lineLabel,
});
