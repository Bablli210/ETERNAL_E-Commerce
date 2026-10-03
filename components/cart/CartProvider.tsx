"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Money } from "@/lib/shopify/types";
import type { ScentIndexEntry, World } from "@/lib/catalogue";
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
  /** Set when the live catalogue says the variant can't be bought; the line stays visible but out of the subtotal and checkout. */
  soldOut?: boolean;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  /** Lines that can be bought; sold-out lines are left out. */
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
  /** Sets these lines to exactly these quantities, keeps the rest of the bag, and opens the drawer (the /bag link). */
  restore: (lines: CartLine[]) => void;
  /** Brings stored lines up to date with the live catalogue: price, title, image, availability. */
  reconcile: (index: ScentIndexEntry[]) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  openDrawer: () => void;
  /** Closes the drawer. Pass "navigate" from a link inside it, which replaces the drawer's history entry itself. */
  closeDrawer: (reason?: "navigate") => void;
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
/** The product page caps its stepper here too. */
export const MAX_QTY = 10;
/** A second add of the same variant inside this window is a double tap, not a second bottle. */
const DOUBLE_TAP_MS = 700;

const parseLines = (raw: string | null): CartLine[] => {
  const v = parseJSON<unknown>(raw, []);
  return Array.isArray(v) ? (v as CartLine[]).filter((l) => l && typeof l.variantId === "string" && l.qty > 0) : [];
};

/** The bag lives in localStorage; every mutation reads the latest copy, writes it back and notifies subscribers. */
const mutate = (fn: (lines: CartLine[]) => CartLine[]) => writeJSON(KEY, fn(parseLines(readRaw(KEY))));

/** When each variant was last added, to drop the second tap of a double tap. */
const lastAddAt = new Map<string, number>();
const firstTap = (variantId: string) => {
  const now = Date.now();
  const prev = lastAddAt.get(variantId);
  if (prev !== undefined && now - prev < DOUBLE_TAP_MS) return false;
  lastAddAt.set(variantId, now);
  return true;
};

