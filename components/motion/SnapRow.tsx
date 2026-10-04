"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/client/analytics";

/**
 * D1 · a native scroll-snap row that follows the frame in view, with dots or,
 * when `counter` is set, a "1 / 3" counter laid over the frames (no extra
 * height). `swipeLabel` sends ui gallery_swipe each time the visitor moves to
 * another frame.
 */
export function SnapRow({
  items,
  className = "",
  itemClassName = "",
  label,
  counter = false,
  counterClassName = "",
  swipeLabel,
}: {
  items: ReactNode[];
  className?: string;
  itemClassName?: string;
  label?: string;
  counter?: boolean;
  counterClassName?: string;
  swipeLabel?: string;
}) {
  const row = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = row.current;
    if (!el || items.length < 2) return;
    const children = Array.from(el.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // isIntersecting stays true for a frame sliding out; only the one at least 60 % in view counts.
          if (e.intersectionRatio < 0.6) continue;
          const i = children.indexOf(e.target as HTMLElement);
          if (i === shown.current) continue;
          shown.current = i;
          setActive(i);
          if (swipeLabel) track({ name: "ui", action: "gallery_swipe", label: `${swipeLabel} ${i + 1}/${items.length}` });
        }
      },
      { root: el, threshold: 0.6 },
    );
    children.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items.length, swipeLabel]);
  const many = items.length > 1;
  return (
    <div className={counter ? "relative" : undefined}>
      <div ref={row} className={`snap-row ${className}`} role="region" aria-roledescription="carousel" aria-label={label}>
        {items.map((node, i) => (
          <div key={i} className={itemClassName} role={many ? "group" : undefined} aria-roledescription={many ? "slide" : undefined} aria-label={many ? `${i + 1} of ${items.length}` : undefined}>
            {node}
          </div>
        ))}
      </div>
      {many && counter && (
        <span className={`tnum pointer-events-none absolute bottom-3 flex h-6 items-center bg-linen/85 px-2 text-[12px] font-medium text-night ${counterClassName}`} aria-hidden="true">
          {active + 1} / {items.length}
        </span>
      )}
      {many && !counter && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {items.map((_, i) => (
            <span key={i} className={`h-1 w-6 transition-colors duration-200 ${i === active ? "bg-night" : "bg-dune"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
