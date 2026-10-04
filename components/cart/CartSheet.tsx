"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { preconnect } from "react-dom";
import { MAX_QTY, sizeLabel, useCart, type CartLine } from "./CartProvider";
import { inertOutside } from "@/lib/client/inertOutside";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Wordmark";
import { Price } from "@/components/ui/Primitives";
import { formatMoney } from "@/lib/format";
import { facts } from "@/lib/facts";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { lines, type LineKey } from "@/content/taxonomy";
import { lineWithAudience } from "@/components/product/line";
import { parseJSON, RECENT_KEY, useStoredRaw } from "@/lib/client/storage";
import { motionAllowed } from "@/lib/motion";
import { track } from "@/lib/client/analytics";
import { discountCode } from "@/lib/client/attribution";

const BOX = "mystery-box";

/** The three line names differ by one letter, so the audience always travels with them. */
const lineName = (label: string | null) => (label && label in lines ? lineWithAudience(label as LineKey) : label);

/**
 * The confirmed payment methods, listed once under Checkout. Above it, only a
 * confirmed COD fee wording earns a line: on a short in-app screen every line
 * in the footer is a line less of the bag.
 */
const methods = facts.paymentMethods;
const payLine = facts.codFee;

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]";
const BAG_BUTTON = '[data-bag-button], header button[aria-label^="Bag"]';