class CheckoutError extends Error {}

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useStoredRaw(KEY);
  const ready = raw !== SERVER_SNAPSHOT;
  const lines = useMemo(() => (ready ? parseLines(raw) : []), [raw, ready]);
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [toast, setToast] = useState<CartContextValue["toast"]>(null);
  /** True while the open drawer owns a history entry of its own. */
  const bagEntry = useRef(false);
  const openTimer = useRef<number | null>(null);

  const closeDrawer = useCallback((reason?: "navigate") => {
    setOpen(false);
    if (!bagEntry.current) return;
    bagEntry.current = false;
    if (reason !== "navigate") window.history.back();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Back (Android, Instagram's arrow) closes the sheet instead of leaving the page underneath it.
    if (!bagEntry.current) {
      window.history.pushState({ eternalBag: true }, "");
      bagEntry.current = true;
    }
    const onPop = () => {
      bagEntry.current = false;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    const shown = parseLines(readRaw(KEY));
    if (shown.length) track({ name: "view_cart", items: shown.map((l) => toItem(l, l.qty)) });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeDrawer]);

  // A reload, or a Back from checkout that skips the bfcache, lands on the drawer's own history entry: reopen the bag there.
  useEffect(() => {
    if (!(window.history.state as { eternalBag?: boolean } | null)?.eternalBag) return;
    bagEntry.current = true;
    const t = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  // The Checkout button never stays on "Opening checkout…": Back from Shopify restores this page from the bfcache, or the tab comes back into view.
  useEffect(() => {
    const reset = () => setCheckingOut(false);
    const onShow = (e: PageTransitionEvent) => e.persisted && reset();
    const onVisible = () => document.visibilityState === "visible" && reset();
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const add = useCallback<CartContextValue["add"]>((line, qty = 1, opts) => {
    if (qty > 0) {
      if (!firstTap(line.variantId)) return;
      track({ name: "add_to_cart", items: [toItem(line, qty)] });
      mutate((prev) => {
        const i = prev.findIndex((l) => l.variantId === line.variantId);
        if (i === -1) return [...prev, { ...line, qty: Math.min(MAX_QTY, qty) }];
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + qty) };
        return next;
      });
    }
    setError(null);
    setLastAdded(line.variantId);
    if (opts?.openDrawer !== false) {
      // The drawer is about to cover the toast, so a toast from the same gesture is dropped.
      setToast(null);
      if (openTimer.current) window.clearTimeout(openTimer.current);
      // D3: the label reads "Added ✓" and the bag icon ticks before the drawer opens.
      openTimer.current = window.setTimeout(
        () => {
          openTimer.current = null;
          setOpen(true);
        },
        motionAllowed() ? 450 : 0,
      );
    } else if (opts?.toast !== false && !openTimer.current) {
      setToast({ id: Date.now(), title: line.title, label: line.variantLabel });
    }
  }, []);

  const addMany = useCallback<CartContextValue["addMany"]>((items) => {
    const fresh = items.filter((l) => firstTap(l.variantId));
    if (!fresh.length) return;
    track({ name: "add_to_cart", items: fresh.map((l) => toItem(l, 1)) });
    mutate((prev) => {
      const next = [...prev];
      for (const line of fresh) {
        const i = next.findIndex((l) => l.variantId === line.variantId);
        if (i === -1) next.push({ ...line, qty: 1 });
        else next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + 1) };
      }
      return next;
    });
    setLastAdded(fresh[fresh.length - 1].variantId);
    setToast(null);
    setOpen(true);
  }, []);

  const restore = useCallback<CartContextValue["restore"]>((items) => {
    if (items.length) {
      mutate((prev) => {
        const next = [...prev];
        for (const line of items) {
          const i = next.findIndex((l) => l.variantId === line.variantId);
          const qty = Math.min(MAX_QTY, Math.max(1, line.qty));
          if (i === -1) next.push({ ...line, qty });
          else next[i] = { ...next[i], ...line, qty };
        }
        return next;
      });
    }
    setOpen(true);
  }, []);

  const reconcile = useCallback<CartContextValue["reconcile"]>((index) => {
    const live = new Map<string, { entry: ScentIndexEntry; price: Money; availableForSale: boolean }>();
    for (const entry of index) for (const v of [entry.bottle, entry.sample]) if (v) live.set(v.id, { entry, price: v.price, availableForSale: v.availableForSale });
    const prev = parseLines(readRaw(KEY));
    let changed = false;
    const next = prev.map((l) => {
      const hit = live.get(l.variantId);
      if (!hit) return l;
      const soldOut = !hit.availableForSale;
      const image = hit.entry.image ?? l.image;
      if (l.price.amount === hit.price.amount && l.price.currencyCode === hit.price.currencyCode && l.title === hit.entry.title && l.image === image && Boolean(l.soldOut) === soldOut) return l;
      changed = true;
      return { ...l, title: hit.entry.title, price: hit.price, image, soldOut: soldOut || undefined };
    });
    if (changed) writeJSON(KEY, next);
  }, []);

  const remove = useCallback((variantId: string) => {
    const gone = parseLines(readRaw(KEY)).find((l) => l.variantId === variantId);
    if (gone) track({ name: "remove_from_cart", items: [toItem(gone, gone.qty)] });
    mutate((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    const current = parseLines(readRaw(KEY)).find((l) => l.variantId === variantId);
    if (!current) return;
    const next = Math.min(MAX_QTY, Math.max(0, qty));
    const delta = next - current.qty;
    if (delta > 0) track({ name: "add_to_cart", items: [toItem(current, delta)] });
    if (delta < 0) track({ name: "remove_from_cart", items: [toItem(current, -delta)] });
    mutate((prev) => (next === 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, qty: next } : l))));
  }, []);

  const checkout = useCallback(async () => {
    const payable = lines.filter((l) => !l.soldOut);
    if (!payable.length || checkingOut) return;
    setCheckingOut(true);
    setError(null);
    track({ name: "begin_checkout", items: payable.map((l) => toItem(l, l.qty)) });
    let failure = "network";
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: payable.map((l) => ({ variantId: l.variantId, quantity: l.qty })), attributes: checkoutAttributes() }),
        // A stalled request on mobile data must end in a message, not an endless spinner.
        signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(15_000) : undefined,
      });
      failure = `http_${res.status}`;
      const json = (await res.json().catch(() => ({}))) as { url?: string };
      if (!res.ok || !json.url) throw new CheckoutError(failure);
      window.location.assign(json.url);
      // Still here after a while (a slow webview, a blocked redirect): let the shopper tap again.
      window.setTimeout(() => setCheckingOut(false), 10_000);
    } catch (err) {
      const offline = !(err instanceof CheckoutError);
      setError(offline ? "The connection dropped. Tap Checkout to try again." : "Checkout didn't open. Tap Checkout to try again in a moment.");
      track({ name: "ui", action: "checkout_error", label: failure });
      setCheckingOut(false);
    }
  }, [lines, checkingOut]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => (l.soldOut ? n : n + parseFloat(l.price.amount) * l.qty), 0);
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
      restore,
      reconcile,
      remove,
      setQty,
      openDrawer: () => setOpen(true),
      closeDrawer,
      checkout,
    };
  }, [lines, open, ready, checkingOut, error, lastAdded, toast, add, addMany, restore, reconcile, remove, setQty, closeDrawer, checkout]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
