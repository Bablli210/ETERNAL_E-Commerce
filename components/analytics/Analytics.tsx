"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useRef } from "react";
import { captureAttribution } from "@/lib/client/attribution";
import { ensureQueues, inApp, pageType, trackVital } from "@/lib/client/analytics";

const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;

/**
 * Loads the Meta Pixel and GA4 libraries when their IDs are set (their command
 * queues, with init and the first PageView, come from ensureQueues), stores
 * the landing campaign for checkout, and sends a page view on every client
 * navigation.
 */
export function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);
  useReportWebVitals(trackVital);

  useEffect(() => {
    captureAttribution();
    ensureQueues();
    // GA4 page views come from here, tagged by template, so the first one is not sent by config.
    window.gtag?.("event", "page_view", { page_location: window.location.href, page_path: pathname, page_type: pageType(pathname), in_app: inApp() });
    // ensureQueues sends the first PageView with the pixel's init.
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      {PIXEL && <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />}
      {GA4 && <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`} strategy="afterInteractive" />}
    </>
  );
}
