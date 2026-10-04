"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { motionAllowed } from "@/lib/motion";
import { afterPanelBack } from "@/components/chrome/useModal";
import { MARK_ASPECT, MARK_FILL, MARK_LINE, MARK_LINE_WIDTH, MARK_VIEWBOX } from "./mark-path";

/**
 * The wordmark: lowercase serif, clear space the height of the e. 24 px in the 56 px phone header, 28 px on desktop.
 *
 * Tapping it on the page it links to goes back to the top, as a logo does everywhere (a Next link to the
 * page already open does not scroll). It never prefetches: that would fetch the home page, and with it the
 * hero's preloaded still, on every page the header or footer shows.
 */
export function Wordmark({
  className = "",
  href = "/",
  inverted = false,
  replace = false,
  onClick,
}: {
  className?: string;
  href?: string;
  inverted?: boolean;
  /** For a wordmark inside a panel that owns a history entry (the phone menu). */
  replace?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    const here = window.location.pathname === href && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);
    if (here) e.preventDefault();
    onClick?.(e);
    if (here) afterPanelBack(() => window.scrollTo({ top: 0, behavior: motionAllowed() ? "smooth" : "auto" }));
  };
  return (
    <Link href={href} prefetch={false} replace={replace} onClick={click} aria-label="eternal — home" className={`serif inline-flex min-h-11 items-center text-[24px] font-semibold tracking-[0.02em] leading-none lg:text-[28px] ${inverted ? "text-linen" : "text-night"} ${className}`}>
      eternal
    </Link>
  );
}

/**
 * The mark (components/ui/mark-path.ts), filled in currentColor. `size` is its width. With `draw`, its
 * centre-line draws in and the filled mark settles over it (motion.css); with motion off, it simply shows.
 */
export function Mark({ size = 48, className = "", draw = false }: { size?: number; className?: string; draw?: boolean }) {
  return (
    <svg width={size} height={Math.round((size / MARK_ASPECT) * 10) / 10} viewBox={MARK_VIEWBOX} aria-hidden="true" className={`${draw ? "draw" : ""} ${className}`}>
      {draw && <path className="mark-line" pathLength={1} d={MARK_LINE} fill="none" stroke="currentColor" strokeWidth={MARK_LINE_WIDTH} strokeLinecap="round" strokeLinejoin="round" />}
      <path className="mark-fill" d={MARK_FILL} fill="currentColor" />
    </svg>
  );
}
