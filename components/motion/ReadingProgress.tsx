"use client";

import { useEffect, useRef } from "react";
import { isDesktop, motionAllowed } from "@/lib/motion";

/**
 * T1 / T2 · a hairline reading-progress bar along the top of a tale, and the
 * moment the shoppable card is allowed in: 40 % read on desktop, 30 % on mobile.
 * Elements marked data-t2 get .is-in then (immediately without motion).
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = document.getElementById(targetId);
    const el = bar.current;
    if (!target || !el) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-t2]"));
    if (!motionAllowed()) {
      cards.forEach((c) => c.classList.add("is-in"));
    }
    const threshold = isDesktop() ? 0.4 : 0.3;
    let raf = 0;
    let shown = !motionAllowed();
    const update = () => {
      raf = 0;
      const r = target.getBoundingClientRect();
      const read = Math.min(1, Math.max(0, (window.innerHeight * 0.8 - r.top) / Math.max(1, r.height)));
      el.style.setProperty("--rp", read.toFixed(3));
      if (!shown && read >= threshold) {
        shown = true;
        cards.forEach((c) => c.classList.add("is-in"));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);
  return <div ref={bar} aria-hidden="true" className="read-progress fixed left-0 top-0 z-[70] h-[2px] w-full bg-gold" />;
}
