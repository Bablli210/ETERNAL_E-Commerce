import Link from "next/link";
import { LOGO_BOX } from "@/components/ui/logo-box";

/**
 * The eternal logotype, drawn from the brand sprite the root layout puts in
 * every page (components/ui/BrandSprite.tsx), so the outline is sent once and
 * no client code comes with it. Its name is the brand's, so "eternal
 * Performance" is what a screen reader hears.
 */
export function DashLogotype() {
  const { w, h } = LOGO_BOX.eternal;
  return (
    <svg className="dash-logo" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="eternal" focusable="false">
      <use href="#brand-eternal" />
    </svg>
  );
}

/** The logotype with "Performance" beside it, as the old page set them. */
export function DashBrand({ link = true }: { link?: boolean }) {
  const inner = (
    <>
      <DashLogotype />
      <span>Performance</span>
    </>
  );
  return link ? (
    <Link href="/dashboard" prefetch={false} className="dash-brand">
      {inner}
    </Link>
  ) : (
    <p className="dash-brand">{inner}</p>
  );
}

/**
 * The bar over every signed-in page: the brand, the period switch and
 * freshness line when the page has them, and the person's controls. Sticky
 * from tablet width on a screen at least 600 px tall; on a phone, upright or
 * sideways, it would cover too much, so it scrolls away and leaves the screen
 * to the figures.
 */
export function TopBar({ period, toolbar }: { period?: React.ReactNode; toolbar?: React.ReactNode }) {
  return (
    <>
      <a className="dash-skip" href="#dash-main">
        Skip to content
      </a>
      <header className="dash-top">
        <div className={`dash-top-in${period ? " has-period" : ""}`}>
          <DashBrand />
          {/* In the order of the wide, one-row layout; below 1280 px the period moves under the controls, and reading-flow (where supported) follows. */}
          {period ? <div className="dash-period">{period}</div> : null}
          {toolbar ? <div className="dash-tools">{toolbar}</div> : null}
        </div>
      </header>
    </>
  );
}
