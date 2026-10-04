import type { Metadata } from "next";
import Link from "next/link";
import { getScentIndex, type ScentIndexEntry } from "@/lib/catalogue";
import { numericId } from "@/lib/format";
import type { CartLine } from "@/components/cart/CartProvider";
import { Mark } from "@/components/ui/Wordmark";
import { BagRestore } from "./BagRestore";

export const metadata: Metadata = { title: "Your bag", robots: { index: false, follow: false } };

const MAX_ITEMS = 20;
const MAX_QTY = 10;

type Hit = { entry: ScentIndexEntry; variant: NonNullable<ScentIndexEntry["bottle"]>; kind: CartLine["kind"] };

/**
 * Reads `items` against the scent index. Each item is a variant id, or a
 * handle for its 55 ml, with an optional quantity:
 * /bag?items=49293100384515:2,mystery-box. Unknown and sold-out items are
 * counted, not added.
 */
function parseItems(raw: string, index: ScentIndexEntry[]): { lines: CartLine[]; missed: number } {
  const byVariant = new Map<string, Hit>();
  const byHandle = new Map<string, Hit>();
  for (const entry of index) {
    if (entry.bottle) {
      const hit: Hit = { entry, variant: entry.bottle, kind: entry.kind === "set" ? "set" : "bottle" };
      byVariant.set(entry.bottle.numericId, hit);
      byHandle.set(entry.handle, hit);
    }
    if (entry.sample) byVariant.set(entry.sample.numericId, { entry, variant: entry.sample, kind: "sample" });
  }
  const lines = new Map<string, CartLine>();
  let missed = 0;
  for (const token of raw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, MAX_ITEMS)) {
    const [id, q] = token.split(":");
    const hit = byVariant.get(numericId(id)) ?? byHandle.get(id.toLowerCase());
    if (!hit || !hit.variant.availableForSale) {
      missed++;
      continue;
    }
    const { entry, variant, kind } = hit;
    const qty = Math.min(MAX_QTY, Math.max(1, Number.parseInt(q ?? "1", 10) || 1));
    lines.set(variant.id, { variantId: variant.id, numericId: variant.numericId, productId: entry.productId, handle: entry.handle, title: entry.title, variantLabel: variant.label, kind, price: variant.price, image: entry.image, lineLabel: entry.lineLabel, world: entry.world, qty });
  }
  return { lines: [...lines.values()], missed };
}

/**
 * Rebuilds a bag from a link: "Send this bag to WhatsApp", retargeting ads,
 * and the way out of Instagram's in-app browser, whose storage Safari and
 * Chrome cannot see. The bag opens over a short page that leads on to /shop.
 */
export default async function BagPage({ searchParams }: { searchParams: Promise<{ items?: string | string[] }> }) {
  const { items } = await searchParams;
  const { lines, missed } = parseItems([items ?? []].flat().join(","), await getScentIndex());
  const gone = missed === 1 ? "One scent from the link isn't available." : missed > 1 ? `${missed} scents from the link aren't available.` : "";
  // Only a link whose scents all missed says so; plain /bag, with no items, just opens the bag as it is.
  const copy = lines.length
    ? `The scents from your link are in your bag. ${gone}`.trim()
    : missed > 0
      ? "Nothing from this link could go in the bag. The collection is one tap away."
      : "Everything you’ve added is in your bag. The collection is one tap away.";

  return (
    <section className="wrap flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <BagRestore lines={lines} />
      <Mark size={72} className="text-night" />
      <h1 className="display-l mt-8">{lines.length ? "Your bag is ready." : "Your bag"}</h1>
      <p className="mt-3 max-w-[38ch] text-[16px] leading-relaxed text-ash">{copy}</p>
      <Link href="/shop" className="btn mt-8">
        Shop the collection
      </Link>
    </section>
  );
}
