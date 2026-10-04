import type { ScentIndexEntry } from "@/lib/catalogue";
import { storeDomain } from "@/lib/shopify/client";
import { siteImage } from "@/lib/site-images";
import { CartSheet } from "./CartSheet";

/**
 * The bag, rendered once in the layout. The server supplies what the client
 * sheet cannot know: the checkout host to warm up when the bag opens, and the
 * mystery box still for a box line that has no Shopify image.
 */
export function CartDrawer({ index }: { index: ScentIndexEntry[] }) {
  return <CartSheet index={index} checkoutOrigin={`https://${storeDomain}`} boxImage={siteImage(["products/mystery-box", "mystery-box"])} />;
}
