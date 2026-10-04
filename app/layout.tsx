import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { tales } from "@/content/tales";
import { getBestsellers, getNewArrivals, getScentIndex, toIndexEntry } from "@/lib/catalogue";
import { checkoutDomain } from "@/lib/shopify/client";
import { siteImage } from "@/lib/site-images";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { WhatsAppFloat } from "@/components/chrome/WhatsAppFloat";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { Toast } from "@/components/cart/Toast";
import { MotionScript } from "@/components/motion/MotionScript";
import { Loader } from "@/components/motion/Loader";
import { PageFade } from "@/components/motion/PageFade";
import { Analytics } from "@/components/analytics/Analytics";

/*
 * display "optional": the fonts are preloaded, so they are almost always in
 * time; a slow first visit keeps the fallback for that page view instead of
 * reflowing the hero under the visitor (the fallbacks, Times New Roman and
 * Arial, are missing on Android, so their metric adjustment does nothing there).
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "optional",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
  display: "optional",
});

const ogImage = siteImage("og-image");

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s — ${site.name}` },
  description: site.description,
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_EG",
    images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: site.tagline }] : undefined,
  },
  robots: { index: true, follow: true },
};

/** viewportFit "cover" lets fixed bars pad themselves with env(safe-area-inset-*) clear of the notch and home indicator. */
export const viewport: Viewport = { themeColor: "#f3efe7", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [index, bestsellers, newArrivals] = await Promise.all([getScentIndex(), getBestsellers(4), getNewArrivals(1)]);
  const featured = {
    bestseller: bestsellers[0] ? toIndexEntry(bestsellers[0]) : null,
    newIn: newArrivals[0] ? toIndexEntry(newArrivals[0]) : null,
  };
  const taleIndex = tales.map((t) => ({ slug: t.slug, title: t.title, handle: t.handle, line: t.line }));

  return (
    // data-scroll-behavior: Next 16 suspends the smooth scrolling (globals.css) during route changes only with this opt-in; without it a new page lands part-way down.
    <html lang="en" data-scroll-behavior="smooth" className={`${cormorant.variable} ${instrument.variable}`}>
      <body>
        <MotionScript />
        <Loader />
        <CartProvider>
          <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] bg-night px-4 py-2 text-linen">
            Skip to content
          </a>
          <Header index={index} featured={featured} taleIndex={taleIndex} popular={bestsellers.map(toIndexEntry)} />
          <main id="main">
            <PageFade>{children}</PageFade>
          </main>
          <Footer shopDomain={checkoutDomain} />
          <CartDrawer index={index} />
          <Toast />
          <WhatsAppFloat />
          <RevealObserver />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
