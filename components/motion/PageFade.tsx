"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { inApp } from "@/lib/client/analytics";

/**
 * G2 · cross-fade of the page body between routes; the header outside stays put.
 * Never on the page a visit lands on (an ad landing and its main image paint at
 * full opacity, playbook 7.1), and never inside Instagram's or Facebook's
 * browser, where every visit is an ad visit. Later client navigations fade.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [seen, setSeen] = useState(pathname);
  const [navigated, setNavigated] = useState(false);
  // Adjusted during render, per React's guidance; only a client navigation changes the path.
  if (seen !== pathname) {
    setSeen(pathname);
    setNavigated(true);
  }
  return (
    <div key={pathname} className={navigated && !inApp() ? "page-enter" : undefined}>
      {children}
    </div>
  );
}
