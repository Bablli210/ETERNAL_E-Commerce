"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** D1 · a native scroll-snap row with dots that follow the frame in view. */
export function SnapRow({ items, className = "", itemClassName = "", label }: { items: ReactNode[]; className?: string; itemClassName?: string; label?: string }) {
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = row.current;
    if (!el || items.length < 2) return;
    const children = Array.from(el.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(children.indexOf(e.target as HTMLElement));
      },
      { root: el, threshold: 0.6 },
    );
    children.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items.length]);
  return (
    <div>
      <div ref={row} className={`snap-row ${className}`} aria-label={label}>
        {items.map((node, i) => (
          <div key={i} className={itemClassName}>
            {node}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {items.map((_, i) => (
            <span key={i} className={`h-1 w-6 transition-colors duration-200 ${i === active ? "bg-night" : "bg-dune"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
