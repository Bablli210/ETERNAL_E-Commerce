"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
 * "The lines": the three names on the left, one still on the right. Hovering
 * or focusing a name brings in that line's high-noon still; each name is the
 * link to its line, so a tap on a phone goes straight there. Every still is in
 * the page from the start, so the swap never waits on a download.
 */
export function LineShowcase({ items }: { items: LineShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
      <ul>
        {items.map((it, i) => (
          <li key={it.key} className="border-t border-dune last:border-b">
            <Link
              href={it.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              data-on={i === active ? "" : undefined}
              className="line-name group flex items-center justify-between gap-3 py-4 lg:py-8"
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
          </li>
        ))}
      </ul>
      {/* The still repeats the active name's link for a pointer; screen readers and the tab order have the names. */}
      <Link href={current.href} aria-hidden="true" tabIndex={-1} className="relative block aspect-[4/5] overflow-hidden" style={current.src ? undefined : { backgroundColor: current.tone }}>
        {items.map((it, i) =>
          it.src ? (
            <Image key={it.key} src={it.src} alt="" fill sizes="(min-width: 1024px) 50vw, 50vw" data-on={i === active ? "" : undefined} className="line-still object-cover" />
          ) : null,
        )}
      </Link>
    </div>
  );
}
