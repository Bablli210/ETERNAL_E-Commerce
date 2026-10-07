"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useRef } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { captureAttribution } from "@/lib/client/attribution";
import { ensureQueues, inApp, pageType, replayPending, takeInitPageView, trackVital } from "@/lib/client/analytics";
import { allowed, useConsent } from "@/lib/client/consent";

const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;
/** Vercel Web Analytics: cookieless page views the team dashboard reads. Set to 1 once Analytics is enabled on the Vercel project. */
const VERCEL = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "1";

const gaPageView = (pathname: string) =>
  window.gtag?.("event", "page_view", { page_location: window.location.href, page_path: pathname, page_type: pageType(pathname), in_app: inApp() });

/**
 * Loads the Meta Pixel and GA4 libraries when their IDs are set and the
 * visitor has said yes to them (marketing for the pixel, analytics for GA4 and
 * Vercel Web Analytics; components/analytics/ConsentBanner.tsx asks). Their
 * command queues, with init and the first PageView, come from ensureQueues.
 * Also stores the landing campaign for checkout, and sends a page view on
 * every client navigation, and once more at the moment a purpose is allowed,
 * so the page the visitor said yes on is counted, with the events that
 * waited for the answer. Each library counts a page once, however the yes
 * arrives (this tab's banner, or another tab's, noticed on focus).
 */
export function Analytics() {
  const pathname = usePathname();
  const consent = useConsent();
  const counted = useRef({ ga: "", meta: "" });
  useReportWebVitals(trackVital);

  const pageView = (path: string) => {
    ensureQueues();
    // The pixel's first PageView comes with its init, whichever call created the queue (a page's own event may have, just before).
    const initPath = takeInitPageView();
    if (allowed("analytics") && counted.current.ga !== path) {
      counted.current.ga = path;
      gaPageView(path);
    }
    if (allowed("marketing") && counted.current.meta !== path) {
      counted.current.meta = path;
      if (initPath !== path) window.fbq?.("track", "PageView");
    }
  };

  useEffect(() => {
    captureAttribution();
    pageView(pathname);
  }, [pathname]);

  // An answer given while on this page: load what it allows, count this page for it, and send what waited.
  const analytics = consent !== "pending" && Boolean(consent?.analytics);
  const marketing = consent !== "pending" && Boolean(consent?.marketing);
  const before = useRef<{ analytics: boolean; marketing: boolean } | null>(null);
  useEffect(() => {
    if (consent === "pending") return;
    const was = before.current;
    before.current = { analytics, marketing };
    if (!was) return;
    if ((analytics && !was.analytics) || (marketing && !was.marketing)) pageView(window.location.pathname);
    if (consent) replayPending();
  }, [consent, analytics, marketing]);

  return (
    <>
      {PIXEL && marketing && <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />}
      {GA4 && analytics && <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`} strategy="afterInteractive" />}
      {VERCEL && analytics && <VercelAnalytics />}
    </>
  );
}
