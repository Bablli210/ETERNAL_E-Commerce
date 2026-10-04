"use client";

import { useCart } from "@/components/cart/CartProvider";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";

/** Adds the pair. When this page's bottle is already in the bag, it adds only the second one rather than a duplicate. */
export function AddPairButton({ a, b }: { a: ScentIndexEntry; b: ScentIndexEntry }) {
  const { addMany, lines } = useCart();
  if (!a.bottle || !b.bottle) return null;
  const toLine = (e: ScentIndexEntry) => ({
    variantId: e.bottle!.id,
    numericId: e.bottle!.numericId,
    productId: e.productId,
    handle: e.handle,
    title: e.title,
    variantLabel: e.bottle!.label,
    kind: "bottle" as const,
    price: e.bottle!.price,
    image: e.image,
    lineLabel: e.lineLabel,
    world: e.world,
  });
  const hasA = lines.some((l) => l.variantId === a.bottle!.id);
  const add = hasA ? [b] : [a, b];
  const total = add.reduce((n, e) => n + parseFloat(e.bottle!.price.amount), 0);
  return (
    <button type="button" className="btn w-full md:w-auto" onClick={() => addMany(add.map(toLine))} disabled={!add.every((e) => e.bottle!.availableForSale)}>
      {hasA ? `Add ${b.title}` : "Add both to bag"} · {formatMoney({ amount: total, currencyCode: b.bottle.price.currencyCode })}
    </button>
  );
}
