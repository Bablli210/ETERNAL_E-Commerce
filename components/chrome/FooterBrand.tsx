"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { Logotype } from "@/components/ui/Wordmark";

/** The width of the text as drawn, not of its box: a Range around it spans its widest line. */
const inkWidth = (el: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

/** In the brand kit's lockup the tagline spans 70% of the logotype, centred under it. */
const TAGLINE_SHARE = 0.7;

/**
 * The footer's lockup, as in the brand kit: the eternal logotype with the
 * tagline under it in capitals. The tagline is live text, sized by
 * measurement to the lockup's proportion, so it holds for any font load and
 * refits when the logotype's width changes.
 */
export function FooterBrand({ tagline }: { tagline: string }) {
  const logo = useRef<HTMLAnchorElement>(null);
  const line = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const m = logo.current;
    const l = line.current;
    if (!m || !l) return;
    const fit = () => {
      const target = m.getBoundingClientRect().width * TAGLINE_SHARE;
      if (!target) return;
      l.style.fontSize = "20px";
      const natural = inkWidth(l);
      if (natural) l.style.fontSize = `${(20 * target) / natural}px`;
    };
    fit();
    // The subtitle face may arrive after first paint; measure again once it has.
    document.fonts?.ready.then(fit).catch(() => {});
    const ro = new ResizeObserver(fit);
    ro.observe(m);
    return () => ro.disconnect();
  }, []);

  return (
    // The logotype is 330 px wide on a phone (or the column, if narrower) and 440 px from desktop.
    <div className="flex w-full max-w-[330px] flex-col items-center gap-4 self-start text-night lg:max-w-[440px] lg:gap-5">
      <Link ref={logo} href="/" prefetch={false} aria-label="eternal — home" className="block w-full">
        <Logotype className="h-auto w-full" />
      </Link>
      <p ref={line} className="subtitle whitespace-nowrap text-center uppercase leading-none tracking-[0.02em]" style={{ fontSize: 11 }}>
        {tagline.replace(/\.$/, "")}
      </p>
    </div>
  );
}
