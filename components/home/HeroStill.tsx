import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { siteImage } from "@/lib/site-images";
import { Film } from "@/components/ui/Film";
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
  // A 3x screen still gets a little over 2x (1200 px, not 1920): it looks the same and is 40% lighter, which brings the ad landing's first paint forward.
  const { props: phoneProps } = getImageProps({ ...common, src: phone, sizes: "(min-width: 1024px) 100vw, (min-resolution: 2.5dppx) 100vw, 130vw" });
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

/**
 * The house film in place of a still: the wide film from lg and the phone crop below, each with its poster and
 * intro, and each loading its clip only on the screens that show it. The posters paint first and the film starts
 * once the page is idle (playbook 3.4).
 */
export function HeroFilm({ hero, film }: { hero: Hero; film: string }) {
  const common = { label: "Hero film", alt: hero.alt, dark: true, priority: true, startWhenIdle: true, sizes: "100vw", placeholderClassName: "slot-corner !border-0 opacity-60", style: { backgroundColor: hero.bg } } as const;
  return (
    <>
      <Film {...common} name={film} media="(min-width: 1024px)" className="absolute inset-0 hidden lg:block" />
      <Film {...common} name={[`${film}-mobile`, film]} media="(max-width: 1023.98px)" className="absolute inset-0 lg:hidden" />
    </>
  );
}
