"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { trackWhatsApp, whatsappHref } from "./WhatsAppLink";

/** A product page's title starts with the scent ("Wayne — eterno, for him — eternal"). */
const scentOnPage = (pathname: string) => (pathname.startsWith("/products/") ? document.title.split(" — ")[0].trim() || null : null);

/**
 * Bottom-right, after 3 s. chrome.css places it above any sticky bar and hides
 * it while a dialog, the keyboard, the toast or the product page's own Add to
 * bag button needs that space. Renders nothing until a number is set.
 */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 3000);
    return () => window.clearTimeout(t);
  }, []);
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
