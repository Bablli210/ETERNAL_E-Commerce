"use client";

import { useEffect, useRef, useState } from "react";
import { useCart, type CartLine } from "./CartProvider";
import { Icon } from "@/components/ui/Icon";

export type BagVariant = { id: string; numericId: string; label: string; price: CartLine["price"]; availableForSale: boolean };
export type BagProduct = { handle: string; title: string; image: string | null; lineLabel: string | null; world: CartLine["world"] };

export function AddToBagButton({
  variant,
  product,
  kind = "bottle",
  label,
  look = "primary",
  size = "md",
  block = false,
  extra = [],
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
    add(toLine(variant, kind), 1, { openDrawer: extra.length === 0 });
    for (const e of extra) add(toLine(e.variant, e.kind), 1, { openDrawer: false });
    if (extra.length) add(toLine(variant, kind), 0);
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
