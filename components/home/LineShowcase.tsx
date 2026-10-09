"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LineName } from "@/components/ui/LineName";
import type { LineKey } from "@/content/taxonomy";

export type LineShowcaseItem = {
  key: LineKey;
  label: string;
  audience: string;
  count: number;
  blurb: string;
  href: string;
  /** The line's high-noon still (public/images/line-<key>), or null until it exists. */
  src: string | null;
  tone: string;
};

/**
 * "The lines": the three names on the left, each drawn as its line's logotype
 * from the brand kit, and one still on the right. The list runs exactly the
 * still's height in three equal rows, each name under its own rule and one more
 * rule under eternal, so the four rules are evenly spaced from the still's top
 * edge to its bottom. Hovering or focusing a name darkens its rule, nudges it right and brings in
 * that line's still; each name is the link to its line, so a tap on a phone
 * goes straight there. Every still is in the page from the start, so the swap
 * never waits on a download.
 */
export function LineShowcase({ items }: { items: LineShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
      <ul className="grid grid-rows-3 border-b border-dune">
        {items.map((it, i) => (
          <li key={it.key} className="min-h-0">
            <Link
              href={it.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              data-on={i === active ? "" : undefined}
              className="line-name group flex h-full items-start justify-between gap-3 border-t py-4 lg:py-8"
            >
              <span className="line-text min-w-0">
                {/* The t is the name's height; eternal's l rises above it, as in the logotype. */}
                <span className="block text-[30px] leading-none sm:text-[40px] lg:text-[clamp(56px,6vw,96px)]">
                  <LineName line={it.key} size="1em" />
                </span>
                <span className="mt-1.5 block text-[13px] font-semibold text-night lg:mt-3 lg:text-[15px]">{it.audience}</span>
                <span className="block text-[12px] text-ash lg:text-[14px]">
                  {it.count} scents<span className="hidden lg:inline"> · {it.blurb}</span>
                </span>
              </span>
              {/* Level with the middle of the name, as each row's content sits at its top. */}
              <Icon name="arrow-right" size={28} aria-hidden="true" className="line-arrow hidden shrink-0 lg:mt-[calc(clamp(56px,6vw,96px)/2_-_14px)] lg:block" />
            </Link>
          </li>
        ))}
      </ul>
      {/* The still repeats the active name's link for a pointer; screen readers and the tab order have the names. Its height
          sets the row, and the list stretches to it; if the list is ever the taller (always, on a phone), the still grows
          to match within its own column's width, cropping, instead of widening past the screen's edge. */}
      <Link href={current.href} aria-hidden="true" tabIndex={-1} className="relative block aspect-[4/5] h-full w-full overflow-hidden" style={current.src ? undefined : { backgroundColor: current.tone }}>
        {items.map((it, i) =>
          it.src ? (
            <Image key={it.key} src={it.src} alt="" fill sizes="(min-width: 1024px) 50vw, 50vw" data-on={i === active ? "" : undefined} className="line-still object-cover" />
          ) : null,
        )}
      </Link>
    </div>
  );
}
