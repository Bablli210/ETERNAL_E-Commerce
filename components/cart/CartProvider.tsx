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
  /**
   * opts.source names where the add happened, for the add_to_cart event (pdp, sticky, card, finder…).
   * Returns false when nothing went in because the bag already holds MAX_QTY of that variant; the bag then opens and says so.
   */
  add: (line: Omit<CartLine, "qty">, qty?: number, opts?: { openDrawer?: boolean; toast?: boolean; source?: string }) => boolean;
  addMany: (lines: Omit<CartLine, "qty">[], opts?: { source?: string }) => void;
  /** Sets these lines to exactly these quantities, keeps the rest of the bag, and opens the drawer (the /bag link). */
  /** source: the add_to_cart source for what the link adds (default bag_link). */
  restore: (lines: CartLine[], source?: string) => void;
  /** Brings stored lines up to date with the live catalogue: price, title, image, availability. */
  reconcile: (index: ScentIndexEntry[]) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  openDrawer: () => void;
  /** Closes the drawer. Pass "navigate" from a link inside it, which replaces the drawer's history entry itself. */
  closeDrawer: (reason?: "navigate") => void;
  checkout: () => Promise<void>;
  /**
   * The free 5 ml that ships with each bottle: one pick per bottle, by product
   * handle, in bag order. "" (or a missing pick) leaves the choice to the house.
   */
  samples: string[];
  setSample: (slot: number, handle: string) => void;
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
const SAMPLES_KEY = "eternal.samples.v1";
/** Picks made while storage is blocked (private mode): they last the visit instead of vanishing. */
let samplesInMemory: string[] = [];
const parseSamples = (raw: string | null): string[] => {
  if (raw === null) return samplesInMemory;
  const v = parseJSON<unknown>(raw, []);
  return Array.isArray(v) ? v.map((h) => (typeof h === "string" ? h : "")) : [];
};
/** What the order says for the free 5 ml: one name per bottle, "House's choice" where none was picked. */
export const sampleNames = (samples: string[], bottles: number, titleOf: (handle: string) => string | null) =>
  Array.from({ length: bottles }, (_, i) => (samples[i] && titleOf(samples[i])) || "House’s choice");
/** The product page caps its stepper here too. */
export const MAX_QTY = 10;
/** A second add of the same variant inside this window is a double tap, not a second bottle. */
const DOUBLE_TAP_MS = 700;
const AT_MOST = `Your bag already holds ${MAX_QTY} of this scent, the most one order can take.`;

/** Shopify names the mystery box variant "3 x 5 ml"; the house writes a multiplication sign. */
export const sizeLabel = (label: string) => label.replace(/(\d)\s*x\s*(\d)/gi, "$1 × $2");

