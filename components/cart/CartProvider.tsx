"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Money } from "@/lib/shopify/types";
import type { World } from "@/lib/catalogue";
import { parseJSON, readRaw, SERVER_SNAPSHOT, useStoredRaw, writeJSON } from "@/lib/client/storage";
import { motionAllowed } from "@/lib/motion";
import { track, type AnalyticsItem } from "@/lib/client/analytics";
import { checkoutAttributes } from "@/lib/client/attribution";

export type CartLine = {
  variantId: string;
  /** Shopify product id, numeric; for the Meta catalogue content id. */
  productId?: string;
  numericId: string;
  handle: string;
  title: string;
  variantLabel: string;
  kind: "bottle" | "sample" | "set" | "other";
  price: Money;
  image: string | null;
  lineLabel: string | null;
  world: World;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  currency: string;
  open: boolean;
  ready: boolean;
  checkingOut: boolean;
  error: string | null;
  /** The line added most recently, so the drawer can highlight it (G6). */
  lastAdded: string | null;
  toast: { id: number; title: string; label: string } | null;
  dismissToast: () => void;
  add: (line: Omit<CartLine, "qty">, qty?: number, opts?: { openDrawer?: boolean; toast?: boolean }) => void;
  addMany: (lines: Omit<CartLine, "qty">[]) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  checkout: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const toItem = (l: Omit<CartLine, "qty">, quantity: number): AnalyticsItem => ({
  productId: l.productId ?? null,
  variantId: l.numericId,
  name: l.title,
  price: parseFloat(l.price.amount),
  quantity,
  variant: l.variantLabel,
  category: l.lineLabel,
});
const KEY = "eternal.bag.v1";

const parseLines = (raw: string | null): CartLine[] => {
  const v = parseJSON<unknown>(raw, []);
  return Array.isArray(v) ? (v as CartLine[]).filter((l) => l && typeof l.variantId === "string" && l.qty > 0) : [];
};

/** The bag lives in localStorage; every mutation reads the latest copy, writes it back and notifies subscribers. */
const mutate = (fn: (lines: CartLine[]) => CartLine[]) => writeJSON(KEY, fn(parseLines(readRaw(KEY))));

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useStoredRaw(KEY);
  const ready = raw !== SERVER_SNAPSHOT;
  const lines = useMemo(() => (ready ? parseLines(raw) : []), [raw, ready]);
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [toast, setToast] = useState<CartContextValue["toast"]>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const add = useCallback<CartContextValue["add"]>((line, qty = 1, opts) => {
    if (qty > 0) {
      track({ name: "add_to_cart", items: [toItem(line, qty)] });
      mutate((prev) => {
        const i = prev.findIndex((l) => l.variantId === line.variantId);
        if (i === -1) return [...prev, { ...line, qty }];
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      });
    }
    setError(null);
    setLastAdded(line.variantId);
    if (opts?.openDrawer !== false) {
      // D3: the label reads "Added ✓" and the bag icon ticks before the drawer opens.
      window.setTimeout(() => setOpen(true), motionAllowed() ? 450 : 0);
    } else if (opts?.toast !== false) {
      setToast({ id: Date.now(), title: line.title, label: line.variantLabel });
    }
  }, []);

  const addMany = useCallback<CartContextValue["addMany"]>((items) => {
    if (items.length) track({ name: "add_to_cart", items: items.map((l) => toItem(l, 1)) });
    mutate((prev) => {
      const next = [...prev];
      for (const line of items) {
        const i = next.findIndex((l) => l.variantId === line.variantId);
        if (i === -1) next.push({ ...line, qty: 1 });
        else next[i] = { ...next[i], qty: next[i].qty + 1 };
      }
      return next;
    });
    setLastAdded(items[items.length - 1]?.variantId ?? null);
    setOpen(true);
  }, []);

  const remove = useCallback((variantId: string) => {
    const gone = parseLines(readRaw(KEY)).find((l) => l.variantId === variantId);
    if (gone) track({ name: "remove_from_cart", items: [toItem(gone, gone.qty)] });
    mutate((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);
  const setQty = useCallback((variantId: string, qty: number) => {
    mutate((prev) => (qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, qty } : l))));
  }, []);

  const checkout = useCallback(async () => {
    if (!lines.length) return;
    setCheckingOut(true);
    setError(null);
    track({ name: "begin_checkout", items: lines.map((l) => toItem(l, l.qty)) });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.qty })), attributes: checkoutAttributes() }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Checkout is unavailable right now");
      window.location.assign(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout is unavailable right now");
      setCheckingOut(false);
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + parseFloat(l.price.amount) * l.qty, 0);
    return {
      lines,
      count,
      subtotal,
      currency: lines[0]?.price.currencyCode ?? "EGP",
      open,
      ready,
      checkingOut,
      error,
      lastAdded,
      toast,
      dismissToast: () => setToast(null),
      add,
      addMany,
      remove,
      setQty,
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
      checkout,
    };
  }, [lines, open, ready, checkingOut, error, lastAdded, toast, add, addMany, remove, setQty, checkout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
