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
    <div className="flex flex-col items-center gap-[0.9em] self-start text-night" style={{ fontSize: 14 }}>
      <Link ref={logo} href="/" prefetch={false} aria-label="eternal — home" className="block">
        <Logotype className="h-[64px] lg:h-[76px]" />
      </Link>
      <p ref={line} className="subtitle whitespace-nowrap text-center uppercase leading-none tracking-[0.02em]" style={{ fontSize: 11 }}>
        {tagline.replace(/\.$/, "")}
      </p>
    </div>
  );
}
