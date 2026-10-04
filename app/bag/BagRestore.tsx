"use client";

import { useEffect } from "react";
import { useCart, type CartLine } from "@/components/cart/CartProvider";

type BagHistoryState = { eternalRestored?: boolean; eternalBag?: boolean };

/**
 * Puts the link's lines in the bag at their exact quantities, then opens it.
 * The link applies once per history entry: Back onto it, or a reload, finds
 * the entry marked and leaves the bag as the shopper has since changed it, so
 * a removed bottle doesn't come back.
 */
export function BagRestore({ lines, source }: { lines: CartLine[]; source?: string }) {
  const { restore } = useCart();
  useEffect(() => {
    const st = (window.history.state ?? {}) as BagHistoryState;
    if (st.eternalRestored || st.eternalBag) return;
    window.history.replaceState({ ...st, eternalRestored: true }, "");
    restore(lines, source);
  }, [restore, lines, source]);
  return null;
}
