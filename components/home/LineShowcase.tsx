"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export type LineShowcaseItem = {
  key: string;
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
 * "The lines", in cells (DESIGN.md §4): the title and the three names stacked
 * in cells on the left, one high-noon still in the cell on the right, running
 * to the rules. Hovering or focusing a name brings in that line's still; each
 * name is the link to its line, so a tap on a phone goes straight there.
 * Every still is in the page from the start, so the swap never waits on a
 * download.
 */
export function LineShowcase({ items, head }: { items: LineShowcaseItem[]; head?: ReactNode }) {
  const [active, setActive] = useState(0);
  const current = items[active];
  return (
    <div className="cells grid-cols-2">
      <div className="cells lg:grid-rows-[auto_1fr_1fr_1fr]">
        {head && <div className="cell max-lg:hidden">{head}</div>}
        {items.map((it, i) => (
          <Link
            key={it.key}
            href={it.href}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            data-on={i === active ? "" : undefined}
            className="line-name group cell flex items-center justify-between gap-3"
          >
            <span className="min-w-0">
              <span className="serif block text-[30px] font-semibold leading-none sm:text-[40px] lg:text-[clamp(56px,6vw,96px)]">{it.label}</span>
              <span className="mt-1.5 block text-[13px] font-semibold text-night lg:mt-3 lg:text-[15px]">{it.audience}</span>
              <span className="block text-[12px] text-ash lg:text-[14px]">
                {it.count} scents<span className="hidden lg:inline"> · {it.blurb}</span>
              </span>
            </span>
            <Icon name="arrow-right" size={28} aria-hidden="true" className="line-arrow hidden shrink-0 lg:block" />
          </Link>
        ))}
      </div>
      {/* The still repeats the active name's link for a pointer; screen readers and the tab order have the names. */}
      <Link href={current.href} aria-hidden="true" tabIndex={-1} className="relative block min-h-[240px] overflow-hidden" style={current.src ? undefined : { backgroundColor: current.tone }}>
        {items.map((it, i) =>
          it.src ? (
            <Image key={it.key} src={it.src} alt="" fill sizes="50vw" data-on={i === active ? "" : undefined} className="line-still object-cover" />
          ) : null,
        )}
      </Link>
    </div>
  );
}
