"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { trackWhatsApp, whatsappHref } from "./WhatsAppLink";

/** A product page's title starts with the scent ("Wayne — eterno, for him — eternal"). */
const scentOnPage = (pathname: string) => (pathname.startsWith("/products/") ? document.title.split(" — ")[0].trim() || null : null);

/** Anything a visitor taps to buy or choose; the float must never sit on one of these. */
const CONTROL = "button, .btn, input, select, textarea, summary, [role=button]";

/** True when one of the float's corners or its centre lies over a button on the page. */
function coversControl(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const points = [[r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4], [r.left + r.width / 2, r.top + r.height / 2]];
  return points.some(([x, y]) => document.elementsFromPoint(x, y).some((n) => !el.contains(n) && n.closest(CONTROL)));
}

/**
 * Bottom-right, after 3 s. chrome.css places it above any sticky bar and hides
 * it while a dialog, the keyboard, the toast or the product page's own Add to
 * bag button needs that space. It also steps aside whenever the page comes to
 * rest with a button under it, such as a grid card's Add to bag on a phone, so
 * a tap meant for the bag never opens WhatsApp. Renders nothing until a number is set.
 */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 3000);
    return () => window.clearTimeout(t);
  }, []);
  // Checked once scrolling settles, so it costs nothing while the page moves.
  useEffect(() => {
    if (!show) return;
    let t = 0;
    const check = () => {
      const el = ref.current;
      if (el) el.toggleAttribute("data-covering", coversControl(el));
    };
    const settle = () => {
      window.clearTimeout(t);
      t = window.setTimeout(check, 120);
    };
    settle();
    window.addEventListener("scroll", settle, { passive: true });
    window.addEventListener("resize", settle);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", settle);
      window.removeEventListener("resize", settle);
    };
  }, [show, pathname]);
  const href = whatsappHref();
  if (!href || !show) return null;

  // The message names the scent on screen, read at tap time so it follows client navigations.
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const scent = scentOnPage(pathname);
    e.currentTarget.href = whatsappHref(scent ? `Hello eternal, I'm looking at ${scent} and have a question.` : "Hello eternal, I have a question about a scent.") ?? href;
    trackWhatsApp(scent ?? pathname);
  };

  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ask us on WhatsApp"
      className="wa-float fade-enter pulse-once fixed right-4 z-[50] flex h-12 w-12 items-center justify-center bg-night text-linen hover:bg-sea lg:right-8"
    >
      <Icon name="whatsapp" size={22} />
    </a>
  );
}
