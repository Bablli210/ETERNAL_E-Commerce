"use client";

import { useEffect, useRef, useState } from "react";
import { useCart, type CartLine } from "./CartProvider";
import { Icon } from "@/components/ui/Icon";

export type BagVariant = { id: string; numericId: string; label: string; price: CartLine["price"]; availableForSale: boolean };
export type BagProduct = { productId?: string; handle: string; title: string; image: string | null; lineLabel: string | null; world: CartLine["world"] };

export function AddToBagButton({
  variant,
  product,
  kind = "bottle",
  label,
  look = "primary",
  size = "md",
  block = false,
  extra = [],
  source = "card",
  className = "",
}: {
  variant: BagVariant;
  product: BagProduct;
  kind?: CartLine["kind"];
  label?: string;
  look?: "primary" | "secondary" | "light" | "outline-light";
  size?: "md" | "sm" | "xs";
  block?: boolean;
  /** Extra lines added with the main one, e.g. the 5 ml sample too. */
  extra?: { variant: BagVariant; kind: CartLine["kind"] }[];
  /** Where the button sits, for the add_to_cart event: card (the default), finder, home, tale… */
  source?: string;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const toLine = (v: BagVariant, k: CartLine["kind"]): Omit<CartLine, "qty"> => ({
    variantId: v.id,
    numericId: v.numericId,
    productId: product.productId,
    handle: product.handle,
    title: product.title,
    variantLabel: v.label,
    kind: k,
    price: v.price,
    image: product.image,
    lineLabel: product.lineLabel,
    world: product.world,
  });

  const onClick = () => {
    // A second tap while it reads "Added" is a double tap, not a second bottle.
    if (added) return;
    let any = add(toLine(variant, kind), 1, { openDrawer: extra.length === 0, source });
    for (const e of extra) any = add(toLine(e.variant, e.kind), 1, { openDrawer: false, source }) || any;
    if (extra.length) add(toLine(variant, kind), 0);
    // At the bag's cap nothing went in: the bag opens and says why, and the button doesn't claim "Added".
    if (!any) return;
    setAdded(true);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  };

  const cls = ["btn", look !== "primary" && `btn-${look}`, size !== "md" && `btn-${size}`, block && "btn-block", className].filter(Boolean).join(" ");
  if (!variant.availableForSale) {
    return (
      <button type="button" className={cls} disabled aria-disabled="true">
        Sold out
      </button>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} aria-live="polite">
      {added ? (
        <>
          Added <Icon name="check" size={16} />
        </>
      ) : (
        label ?? `Add ${variant.label}`
      )}
    </button>
  );
}
