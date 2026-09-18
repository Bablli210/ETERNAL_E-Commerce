"use client";

import { useCart } from "@/components/cart/CartProvider";
import type { ScentIndexEntry } from "@/lib/catalogue";

export function AddPairButton({ a, b }: { a: ScentIndexEntry; b: ScentIndexEntry }) {
  const { addMany } = useCart();
  if (!a.bottle || !b.bottle) return null;
  const toLine = (e: ScentIndexEntry) => ({
    variantId: e.bottle!.id,
    numericId: e.bottle!.numericId,
    handle: e.handle,
    title: e.title,
    variantLabel: e.bottle!.label,
    kind: "bottle" as const,
    price: e.bottle!.price,
    image: e.image,
    lineLabel: e.lineLabel,
    world: e.world,
  });
  return (
    <button type="button" className="btn" onClick={() => addMany([toLine(a), toLine(b)])}>
      Add both to bag
    </button>
  );
}
