"use client";

import { openConsent } from "@/lib/client/consent";

/** Opens the cookie choice again (components/analytics/ConsentBanner.tsx), set to what the visitor chose before. */
export function CookieSettings({ className = "", children = "Cookie settings" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openConsent}>
      {children}
    </button>
  );
}
