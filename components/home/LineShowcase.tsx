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
  /** The line's logotype (public/images/logo-<key>), or null: the name is then set in the serif. */
  logo: string | null;
  tone: string;
};

/**
 * "The lines": the three names on the left, one still on the right. The list
 * runs exactly the still's height: eterna's rule is level with the still's
 * top edge and eternal's last line with its bottom, with no rule under it.
 * Hovering or focusing a name darkens its rule, nudges it right and brings in
 * that line's still; each name is the link to its line, so a tap on a phone
 * goes straight there. Every still is in the page from the start, so the swap
 * never waits on a download.
 */
export function LineShowcase({ items }: { items: LineShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
      <ul className="flex flex-col justify-between">
        {items.map((it, i) => (
          <li key={it.key}>
            <Link
              href={it.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              data-on={i === active ? "" : undefined}
              className={`line-name group flex items-center justify-between gap-3 border-t pt-4 lg:pt-8 ${i < items.length - 1 ? "pb-4 lg:pb-8" : ""}`}
            >
              <span className="line-text min-w-0">
                {it.logo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a logotype of unknown proportions, drawn at the name's height. */}
                    <img src={it.logo} alt="" className="line-logo block h-[30px] w-auto sm:h-[40px] lg:h-[clamp(56px,6vw,96px)]" />
                    <span className="sr-only">{it.label}</span>
                  </>
                ) : (
                  <span className="serif block text-[30px] font-semibold leading-none sm:text-[40px] lg:text-[clamp(56px,6vw,96px)]">{it.label}</span>
                )}
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
      {/* The still repeats the active name's link for a pointer; screen readers and the tab order have the names. Its height
          sets the row, and the list stretches to it; if the list is ever the taller, the still grows to match. */}
      <Link href={current.href} aria-hidden="true" tabIndex={-1} className="relative block aspect-[4/5] h-full overflow-hidden" style={current.src ? undefined : { backgroundColor: current.tone }}>
        {items.map((it, i) =>
          it.src ? (
            <Image key={it.key} src={it.src} alt="" fill sizes="(min-width: 1024px) 50vw, 50vw" data-on={i === active ? "" : undefined} className="line-still object-cover" />
          ) : null,
        )}
      </Link>
    </div>
  );
}
