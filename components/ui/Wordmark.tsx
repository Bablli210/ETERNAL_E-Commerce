import Link from "next/link";

/** The wordmark: lowercase serif, clear space the height of the e. */
export function Wordmark({ className = "", href = "/", inverted = false }: { className?: string; href?: string; inverted?: boolean }) {
  return (
    <Link href={href} aria-label="eternal — home" className={`serif inline-flex items-baseline text-[28px] font-semibold tracking-[0.02em] leading-none ${inverted ? "text-linen" : "text-night"} ${className}`}>
      eternal
    </Link>
  );
}

/** The e∞ mark, traced from the eterno label — used inverted on Night for loaders and empty states. */
export function Mark({ size = 48, className = "", draw = false }: { size?: number; className?: string; draw?: boolean }) {
  return (
    <svg width={size} height={size / 2} viewBox="0 0 96 48" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${draw ? "draw" : ""} ${className}`}>
      {/* One stroke, as printed on the eterno label: an e whose bar slants up to close its eye,
          its tail running through an S into the same e turned 180°. */}
      <path pathLength={1} d="M22.65 23.6L39.9 13.4C39.4 11 36.2 10.1 31.65 10.1C24.6 10.1 18.9 16.15 18.9 23.6C18.9 31.2 25.6 37.4 33.9 37.4C43.4 37.4 45.99 28.02 48 24C50.01 19.98 52.6 10.6 62.1 10.6C70.4 10.6 77.1 16.8 77.1 24.4C77.1 31.85 71.4 37.9 64.35 37.9C59.8 37.9 56.6 37 56.1 34.6L73.35 24.4" />
    </svg>
  );
}
