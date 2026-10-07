import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/content/site";
import { tales } from "@/content/tales";
import { getBestsellers, getNewArrivals, getScentIndex, toIndexEntry } from "@/lib/catalogue";
import { checkoutDomain } from "@/lib/shopify/client";
import { siteImage } from "@/lib/site-images";
import { fontVariables } from "./fonts";
import { BrandSprite } from "@/components/ui/BrandSprite";
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
import { ConsentBanner } from "@/components/analytics/ConsentBanner";

const ogImage = siteImage("og-image");

/** Defaults for every page; each page sets its own title, description, canonical and preview through lib/metadata.ts. */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  category: "shopping",
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_EG",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: site.tagline }] : undefined,
  },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.tagline}`, description: site.description, images: ogImage ? [ogImage] : undefined },
  // Prices and order numbers are not phone numbers: iOS must not turn them into call links.
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { title: site.name, statusBarStyle: "default" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
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
    <html lang="en" data-scroll-behavior="smooth" className={fontVariables}>
      <body>
        <BrandSprite />
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
        {/* The public Storefront token is made for browsers; Shopify's consent API needs it to hand the choice to checkout. */}
        <ConsentBanner cookieDomain={process.env.COOKIE_DOMAIN?.trim() || null} checkoutDomain={checkoutDomain} storefrontToken={process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() || null} />
      </body>
    </html>
  );
}
