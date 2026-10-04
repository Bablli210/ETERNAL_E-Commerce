"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motionAllowed } from "@/lib/motion";

/**
 * The phone's answer to card hover (collection.css): a product card that has a
 * notes still shows it while the card rests in the middle of the screen. Cards
 * get .is-near a screen ahead, so the lazy still is loaded by the time it is
 * needed, and .is-centered after half a second in the middle band, so a fast
 * scroll never flickers. Pointer devices keep real hover; with motion off
 * nothing changes.
 */
export function CardFocus() {
  const pathname = usePathname();
  useEffect(() => {
    if (!window.matchMedia("(hover: none), (pointer: coarse)").matches || !motionAllowed() || !("IntersectionObserver" in window)) return;
    const timers = new Map<Element, number>();
    const near = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-near");
          near.unobserve(e.target);
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    const centre = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target;
          window.clearTimeout(timers.get(el));
          if (e.isIntersecting) timers.set(el, window.setTimeout(() => el.classList.add("is-centered"), 500));
          else el.classList.remove("is-centered");
        }
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    const seen = new WeakSet<Element>();
    let frame = 0;
    const scan = () => {
      frame = 0;
      document.querySelectorAll(".pimg-hover").forEach((h) => {
        const card = h.closest(".group");
        if (!card || seen.has(card)) return;
        seen.add(card);
        near.observe(card);
        centre.observe(card);
      });
    };
    scan();
    // Cards also arrive after the first paint (filters, the finder's results), so new ones are picked up too.
    const mo = new MutationObserver(() => {
      if (!frame) frame = window.requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      near.disconnect();
      centre.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
