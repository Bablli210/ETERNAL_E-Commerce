"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { facts } from "@/lib/facts";
import { track } from "@/lib/client/analytics";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";
import { lineWithAudience } from "./line";

/**
 * Sizes are variants, the sample is a real variant: the size choice appears
 * by itself once a 5 ml variant exists. Quantity lives in the bag, so the
 * button is one full-width tap with its price on it.
 */
export function BuyBox({ entry, lowStock }: { entry: ScentIndexEntry; lowStock: number | null }) {
  const cart = useCart();
  const [size, setSize] = useState<"bottle" | "sample">("bottle");
  const [added, setAdded] = useState(false);
  const [sticky, setSticky] = useState(false);
  const mainRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // The bar shows whenever the main button is not fully on screen, above or below it.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    const io = new IntersectionObserver(([e]) => setSticky(e.intersectionRatio < 1), { threshold: [0, 1], rootMargin: `-${header}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Sticky-bar contract: --sticky-bar-h holds the bar's height while it shows, so floating buttons sit above it.
  useEffect(() => {
    const bar = barRef.current;
    if (!sticky || !bar) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--sticky-bar-h", `${bar.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [sticky]);

  const variant = size === "sample" && entry.sample ? entry.sample : entry.bottle;
  if (!variant) return null;
  const kind = entry.kind === "set" ? "set" : size === "sample" ? "sample" : "bottle";
  const price = formatMoney(variant.price);

  const add = () => {
    cart.add({ variantId: variant.id, numericId: variant.numericId, productId: entry.productId, handle: entry.handle, title: entry.title, variantLabel: variant.label, kind, price: variant.price, image: entry.image, lineLabel: entry.lineLabel, world: entry.world });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };
  const label = !variant.availableForSale ? "Sold out" : added ? null : `Add to bag · ${price}`;

  return (
    <div className="flex flex-col gap-3">
      {entry.sample && (
        <fieldset>
          <legend className="sr-only">Size</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["bottle", "sample"] as const).map((k) => {
              const v = k === "bottle" ? entry.bottle! : entry.sample!;
              const on = size === k;
              return (
                <label key={k} className={`size-opt flex h-11 cursor-pointer items-center justify-between gap-2 bg-paper px-3 text-[13px] ${on ? "shadow-[inset_0_0_0_2px_var(--color-night)]" : "shadow-[inset_0_0_0_1px_var(--color-dune)]"}`}>
                  <input type="radio" name="size" value={k} checked={on} onChange={() => setSize(k)} className="sr-only" />
                  <span className="font-semibold">{v.label}</span>
                  <span className="tnum truncate text-ash">
                    {formatMoney(v.price)}
                    {k === "sample" && facts.sampleCredit ? " · credited back" : ""}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <button ref={mainRef} type="button" className="btn w-full" onClick={add} disabled={!variant.availableForSale} aria-live="polite">
        <span key={`${size}-${added}`} className="price-swap inline-flex items-center gap-2">
          {label ?? (
            <>
              Added <Icon name="check" size={16} />
            </>
          )}
        </span>
      </button>

      {lowStock !== null && <p className="text-[13px] text-gold-text">Only {lowStock} left in {entry.bottle?.label ?? "this size"}.</p>}

      <PromiseList entry={entry} kind={kind} />

      {sticky && (
        <div ref={barRef} className="pdp-bar bar-enter float-shadow fixed inset-x-0 bottom-0 z-[40] border-t border-dune bg-paper pb-[env(safe-area-inset-bottom)]">
          <div className="wrap flex h-16 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="display-m truncate !text-[18px]">{entry.title}</p>
              <p className="truncate text-[12px] text-ash">
                {variant.label}
                {entry.line ? ` · ${lineWithAudience(entry.line)}` : ""}
              </p>
            </div>
            <button type="button" className="btn h-12 shrink-0 px-5" onClick={add} disabled={!variant.availableForSale}>
              {label ?? "Added"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type PromiseRow = { key: string; icon: IconName; text: string; detail?: string | null; href?: string; external?: boolean };

/**
 * What happens after the tap, right under it. Each line exists only once its
 * fact is confirmed in content/site.ts; cash on delivery is always offered.
 */
function PromiseList({ entry, kind }: { entry: ScentIndexEntry; kind: "bottle" | "sample" | "set" }) {
  const included = facts.deliveryIncluded === true && kind === "bottle";
  const otherMethods = facts.paymentMethods.filter((m) => !/cash/i.test(m));
  const rows: PromiseRow[] = [];
  if (included || facts.deliveryTime || facts.deliveryCutoff) {
    rows.push({ key: "delivery", icon: "truck", text: included ? "Delivery included" : "Delivery", detail: [facts.deliveryTime, facts.deliveryCutoff].filter(Boolean).join(". "), href: "/help#delivery" });
  }
  rows.push({ key: "cod", icon: "shield", text: "Cash on delivery", detail: [facts.codFee, otherMethods.length ? `or ${otherMethods.join(", ")}` : null].filter(Boolean).join(" · "), href: "/help#cod" });
  if (facts.freeSamples) rows.push({ key: "samples", icon: "plus", text: facts.freeSamples });
  if (facts.returnsPolicy) rows.push({ key: "returns", icon: "refresh", text: facts.returnsPolicy, detail: facts.returnsWindow, href: "/help#returns" });
  if (facts.whatsapp) {
    const text = encodeURIComponent(`Hello eternal, I have a question about ${entry.title}.`);
    rows.push({ key: "whatsapp", icon: "whatsapp", text: "Questions? Ask us on WhatsApp", detail: facts.whatsappHours, href: `https://wa.me/${facts.whatsapp}?text=${text}`, external: true });
  }
  return (
    <ul className="mt-1 divide-y divide-dune border-y border-dune text-[14px]">
      {rows.map((r) => {
        const body = (
          <>
            <Icon name={r.icon} size={18} className="mt-0.5 shrink-0 text-gold-text" />
            <span className="min-w-0 flex-1">
              {r.text}
              {r.detail && <span className="text-ash"> · {r.detail}</span>}
            </span>
            {r.href && <Icon name="chevron-right" size={16} className="mt-0.5 shrink-0 text-ash" />}
          </>
        );
        const row = "flex min-h-11 items-start gap-3 py-3";
        return (
          <li key={r.key}>
            {!r.href ? (
              <div className={row}>{body}</div>
            ) : r.external ? (
              <a href={r.href} target="_blank" rel="noopener noreferrer" className={`${row} hover:text-sea`} onClick={() => track({ name: "generate_lead", method: "whatsapp" })}>
                {body}
              </a>
            ) : (
              <Link href={r.href} className={`${row} hover:text-sea`}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
