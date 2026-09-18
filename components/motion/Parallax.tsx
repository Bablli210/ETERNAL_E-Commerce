"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { isDesktop, motionAllowed } from "@/lib/motion";

/**
 * Sets three custom properties on the element as it scrolls, for CSS to use:
 * --py (offset × factor, for parallax layers), --pp (0–1 as the element
 * leaves through the top) and --sy (scrollY). Desktop only unless asked, and
 * nothing at all under reduced motion.
 */
export function useParallax<T extends HTMLElement>(factor: number, desktopOnly = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed() || (desktopOnly && !isDesktop())) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const centre = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.setProperty("--py", `${(-centre * factor).toFixed(1)}px`);
      el.style.setProperty("--pp", Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))).toFixed(3));
      el.style.setProperty("--sy", `${window.scrollY.toFixed(0)}px`);
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
  }, [factor, desktopOnly]);
  return ref;
}

export function Parallax({ factor = 0.2, className = "", id, style, children, ...rest }: { factor?: number; className?: string; id?: string; style?: React.CSSProperties; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useParallax<HTMLDivElement>(factor);
  return (
    <div ref={ref} id={id} className={className} style={style} {...rest}>
      {children}
    </div>
  );
}

export function ParallaxSection({ factor = 0, className = "", id, style, children }: { factor?: number; className?: string; id?: string; style?: React.CSSProperties; children: ReactNode }) {
  const ref = useParallax<HTMLElement>(factor);
  return (
    <section ref={ref} id={id} className={className} style={style}>
      {children}
    </section>
  );
}
