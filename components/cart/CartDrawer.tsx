"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Wordmark";
import { Price } from "@/components/ui/Primitives";
import { formatMoney } from "@/lib/format";
import { site } from "@/content/site";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { parseJSON, RECENT_KEY, useStoredRaw } from "@/lib/client/storage";
import { motionAllowed } from "@/lib/motion";

export function CartDrawer({ index }: { index: ScentIndexEntry[] }) {
  const cart = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const recentRaw = useStoredRaw(RECENT_KEY);
  const recent = useMemo(() => parseJSON<string[]>(recentRaw, []), [recentRaw]);
  const [removing, setRemoving] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (cart.open) closeRef.current?.focus();
  }, [cart.open]);

  const inBag = useMemo(() => new Set(cart.lines.map((l) => l.handle)), [cart.lines]);

  /** A 5 ml sample of something they looked at earlier — only when the sample variant exists. */
  const sampleUpsell = useMemo(() => {
    for (const h of recent) {
      const e = index.find((x) => x.handle === h);
      if (e && e.sample?.availableForSale && !inBag.has(h)) return e;
    }
    return null;
  }, [recent, index, inBag]);

  /** Complete the set: one scent from the same line as the first bottle in the bag. */
  const setUpsell = useMemo(() => {
    const first = cart.lines[0];
    if (!first) return null;
    const firstEntry = index.find((x) => x.handle === first.handle);
    const line = firstEntry?.line;
    if (!line) return null;
    return (
      index.find((x) => x.kind === "scent" && x.line === line && !inBag.has(x.handle) && x.handle !== sampleUpsell?.handle && x.image && x.isBestseller && x.bottle?.availableForSale) ??
      index.find((x) => x.kind === "scent" && x.line === line && !inBag.has(x.handle) && x.handle !== sampleUpsell?.handle && x.image && x.bottle?.availableForSale) ??
      null
    );
  }, [cart.lines, index, inBag, sampleUpsell]);

  const threshold = site.freeShippingThreshold;
  const away = threshold ? Math.max(0, threshold - cart.subtotal) : null;

  const addEntry = (e: ScentIndexEntry, which: "bottle" | "sample") => {
    const v = which === "sample" ? e.sample : e.bottle;
    if (!v) return;
    // C3: the suggestion slides into the list as a real line.
    cart.add(
      { variantId: v.id, numericId: v.numericId, handle: e.handle, title: e.title, variantLabel: v.label, kind: which === "sample" ? "sample" : e.kind === "set" ? "set" : "bottle", price: v.price, image: e.image, lineLabel: e.lineLabel, world: e.world },
      1,
      { openDrawer: false, toast: false },
    );
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

  if (!cart.open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Your bag">
      <button type="button" aria-label="Close bag" onClick={cart.closeDrawer} className="fade-enter absolute inset-0 bg-night/40" />
      <aside className="cart-panel absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col bg-paper text-night lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-full lg:max-w-[460px]">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-dune px-6">
          <h2 className="display-m">
            Your bag <span className="tnum text-ash">({cart.count})</span>
          </h2>
          <button ref={closeRef} type="button" onClick={cart.closeDrawer} aria-label="Close" className="flex h-11 w-11 items-center justify-center hover:text-sea">
            <Icon name="close" />
          </button>
        </header>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-16 text-center">
            <Mark size={72} className="text-night" />
            <p className="display-m">Your bag is empty.</p>
            <p className="max-w-[30ch] text-ash">Start with a bottle, or let the finder narrow the house to three.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn" onClick={cart.closeDrawer}>
                Shop the collection
              </Link>
              <Link href="/finder" className="btn btn-secondary" onClick={cart.closeDrawer}>
                Find your scent
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              {threshold !== null && away !== null && (
                <div className="border-b border-dune py-4">
                  <p className="text-[13px]">
                    {away > 0 ? (
                      <>
                        <strong key={away} className="tnum tick-in inline-block">
                          {formatMoney({ amount: away, currencyCode: cart.currency })}
                        </strong>{" "}
                        away from free shipping
                      </>
                    ) : (
                      <strong>You have free shipping.</strong>
                    )}
                  </p>
                  <div className="meter is-in mt-2" style={{ ["--v" as string]: `${Math.min(100, Math.round((cart.subtotal / threshold) * 100))}%` }}>
                    <i />
                  </div>
                  <p className="mt-1 text-[11px] text-ash">Free over {formatMoney({ amount: threshold, currencyCode: cart.currency })}</p>
                </div>
              )}

              <ul>
                {cart.lines.map((l) => (
                  <li key={l.variantId} className={`line-row ${removing.has(l.variantId) ? "removing" : ""} ${cart.lastAdded === l.variantId ? "line-new" : ""}`}>
                    <div className="flex gap-4 overflow-hidden border-b border-dune py-5">
                      <Link href={`/products/${l.handle}`} onClick={cart.closeDrawer} className="relative block h-[96px] w-[76px] shrink-0 overflow-hidden" style={{ backgroundColor: l.world.bg }}>
                        {l.image && <Image src={l.image} alt="" fill sizes="76px" className="object-cover" />}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-3">
                          <Link href={`/products/${l.handle}`} onClick={cart.closeDrawer} className="display-m !text-[20px] leading-tight hover:text-sea">
                            {l.title}
                          </Link>
                          {/* C1: the price ticks to the new value. */}
                          <Price key={l.qty} money={{ amount: String(parseFloat(l.price.amount) * l.qty), currencyCode: l.price.currencyCode }} className="tick-in inline-block shrink-0 text-[14px] font-medium" />
                        </div>
                        <p className="text-[12px] text-ash">
                          {l.variantLabel}
                          {l.lineLabel ? ` · ${l.lineLabel}` : ""}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex h-10 items-center border border-dune">
                            <button type="button" aria-label="Decrease quantity" className="flex h-full w-10 items-center justify-center hover:bg-sand" onClick={() => (l.qty <= 1 ? removeLine(l.variantId) : cart.setQty(l.variantId, l.qty - 1))}>
                              <Icon name="minus" size={14} />
                            </button>
                            <span key={l.qty} className="tnum tick-in inline-block w-8 text-center text-[13px]" aria-live="polite">
                              {l.qty}
                            </span>
                            <button type="button" aria-label="Increase quantity" className="flex h-full w-10 items-center justify-center hover:bg-sand" onClick={() => cart.setQty(l.variantId, l.qty + 1)}>
                              <Icon name="plus" size={14} />
                            </button>
                          </div>
                          <button type="button" className="lnk lnk-quiet text-[12px] text-ash" onClick={() => removeLine(l.variantId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {(sampleUpsell || setUpsell) && (
                <div className="py-5">
                  <ul className="flex flex-col gap-3">
                    {sampleUpsell && sampleUpsell.sample && (
                      <li className="rise-in flex items-center justify-between gap-3 border border-dashed border-dune p-3" style={{ ["--i" as string]: 4 }}>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold">Add a {site.sampleSizeMl} ml sample of {sampleUpsell.title}</p>
                          <p className="text-[12px] text-ash">
                            You looked at it earlier · <Price money={sampleUpsell.sample.price} />
                          </p>
                        </div>
                        <button type="button" className="btn btn-secondary btn-xs" onClick={() => addEntry(sampleUpsell, "sample")}>
                          Add
                        </button>
                      </li>
                    )}
                    {setUpsell && setUpsell.bottle && (
                      <li className="rise-in flex items-center justify-between gap-3 border border-dune p-3" style={{ ["--i" as string]: 5 }}>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold">Complete the set: {setUpsell.title}</p>
                          <p className="text-[12px] text-ash">
                            From the same line · <Price money={setUpsell.bottle.price} />
                          </p>
                        </div>
                        <button type="button" className="btn btn-secondary btn-xs" onClick={() => addEntry(setUpsell, "bottle")}>
                          Add
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-dune px-6 pb-6 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold">Subtotal</span>
                <Price key={cart.subtotal} money={{ amount: String(cart.subtotal), currencyCode: cart.currency }} className="tick-in inline-block text-[16px] font-semibold" />
              </div>
              <p className="mt-1 text-[11px] leading-snug text-ash">Shipping and cash-on-delivery fee calculated at checkout · {site.deliveryTime} across Egypt</p>
              {cart.error && (
                <p role="alert" className="mt-3 text-[12px] text-gold-text">
                  {cart.error}
                </p>
              )}
              {/* C4: loading state is three dots; the button keeps its size. */}
              <button type="button" className="btn btn-block mt-4" onClick={cart.checkout} disabled={cart.checkingOut} aria-busy={cart.checkingOut}>
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
                  "Checkout"
                )}
              </button>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-ash">
                <span className="inline-flex items-center gap-1">
                  <Icon name="shield" size={14} /> Secure checkout
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="truck" size={14} /> Cash on delivery available
                </span>
              </div>
              <button type="button" className="lnk lnk-quiet mx-auto mt-4 block text-[12px]" onClick={cart.closeDrawer}>
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
