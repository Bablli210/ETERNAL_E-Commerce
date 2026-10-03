"use client";

import { useEffect } from "react";
import { useCart, type CartLine } from "@/components/cart/CartProvider";

/** Puts the link's lines in the bag at their exact quantities, so a reload or a second tap changes nothing, then opens it. */
export function BagRestore({ lines }: { lines: CartLine[] }) {
  const { restore } = useCart();
  useEffect(() => {
    restore(lines);
  }, [restore, lines]);
  return null;
}
