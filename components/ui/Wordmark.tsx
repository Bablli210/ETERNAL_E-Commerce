import Link from "next/link";

/** The wordmark: lowercase serif, clear space the height of the e. */
export function Wordmark({ className = "", href = "/", inverted = false }: { className?: string; href?: string; inverted?: boolean }) {
  return (
    <Link href={href} aria-label="eternal — home" className={`serif inline-flex items-baseline text-[28px] font-semibold tracking-[0.02em] leading-none ${inverted ? "text-linen" : "text-night"} ${className}`}>
      eternal
    </Link>
  );
}

/** The e∞ mark — used inverted on Night for loaders and empty states. */
export function Mark({ size = 48, className = "", draw = false }: { size?: number; className?: string; draw?: boolean }) {
  return (
    <svg width={size} height={size / 2} viewBox="0 0 96 48" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true" className={`${draw ? "draw" : ""} ${className}`}>
      <path pathLength={1} d="M30 24c0 8-5.4 14-13 14S4 32 4 24s5.4-14 13-14c5 0 8.5 2.6 11 7" />
      <path pathLength={1} d="M8 22h20" />
      <path pathLength={1} d="M92 24c0 7-4.5 12-10 12-9 0-13-24-22-24-5.5 0-10 5-10 12s4.5 12 10 12c9 0 13-24 22-24 5.5 0 10 5 10 12Z" />
    </svg>
  );
}