/** Tab and Shift+Tab wrap around inside the sheet. */
function wrapTab(e: KeyboardEvent, root: HTMLElement) {
  if (e.key !== "Tab") return;
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/** The bag as a WhatsApp message, with a link that rebuilds it on any browser (the /bag route). */
function bagMessage(lines: CartLine[], subtotal: number) {
  const restore = `${window.location.origin}/bag?items=${lines.map((l) => `${l.numericId}:${l.qty}`).join(",")}`;
  return [
    "Hello eternal, this is my bag:",
    ...lines.map((l) => `${l.qty} × ${l.title}, ${sizeLabel(l.variantLabel)} · ${formatMoney({ amount: parseFloat(l.price.amount) * l.qty, currencyCode: l.price.currencyCode })}`),
    `Subtotal ${formatMoney({ amount: subtotal, currencyCode: lines[0]?.price.currencyCode })}`,
    restore,
  ].join("\n");
}

type Suggestion = { key: string; eyebrow: string; entry: ScentIndexEntry; variant: NonNullable<ScentIndexEntry["bottle"]>; note: string; image: string | null };

function Thumb({ src, world, sizes, mark }: { src: string | null; world: CartLine["world"]; sizes: string; mark: number }) {
  if (src) return <Image src={src} alt="" fill sizes={sizes} className="object-cover" />;
  return (
    <span className="absolute inset-0 flex items-center justify-center" style={{ color: world.accent }}>
      <Mark size={mark} />
    </span>
  );
}

export function CartSheet({ index, checkoutOrigin, boxImage }: { index: ScentIndexEntry[]; checkoutOrigin: string; boxImage: string | null }) {
  const cart = useCart();
  const { reconcile } = cart;
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const shopRef = useRef<HTMLAnchorElement>(null);
  const recentRaw = useStoredRaw(RECENT_KEY);
  const recent = useMemo(() => parseJSON<string[]>(recentRaw, []), [recentRaw]);
  const [removing, setRemoving] = useState<Set<string>>(() => new Set());
  /** Suggestions already added or declined; they don't come back this visit. */
  const [spent, setSpent] = useState<Set<string>>(() => new Set());
  /** One suggestion per opening: after Add or Not now the slot stays empty until the bag opens again. */
  const [quiet, setQuiet] = useState(false);
  const [wasOpen, setWasOpen] = useState(cart.open);
  if (wasOpen !== cart.open) {
    setWasOpen(cart.open);
    if (!cart.open) setQuiet(false);
  }

  const byHandle = useMemo(() => new Map(index.map((e) => [e.handle, e])), [index]);
  const box = byHandle.get(BOX) ?? null;
  const thumb = (handle: string, image: string | null) => image ?? (handle === BOX ? boxImage : null);

  // Stored lines carry the price they were added at; bring them up to the live catalogue once the bag is read.
  useEffect(() => {
    if (cart.ready) reconcile(index);
  }, [cart.ready, reconcile, index]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!cart.open || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    // The panel takes focus, so the screen reader announces the bag and no ring flashes on the close button.
    panelRef.current?.focus({ preventScroll: true });
    const restoreInert = inertOutside(dialog);
    const onKey = (e: KeyboardEvent) => wrapTab(e, dialog);
    dialog.addEventListener("keydown", onKey);
    // Warm the connection to Shopify while the shopper reads the bag.
    preconnect(checkoutOrigin);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      restoreInert();
      const back = opener?.isConnected ? opener : document.querySelector<HTMLElement>(BAG_BUTTON);
      back?.focus({ preventScroll: true });
    };
  }, [cart.open, checkoutOrigin]);

  const empty = cart.ready && cart.lines.length === 0;
  // When the last line goes, focus lands on the way forward rather than on the page behind.
  useEffect(() => {
    if (cart.open && empty) shopRef.current?.focus({ preventScroll: true });
  }, [cart.open, empty]);

  const payable = useMemo(() => cart.lines.filter((l) => !l.soldOut), [cart.lines]);
  const hasBottle = payable.some((l) => l.kind === "bottle");
  const threshold = facts.freeShippingThreshold;
  const away = threshold !== null ? Math.max(0, threshold - cart.subtotal) : null;
  const deliveryIncluded = (facts.deliveryIncluded === true && hasBottle) || away === 0;
  const deliveryLine = deliveryIncluded
    ? "Delivery included"
    : facts.deliveryIncluded === true
      ? "Delivery is added at checkout. Add any bottle and it's included."
      : "Delivery is added at checkout";

  const suggestion = useMemo<Suggestion | null>(() => {
    if (quiet || !cart.lines.length) return null;
    const variants = new Set(cart.lines.map((l) => l.variantId));
    const handles = new Set(cart.lines.map((l) => l.handle));
    const ok = (e: ScentIndexEntry | undefined): e is ScentIndexEntry =>
      Boolean(e && e.kind === "scent" && e.bottle?.availableForSale && !variants.has(e.bottle.id) && !spent.has(e.handle));

    // 1. Samples or the box only: the 55 ml of a sampled scent, else one they looked at, else a house favourite.
    if (!cart.lines.some((l) => l.kind === "bottle")) {
      const sampled = cart.lines.filter((l) => l.kind === "sample").map((l) => byHandle.get(l.handle));
      const viewed = recent.map((h) => byHandle.get(h));
      const e = [...sampled, ...viewed].find(ok) ?? index.find((x) => ok(x) && x.image && (x.isBestseller || x.isPick)) ?? index.find((x) => ok(x) && x.image);
      if (!e?.bottle) return null;
      return { key: e.handle, eyebrow: "Make it a bottle", entry: e, variant: e.bottle, note: [e.bottle.label, lineName(e.lineLabel)].filter(Boolean).join(" · "), image: e.image };
    }

    // 2. The mystery box, the low-commitment way to choose the next bottle.
    if (box?.bottle?.availableForSale && !handles.has(BOX) && !spent.has(BOX)) {
      return { key: BOX, eyebrow: "Find your next scent", entry: box, variant: box.bottle, note: "Three 5 ml scents, chosen by the house", image: box.image ?? boxImage };
    }

    // 3. One more bottle from the line of the first bottle in the bag.
    const first = cart.lines.find((l) => l.kind === "bottle");
    const line = first ? byHandle.get(first.handle)?.line : null;
    if (!line) return null;
    const sameLine = (x: ScentIndexEntry) => ok(x) && x.line === line && !handles.has(x.handle) && Boolean(x.image);
    const e = index.find((x) => sameLine(x) && (x.isBestseller || x.isPick)) ?? index.find(sameLine);
    if (!e?.bottle) return null;
    return { key: e.handle, eyebrow: `More from ${lineName(e.lineLabel)}`, entry: e, variant: e.bottle, note: [e.notesShort.slice(0, 3).join(", "), e.bottle.label].filter(Boolean).join(" · "), image: e.image };
  }, [quiet, cart.lines, spent, byHandle, recent, index, box, boxImage]);

  const settle = (key: string) => {
    setSpent((prev) => new Set(prev).add(key));
    setQuiet(true);
  };

  const addSuggestion = (s: Suggestion) => {
    const e = s.entry;
    // C3: the suggestion slides into the list as a real line.
    cart.add(
      { variantId: s.variant.id, numericId: s.variant.numericId, productId: e.productId, handle: e.handle, title: e.title, variantLabel: s.variant.label, kind: e.kind === "set" ? "set" : "bottle", price: s.variant.price, image: e.image, lineLabel: e.lineLabel, world: e.world },
      1,
      { openDrawer: false, toast: false, source: "bag_suggestion" },
    );
    settle(s.key);
  };

  /** C2: the line collapses, then leaves the bag. */
  const removeLine = (variantId: string) => {
    if (!motionAllowed()) return cart.remove(variantId);
    setRemoving((prev) => new Set(prev).add(variantId));
    window.setTimeout(() => {
      cart.remove(variantId);
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
    }, 240);
  };

  /** Links inside the sheet replace its history entry; one to the page already underneath just closes the sheet. */
  const follow = (href: string) => (e: MouseEvent) => {
    if (href === pathname) {
      e.preventDefault();
      cart.closeDrawer();
    } else cart.closeDrawer("navigate");
  };

  if (!cart.open) return null;

  const total = formatMoney({ amount: cart.subtotal, currencyCode: cart.currency });
  // The ad's ?discount=CODE travels to checkout; the bag says so, since Shopify applies it there and the total here is before it.
  const code = discountCode();
  const before = [!deliveryIncluded && "delivery", code && "your code"].filter(Boolean).join(" and ");
  const waHref = facts.whatsapp && payable.length ? `https://wa.me/${facts.whatsapp}?text=${encodeURIComponent(bagMessage(payable, cart.subtotal))}` : null;
  const onWhatsApp = () => track({ name: "ui", action: "whatsapp_click", label: "bag" });

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="bag-title" data-bag-sheet>
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => cart.closeDrawer()} className="fade-enter absolute inset-0 touch-none bg-night/40" />
      <aside ref={panelRef} tabIndex={-1} className="cart-panel absolute outline-none inset-x-0 bottom-0 flex max-h-[92dvh] flex-col bg-paper text-night lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-full lg:max-w-[460px]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-dune pl-5 pr-2">
          <h2 id="bag-title" className="display-m">
            Your bag <span className="tnum text-ash">({cart.count})</span>
          </h2>
          <button type="button" onClick={() => cart.closeDrawer()} aria-label="Close bag" className="flex h-11 w-11 items-center justify-center hover:text-sea">
            <Icon name="close" />
          </button>
        </header>

        {!cart.ready ? null : empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto overscroll-contain px-6 py-12 text-center">
            <Mark size={72} className="text-night" />
            <p className="display-m">Your bag is empty.</p>
            <p className="max-w-[30ch] text-[15px] text-ash">Start with a bottle, or let the finder narrow the house to three.</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link ref={shopRef} href="/shop" replace className="btn" onClick={follow("/shop")}>
                Shop the collection
              </Link>
              <Link href="/finder" replace className="btn btn-secondary" onClick={follow("/finder")}>
                Find your scent
              </Link>
            </div>
            {box?.bottle?.availableForSale && (
              <Link href={`/products/${BOX}`} replace onClick={follow(`/products/${BOX}`)} className="max-w-[34ch] py-2 text-[14px] font-medium underline decoration-dune underline-offset-4 hover:decoration-night">
                Or start small with the mystery box: three 5&nbsp;ml scents for <span className="whitespace-nowrap">{formatMoney(box.bottle.price)}</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
              {threshold !== null && away !== null && away > 0 && (
                <div className="border-b border-dune py-4">
                  <p className="text-[13px]">
                    <strong key={away} className="tnum tick-in inline-block">
                      {formatMoney({ amount: away, currencyCode: cart.currency })}
                    </strong>{" "}
                    away from free delivery
                  </p>
                  <div className="meter is-in mt-2" style={{ ["--v" as string]: `${Math.min(100, Math.round((cart.subtotal / threshold) * 100))}%` }}>
                    <i />
                  </div>
                </div>
              )}

              <ul>
                {cart.lines.map((l) => {
                  const href = `/products/${l.handle}`;
                  const label = [sizeLabel(l.variantLabel), l.kind === "set" ? null : lineName(l.lineLabel)].filter(Boolean).join(" · ");
                  return (
                    <li key={l.variantId} className={`line-row ${removing.has(l.variantId) ? "removing" : ""} ${cart.lastAdded === l.variantId ? "line-new" : ""}`}>
                      <div className="flex gap-4 overflow-hidden border-b border-dune py-4">
                        <Link href={href} replace onClick={follow(href)} tabIndex={-1} aria-hidden="true" className="relative block h-[96px] w-[76px] shrink-0 overflow-hidden" style={{ backgroundColor: l.world.bg }}>
                          <Thumb src={thumb(l.handle, l.image)} world={l.world} sizes="76px" mark={44} />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <Link href={href} replace onClick={follow(href)} className="display-m !text-[20px] leading-tight hover:text-sea">
                              {l.title}
                            </Link>
                            {l.soldOut ? (
                              <span className="shrink-0 text-[13px] font-semibold text-gold-text">Sold out</span>
                            ) : (
                              // C1: the price ticks to the new value.
                              <Price key={l.qty} money={{ amount: String(parseFloat(l.price.amount) * l.qty), currencyCode: l.price.currencyCode }} className="tick-in inline-block shrink-0 text-[15px] font-medium" />
                            )}
                          </div>
                          <p className="mt-1 text-[13px] text-ash">{label}</p>
                          {l.qty > 1 && !l.soldOut && <p className="tnum text-[13px] text-ash">{formatMoney(l.price)} each</p>}
                          {l.kind === "sample" && facts.sampleCredit && <p className="text-[13px] text-ash">{facts.sampleCredit}</p>}
                          <div className="mt-auto flex items-center justify-between pt-2">
                            {l.soldOut ? (
                              <p className="text-[13px] text-ash">No longer available</p>
                            ) : (
                              <div className="inline-flex h-11 items-center border border-dune">
                                <button type="button" aria-label={`Decrease quantity of ${l.title}`} className="flex h-full w-11 items-center justify-center hover:bg-sand" onClick={() => (l.qty <= 1 ? removeLine(l.variantId) : cart.setQty(l.variantId, l.qty - 1))}>
                                  <Icon name="minus" size={14} />
                                </button>
                                <span key={l.qty} className="tnum tick-in inline-block w-8 text-center text-[14px]" aria-live="polite">
                                  {l.qty}
                                </span>
                                <button type="button" aria-label={`Increase quantity of ${l.title}`} disabled={l.qty >= MAX_QTY} className="flex h-full w-11 items-center justify-center hover:bg-sand disabled:opacity-35" onClick={() => cart.setQty(l.variantId, l.qty + 1)}>
                                  <Icon name="plus" size={14} />
                                </button>
                              </div>
                            )}
                            <button type="button" className="-mr-3 inline-flex h-11 items-center px-3 text-[13px] text-ash underline-offset-4 hover:text-night hover:underline" onClick={() => removeLine(l.variantId)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {facts.freeSamples && (
                  <li className="flex items-center gap-4 border-b border-dune py-4">
                    <span className="flex h-11 w-[76px] shrink-0 items-center justify-center bg-sand text-night">
                      <Mark size={36} />
                    </span>
                    <p className="min-w-0 flex-1 text-[14px]">{facts.freeSamples}</p>
                    <span className="shrink-0 text-[13px] font-semibold">Included</span>
                  </li>
                )}
              </ul>

              {suggestion && (
                <section aria-label="A suggestion" className="rise-in my-4 flex gap-3 border border-dune p-3" style={{ ["--i" as string]: 3 }}>
                  <span className="relative block h-[70px] w-14 shrink-0 overflow-hidden" style={{ backgroundColor: suggestion.entry.world.bg }}>
                    <Thumb src={suggestion.image} world={suggestion.entry.world} sizes="56px" mark={32} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold tracking-[0.02em] text-ash">{suggestion.eyebrow}</p>
                    <p className="mt-0.5 text-[15px] font-semibold leading-snug">{suggestion.entry.title}</p>
                    <p className="text-[13px] leading-snug text-ash">{suggestion.note}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Price money={suggestion.variant.price} className="text-[14px] font-medium" />
                      <div className="flex items-center">
                        <button type="button" className="inline-flex h-11 items-center px-3 text-[13px] text-ash hover:text-night" onClick={() => settle(suggestion.key)}>
                          Not now
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addSuggestion(suggestion)}>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <button type="button" className="mx-auto mb-2 flex h-11 items-center px-4 text-[13px] font-semibold" onClick={() => cart.closeDrawer()}>
                Continue shopping
              </button>
            </div>

            <footer className="shrink-0 border-t border-dune px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
              <div className="flex items-baseline justify-between text-[14px]">
                <span>Subtotal</span>
                <Price key={cart.subtotal} money={{ amount: String(cart.subtotal), currencyCode: cart.currency }} className="tick-in inline-block" />
              </div>
              <p className="mt-0.5 text-[13px] leading-snug text-ash">{deliveryLine}</p>
              {code && (
                <p className="text-[13px] leading-snug text-ash">
                  Code <span className="font-semibold text-night">{code}</span> is applied at checkout
                </p>
              )}
              {payLine && <p className="text-[13px] leading-snug text-ash">{payLine}</p>}
              <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-dune pt-2">
                <span className="min-w-0 text-[14px] font-semibold">
                  Estimated total
                  {before && <span className="font-normal text-ash">, before {before}</span>}
                </span>
                <span className="tnum shrink-0 whitespace-nowrap text-[17px] font-semibold">{total}</span>
              </div>
              {cart.error && (
                <p role="alert" className="mt-2 text-[13px] leading-snug text-gold-text">
                  {cart.error}
                  {waHref && (
                    <>
                      {" "}
                      <a href={waHref} target="_blank" rel="noopener noreferrer" className="lnk text-[13px]" onClick={onWhatsApp}>
                        Or order on WhatsApp
                      </a>
                    </>
                  )}
                </p>
              )}
              {/* C4: loading state is three dots; the button keeps its size. */}
              <button type="button" className="cart-checkout btn btn-block mt-3" onClick={cart.checkout} disabled={cart.checkingOut || !payable.length} aria-busy={cart.checkingOut}>
                {cart.checkingOut ? (
                  <>
                    Opening checkout
                    <span className="dots" aria-hidden="true">
                      <i>.</i>
                      <i>.</i>
                      <i>.</i>
                    </span>
                  </>
                ) : (
                  <span className="tnum">Checkout · {total}</span>
                )}
              </button>
              {methods.length > 0 && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] text-ash">
                  <Icon name="shield" size={14} className="shrink-0" />
                  <span>{methods.join(" · ")}</span>
                </p>
              )}
              {facts.deliveryTime && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[12px] text-ash">
                  <Icon name="clock" size={14} className="shrink-0" />
                  <span>Arrives in {facts.deliveryTime}</span>
                </p>
              )}
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp} className="mx-auto mt-1 flex h-11 w-fit items-center gap-2 px-3 text-[13px] font-semibold">
                  <Icon name="whatsapp" size={16} /> Send this bag to WhatsApp
                </a>
              )}
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
