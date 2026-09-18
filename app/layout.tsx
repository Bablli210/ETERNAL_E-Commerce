import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { tales } from "@/content/tales";
import { getBestsellers, getNewArrivals, getScentIndex, toIndexEntry } from "@/lib/catalogue";
import { storeDomain } from "@/lib/shopify/client";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { WhatsAppFloat } from "@/components/chrome/WhatsAppFloat";
import { RevealObserver } from "@/components/ui/RevealObserver";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s — ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_EG" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#f3efe7", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [index, bestsellers, newArrivals] = await Promise.all([getScentIndex(), getBestsellers(4), getNewArrivals(1)]);
  const featured = {
    bestseller: bestsellers[0] ? toIndexEntry(bestsellers[0]) : null,
    newIn: newArrivals[0] ? toIndexEntry(newArrivals[0]) : null,
  };
  const taleIndex = tales.map((t) => ({ slug: t.slug, title: t.title, handle: t.handle, line: t.line }));

  return (
    <html lang="en" className={`${cormorant.variable} ${instrument.variable}`}>
      <body>
        <CartProvider>
          <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] bg-night px-4 py-2 text-linen">
            Skip to content
          </a>
          <Header index={index} featured={featured} taleIndex={taleIndex} popular={bestsellers.map(toIndexEntry)} />
          <main id="main">{children}</main>
          <Footer storeDomain={storeDomain} />
          <CartDrawer index={index} />
          <WhatsAppFloat />
          <RevealObserver />
        </CartProvider>
      </body>
    </html>
  );
}
