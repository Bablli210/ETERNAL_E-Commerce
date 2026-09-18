"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isDesktop, motionAllowed } from "@/lib/motion";

/**
 * Scroll reveals: every [data-reveal] element gets .is-in once it is 20 %
 * visible. Siblings stagger through the --i custom property set by parents.
 * With prefers-reduced-motion the CSS shows everything immediately.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = () => Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (!motionAllowed() || !("IntersectionObserver" in window)) {
      els().forEach((el) => el.classList.add("is-in"));
      return;
    }
    // Mobile: only what sits within the first screens animates; later rows simply appear.
    const mobileCutoff = isDesktop() ? Infinity : window.innerHeight * 1.6;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -5% 0px" },
    );
    const observe = () =>
      els().forEach((el) => {
        if (el.getBoundingClientRect().top + window.scrollY > mobileCutoff) el.classList.add("is-in");
        else io.observe(el);
      });
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
  return null;
}