/** Another modal (the menu, search, the filter sheet) is open: a bag opened now would sit under it and lock it. */
const otherDialogOpen = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).some((d) => !d.hasAttribute("data-bag-sheet") && d.getClientRects().length > 0);

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
  const samplesRaw = useStoredRaw(SAMPLES_KEY);
  /** Bumped on every pick, so a pick held only in memory (blocked storage) still re-renders. */
  const [samplesTick, setSamplesTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- samplesTick re-reads the in-memory picks.
  const samples = useMemo(() => (samplesRaw === SERVER_SNAPSHOT ? [] : parseSamples(samplesRaw)), [samplesRaw, samplesTick]);
  const setSample = useCallback((slot: number, handle: string) => {
    const next = parseSamples(readRaw(SAMPLES_KEY)).slice();
    while (next.length <= slot) next.push("");
    next[slot] = handle;
    samplesInMemory = next;
    writeJSON(SAMPLES_KEY, next);
    setSamplesTick((t) => t + 1);
  }, []);
  /** Scent names by handle, from the catalogue the bag reconciles against, for the free 5 ml picks on the order. */
  const sampleTitles = useRef<Map<string, string>>(new Map());
  /** True while the open drawer owns a history entry of its own. */
  const bagEntry = useRef(false);
  const openTimer = useRef<number | null>(null);

  const closeDrawer = useCallback((reason?: "navigate") => {
    setOpen(false);
    setError(null);
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
      setError(null);
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

  // After an order, Shopify's thank-you page links back with ?ordered=1 (.env.example, "After the order"):
  // the bottles are bought, so the bag starts empty, and the flag leaves the address so a reload or a shared link can't empty it again.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("ordered") !== "1") return;
    writeJSON(KEY, []);
    url.searchParams.delete("ordered");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
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

  /**
   * Opens the bag after `delay` ms. If another dialog opened in the meantime
   * (the menu tapped right after Add), the bag would open beneath it and make
   * it inert, so a toast reports the add instead.
   */
  const reveal = useCallback((delay: number, note: { title: string; label: string } | null) => {
    // The drawer is about to cover the toast, so a toast from the same gesture is dropped.
    setToast(null);
    if (openTimer.current) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      if (!otherDialogOpen()) setOpen(true);
      else if (note) setToast({ id: Date.now(), ...note });
    }, delay);
  }, []);

  const add = useCallback<CartContextValue["add"]>(
    (line, qty = 1, opts) => {
      const note = { title: line.title, label: sizeLabel(line.variantLabel) };
      if (qty > 0) {
        if (!firstTap(line.variantId)) return true;
        // Only what actually goes in counts: at the cap, nothing is added, nothing is tracked, and the bag says why.
        const had = parseLines(readRaw(KEY)).find((l) => l.variantId === line.variantId)?.qty ?? 0;
        const delta = Math.min(MAX_QTY, had + qty) - had;
        if (delta <= 0) {
          setError(AT_MOST);
          setLastAdded(line.variantId);
          reveal(0, null);
          return false;
        }
        track({ name: "add_to_cart", items: [toItem(line, delta)], source: opts?.source });
        mutate((prev) => {
          const i = prev.findIndex((l) => l.variantId === line.variantId);
          if (i === -1) return [...prev, { ...line, qty: delta }];
          const next = [...prev];
          next[i] = { ...next[i], qty: next[i].qty + delta };
          return next;
        });
        setError(null);
      }
      setLastAdded(line.variantId);
      // D3: the label reads "Added ✓" and the bag icon ticks before the drawer opens.
      if (opts?.openDrawer !== false) reveal(motionAllowed() ? 450 : 0, note);
      else if (opts?.toast !== false && !openTimer.current) setToast({ id: Date.now(), ...note });
      return true;
    },
    [reveal],
  );

  const addMany = useCallback<CartContextValue["addMany"]>(
    (items, opts) => {
      const fresh = items.filter((l) => firstTap(l.variantId));
      if (!fresh.length) return;
      const held = new Map(parseLines(readRaw(KEY)).map((l) => [l.variantId, l.qty]));
      const room = fresh.filter((l) => (held.get(l.variantId) ?? 0) < MAX_QTY);
      if (room.length) {
        track({ name: "add_to_cart", items: room.map((l) => toItem(l, 1)), source: opts?.source });
        mutate((prev) => {
          const next = [...prev];
          for (const line of room) {
            const i = next.findIndex((l) => l.variantId === line.variantId);
            if (i === -1) next.push({ ...line, qty: 1 });
            else next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + 1) };
          }
          return next;
        });
      }
      setError(room.length === fresh.length ? null : AT_MOST);
      setLastAdded(fresh[fresh.length - 1].variantId);
      reveal(0, room.length ? { title: room.map((l) => l.title).join(" + "), label: "" } : null);
    },
    [reveal],
  );

  const restore = useCallback<CartContextValue["restore"]>((items, source = "bag_link") => {
    if (items.length) {
      // What the link adds on top of the bag counts as an add, so a retargeting checkout has its add step in the funnel.
      const added: AnalyticsItem[] = [];
      mutate((prev) => {
        const next = [...prev];
        for (const line of items) {
          const i = next.findIndex((l) => l.variantId === line.variantId);
          const qty = Math.min(MAX_QTY, Math.max(1, line.qty));
          const delta = qty - (i === -1 ? 0 : next[i].qty);
          if (delta > 0) added.push(toItem(line, delta));
          if (i === -1) next.push({ ...line, qty });
          else next[i] = { ...next[i], ...line, qty };
        }
        return next;
      });
      if (added.length) track({ name: "add_to_cart", items: added, source });
    }
    setOpen(true);
  }, []);

  const reconcile = useCallback<CartContextValue["reconcile"]>((index) => {
    sampleTitles.current = new Map(index.map((e) => [e.handle, e.title]));
    const live = new Map<string, { entry: ScentIndexEntry; price: Money; availableForSale: boolean }>();
    for (const entry of index) for (const v of [entry.bottle, entry.sample]) if (v) live.set(v.id, { entry, price: v.price, availableForSale: v.availableForSale });
    if (!live.size) return;
    const prev = parseLines(readRaw(KEY));
    let changed = false;
    const next = prev.map((l) => {
      const hit = live.get(l.variantId);
      // A variant that has left the catalogue can't be bought: the line stays in view as no longer available, out of the subtotal and checkout.
      if (!hit) {
        if (l.soldOut) return l;
        changed = true;
        return { ...l, soldOut: true };
      }
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
    if (delta > 0) track({ name: "add_to_cart", items: [toItem(current, delta)], source: "bag_qty" });
    if (delta < 0) track({ name: "remove_from_cart", items: [toItem(current, -delta)] });
    mutate((prev) => (next === 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, qty: next } : l))));
  }, []);

  const checkout = useCallback(async () => {
    const payable = lines.filter((l) => !l.soldOut);
    if (!payable.length || checkingOut) return;
    setCheckingOut(true);
    setError(null);
    track({ name: "begin_checkout", items: payable.map((l) => toItem(l, l.qty)) });
    // The free 5 ml picks reach the order as "Free 5 ml samples" (api/checkout), so the team packs the right vials.
    const bottles = payable.reduce((n, l) => (l.kind === "bottle" ? n + l.qty : n), 0);
    const freeSamples = bottles > 0 ? [{ key: "free_samples", value: sampleNames(samples, bottles, (h) => sampleTitles.current.get(h) ?? null).join(", ") }] : [];
    let failure = "network";
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: payable.map((l) => ({ variantId: l.variantId, quantity: l.qty })), attributes: [...checkoutAttributes(), ...freeSamples] }),
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
  }, [lines, checkingOut, samples]);

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
      samples,
      setSample,
    };
  }, [lines, open, ready, checkingOut, error, lastAdded, toast, add, addMany, restore, reconcile, remove, setQty, closeDrawer, checkout, samples, setSample]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
