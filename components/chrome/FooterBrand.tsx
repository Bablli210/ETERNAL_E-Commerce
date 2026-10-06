"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

/** The width of the text as drawn, not of its box: a Range around it spans its widest line. */
const inkWidth = (el: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

/**
 * The footer's wordmark set exactly as wide as the tagline under it. The size
 * is measured, not guessed, so it holds for any font and any line the tagline
 * breaks on, and it refits when the tagline's width changes.
 */
export function FooterBrand({ tagline }: { tagline: string }) {
  const mark = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const m = mark.current;
    const l = line.current;
    if (!m || !l) return;
    const fit = () => {
      const target = inkWidth(l);
      if (!target) return;
      m.style.fontSize = "100px";
      const natural = inkWidth(m);
      if (natural) m.style.fontSize = `${(100 * target) / natural}px`;
    };
    fit();
    // The serif may arrive after first paint; measure again once it has.
    document.fonts?.ready.then(fit).catch(() => {});
    const ro = new ResizeObserver(fit);
    ro.observe(l);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Link href="/" prefetch={false} aria-label="eternal — home" className="self-start">
        <span ref={mark} className="serif block whitespace-nowrap font-semibold leading-none tracking-[0.02em] text-night" style={{ fontSize: 56 }}>
          eternal
        </span>
      </Link>
      <p ref={line} className="signature max-w-[24ch] text-ash">
        {tagline}
      </p>
    </div>
  );
}
