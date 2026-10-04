import "server-only";
import type { Metadata } from "next";
import { site } from "@/content/site";
import { siteImage } from "./site-images";

type PageMeta = {
  /** The page's own title; the layout's template adds " — eternal" unless `absolute`. */
  title: string;
  absolute?: boolean;
  description: string;
  /** The canonical path, also the preview's URL. */
  path: string;
  /** A picture for link previews (WhatsApp, Instagram DMs, Facebook, X); the house's og-image when none. */
  image?: string | null;
  imageAlt?: string;
  noindex?: boolean;
};

const fallback = siteImage("og-image");

/**
 * Title, description, canonical link and the link preview (Open Graph and X)
 * for one page, set the same way everywhere. A page's openGraph replaces the
 * layout's whole, so every page sets all of it through here.
 */
export function pageMeta({ title, absolute = false, description, path, image, imageAlt, noindex = false }: PageMeta): Metadata {
  const full = absolute ? title : `${title} — ${site.name}`;
  const own = image ?? null;
  const images = own ? [{ url: own, alt: imageAlt ?? full }] : fallback ? [{ url: fallback, width: 1200, height: 630, alt: site.tagline }] : undefined;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { siteName: site.name, locale: "en_EG", type: "website", url: path, title: full, description, images },
    twitter: { card: "summary_large_image", title: full, description, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
