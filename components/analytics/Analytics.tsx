"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useRef } from "react";
import { captureAttribution } from "@/lib/client/attribution";
import { inApp, pageType, trackVital } from "@/lib/client/analytics";

const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;

/** gtag's own queue: commands wait in the data layer until gtag.js loads. */
function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js reads an Arguments object, not an array.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
  void args;
}

/**
 * Loads the Meta Pixel and GA4 when their IDs are set, stores the landing
 * campaign for checkout, and sends a page view on every client navigation
 * (the pixel's base code only sends the first one).
 */
export function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);
  useReportWebVitals(trackVital);

  useEffect(() => {
    captureAttribution();
    // GA4 page views come from here, tagged by template, so the first one is not sent by config.
    if (GA4) gtag("event", "page_view", { page_location: window.location.href, page_path: pathname, page_type: pageType(pathname), in_app: inApp() });
    // The pixel's base code sends the first PageView itself.
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      {PIXEL && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}
        </Script>
      )}
      {GA4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4}',{send_page_view:false});`}
          </Script>
        </>
      )}
    </>
  );
}
