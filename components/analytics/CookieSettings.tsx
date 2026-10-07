"use client";

import { useSyncExternalStore } from "react";
import { openConsent } from "@/lib/client/consent";
import { checkoutFollowsChoice } from "@/lib/consent";

/** Opens the cookie choice again (components/analytics/ConsentBanner.tsx), set to what the visitor chose before. */
export function CookieSettings({ className = "", children = "Cookie settings" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openConsent}>
      {children}
    </button>
  );
}

const noChange = () => () => {};

/**
 * The help page's sentence on checkout, decided in the browser from the visitor's own host, as the banner
 * decides (lib/consent.ts checkoutFollowsChoice): the same page serves every host. The server's HTML says the
 * cautious sentence.
 */
export function CheckoutCookieNote(p: { cookieDomain: string | null; checkoutDomain: string | null; storefrontToken: string | null }) {
  const follows = useSyncExternalStore(
    noChange,
    () => checkoutFollowsChoice(window.location.hostname, p.cookieDomain, p.checkoutDomain, p.storefrontToken),
    () => false,
  );
  return <>{follows ? "Shopify’s checkout follows the same choice; until you make one, it uses Shopify’s own cookie settings." : "Checkout runs on Shopify, under Shopify’s own cookie settings."}</>;
}
