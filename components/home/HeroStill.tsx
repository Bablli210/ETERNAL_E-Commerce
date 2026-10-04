import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { siteImage } from "@/lib/site-images";
import type { Hero } from "@/content/heroes";

/**
 * The hero's campaign still as one <picture>: the phone crop by default and
 * the wide still from lg. One img element means the browser downloads only
 * the version it shows. Each version is also preloaded from the head for the
 * screens that show it, so the download starts before the body is parsed.
 */
export function HeroStill({ hero, className = "" }: { hero: Hero; className?: string }) {
  const wide = siteImage(`hero-${hero.handle}`);
  const phone = siteImage(`hero-${hero.handle}-mobile`) ?? wide;
  if (!phone) return null;
  const common = { alt: hero.alt, fill: true } as const;
  // On a phone the 1.2:1 crop fills a box a little taller than wide, so it renders about 130% of the screen width.
  const { props: phoneProps } = getImageProps({ ...common, src: phone, sizes: "(min-width: 1024px) 100vw, 130vw" });
  const desktop = wide ? getImageProps({ ...common, src: wide, sizes: "100vw" }).props : null;
  const PHONE = desktop ? "(max-width: 1023.98px)" : undefined;
  preload(phoneProps.src, { as: "image", imageSrcSet: phoneProps.srcSet, imageSizes: phoneProps.sizes, fetchPriority: "high", media: PHONE });
  if (desktop) preload(desktop.src, { as: "image", imageSrcSet: desktop.srcSet, imageSizes: desktop.sizes, fetchPriority: "high", media: "(min-width: 1024px)" });
  return (
    <picture className={className}>
      {desktop && <source media="(min-width: 1024px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- the next/image props above carry the alt and the optimised srcset. */}
      <img {...phoneProps} loading="eager" fetchPriority="high" className="object-cover" />
    </picture>
  );
}
