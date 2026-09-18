"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import { Price } from "@/components/ui/Primitives";
import { site } from "@/content/site";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";

/**
 * Sizes are variants, the sample is a real variant. When the store has no
 * 5 ml variant yet the size selector and "add a sample too" box stay hidden.
 */
export function BuyBox({ entry, lowStock }: { entry: ScentIndexEntry; lowStock: number | null }) {
  const cart = useCart();
  const [size, setSize] = useState<"bottle" | "sample">("bottle");
  const [sampleToo, setSampleToo] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sticky, setSticky] = useState(false);
  const mainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variant = size === "sample" && entry.sample ? entry.sample : entry.bottle;
  if (!variant) return null;
  const kind = entry.kind === "set" ? "set" : size === "sample" ? "sample" : "bottle";

  const add = () => {
    cart.add({ variantId: variant.id, numericId: variant.numericId, handle: entry.handle, title: entry.title, variantLabel: variant.label, kind, price: variant.price, image: entry.image, lineLabel: entry.lineLabel, world: entry.world }, qty, {
      openDrawer: !(sampleToo && entry.sample && size === "bottle"),
    });
    if (sampleToo && entry.sample && size === "bottle") {
      cart.add({ variantId: entry.sample.id, numericId: entry.sample.numericId, handle: entry.handle, title: entry.title, variantLabel: entry.sample.label, kind: "sample", price: entry.sample.price, image: entry.image, lineLabel: entry.lineLabel, world: entry.world }, 1);
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  const whatsappHref = site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hello eternal — I have a question about ${entry.title}.`)}` : null;

  return (
    <div className="flex flex-col gap-6">
      {entry.sample && (
        <fieldset>
          <legend className="eyebrow mb-3 text-ash">Size</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["bottle", "sample"] as const).map((k) => {
              const v = k === "bottle" ? entry.bottle! : entry.sample!;
              const on = size === k;
              return (
                <label key={k} className={`flex h-[60px] cursor-pointer items-center justify-between bg-paper px-4 text-[13px] ${on ? "border-2 border-night" : "border border-dune"}`}>
                  <input type="radio" name="size" value={k} checked={on} onChange={() => setSize(k)} className="sr-only" />
                  <span className="font-semibold">{v.label}</span>
                  <span className="tnum text-ash">
                    {formatMoney(v.price)}
                    {k === "sample" ? " · credited back" : ""}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {entry.sample && size === "bottle" && (
        <label className="flex cursor-pointer items-start gap-3 border border-dashed border-dune p-4 text-[13px]">
          <input type="checkbox" checked={sampleToo} onChange={(e) => setSampleToo(e.target.checked)} className="mt-0.5 h-4 w-4 accent-night" />
          <span>
            <strong>Add the {entry.sample.label} sample too</strong> — {formatMoney(entry.sample.price)}, credited back if you keep the bottle. [confirm]
          </span>
        </label>
      )}

      <div className="flex gap-3">
        <div className="inline-flex h-[52px] items-center border border-dune bg-paper">
          <button type="button" aria-label="Decrease quantity" className="flex h-full w-12 items-center justify-center hover:bg-sand" onClick={() => setQty((n) => Math.max(1, n - 1))}>
            <Icon name="minus" size={14} />
          </button>
          <span className="tnum w-8 text-center text-[14px]" aria-live="polite">
            {qty}
          </span>
          <button type="button" aria-label="Increase quantity" className="flex h-full w-12 items-center justify-center hover:bg-sand" onClick={() => setQty((n) => Math.min(10, n + 1))}>
            <Icon name="plus" size={14} />
          </button>
        </div>
        <button ref={mainRef} type="button" className="btn flex-1" onClick={add} disabled={!variant.availableForSale} aria-live="polite">
          {!variant.availableForSale ? "Sold out" : added ? (
            <>
              Added <Icon name="check" size={16} />
            </>
          ) : (
            `Add to bag · ${formatMoney({ amount: parseFloat(variant.price.amount) * qty, currencyCode: variant.price.currencyCode })}`
          )}
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-y-2 text-[12px] text-ash sm:grid-cols-4">
        <li className="inline-flex items-center gap-1.5">
          <Icon name="truck" size={14} /> Cash on delivery
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={14} /> {site.deliveryTime}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Icon name="refresh" size={14} /> {site.returnsPolicy}
        </li>
        {whatsappHref && (
          <li>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-night hover:text-sea">
              <Icon name="whatsapp" size={14} /> Ask us on WhatsApp
            </a>
          </li>
        )}
      </ul>
      {lowStock !== null && (
        <p className="text-[12px] text-gold-text">
          Only {lowStock} left in {entry.bottle?.label ?? "this size"}.
        </p>
      )}

      {/* Sticky add-to-bag bar: appears the moment the main button leaves the viewport. */}
      {sticky && (
        <div className="bar-enter float-shadow fixed inset-x-0 bottom-0 z-[40] border-t border-dune bg-paper">
          <div className="wrap flex h-[68px] items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="display-m truncate !text-[18px]">{entry.title}</p>
              <p className="text-[12px] text-ash">
                {variant.label}
                {entry.lineLabel ? ` · ${entry.lineLabel}` : ""} · <Price money={variant.price} />
              </p>
            </div>
            <button type="button" className="btn btn-sm" onClick={add} disabled={!variant.availableForSale}>
              {added ? "Added" : "Add to bag"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
