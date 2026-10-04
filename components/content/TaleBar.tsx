"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AddToBagButton, type BagProduct, type BagVariant } from "@/components/cart/AddToBagButton";

/**
 * A tale's scent, one tap away on a phone: the bar rises once the title has
 * scrolled away and steps aside when the buy card at the end comes into view,
 * so the two never stack. Sticky-bar contract: while it shows, --sticky-bar-h
 * on <html> holds its height (app/styles/content.css pads the page with it).
 */
export function TaleBar({ titleId, cardId, variant, product, note }: { titleId: string; cardId: string; variant: BagVariant; product: BagProduct; note: string }) {
  const [show, setShow] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const title = document.getElementById(titleId);
    const card = document.getElementById(cardId);
    const phone = window.matchMedia("(max-width: 1023px)");
    let raf = 0;
    const update = () => {
      raf = 0;
      const past = title ? title.getBoundingClientRect().bottom < 0 : false;
      const atCard = card ? card.getBoundingClientRect().top < window.innerHeight : false;
      setShow(phone.matches && past && !atCard);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [titleId, cardId]);

  useEffect(() => {
    const el = bar.current;
    if (!show || !el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--sticky-bar-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [show]);

  if (!show) return null;
  return (
    <div ref={bar} className="tale-bar bar-enter float-shadow fixed inset-x-0 bottom-0 z-[40] border-t border-dune bg-paper pb-[env(safe-area-inset-bottom)]">
      <div className="wrap flex h-16 items-center justify-between gap-3">
        <Link href={`/products/${product.handle}`} className="min-w-0">
          <p className="truncate font-serif text-[20px] font-semibold leading-tight">{product.title}</p>
          <p className="truncate text-[12px] text-ash">{note}</p>
        </Link>
        <AddToBagButton variant={variant} product={product} className="h-12 shrink-0 px-5" label="Add to bag" />
      </div>
    </div>
  );
}
