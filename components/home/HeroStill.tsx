import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { siteImage } from "@/lib/site-images";
import { Film } from "@/components/ui/Film";
import type { Hero } from "@/content/heroes";

/**
 * A hero picture as one <picture>: the phone crop by default and the wide
 * picture from lg. One img element means the browser downloads only the
 * version it shows, eagerly and first. Each version is also preloaded from
 * the head for the screens that show it, so the download starts before the
 * body is parsed.
 */
function HeroPicture({ wide: wideName, phone: phoneName, phoneSizes, alt, className = "" }: { wide: string; phone: string; phoneSizes: string; alt: string; className?: string }) {
  const wide = siteImage(wideName);
  const phone = siteImage(phoneName) ?? wide;
  if (!phone) return null;
  const common = { alt, fill: true } as const;
  const { props: phoneProps } = getImageProps({ ...common, src: phone, sizes: `(min-width: 1024px) 100vw, ${phoneSizes}` });
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

/** A campaign still: hero-<handle>, and hero-<handle>-mobile on a phone. */
export function HeroStill({ hero, className = "" }: { hero: Hero; className?: string }) {
  // On a phone the 1.2:1 crop fills a box a little taller than wide, so it renders about 130% of the screen width.
  // A 3x screen still gets a little over 2x (1200 px, not 1920): it looks the same and is 40% lighter, which brings the ad landing's first paint forward.
  return <HeroPicture wide={`hero-${hero.handle}`} phone={`hero-${hero.handle}-mobile`} phoneSizes="(min-resolution: 2.5dppx) 100vw, 130vw" alt={hero.alt} className={className} />;
}

/**
 * The hero film in place of a still: its poster as the same eager <picture> (the page's first paint), with the wide
 * film from lg and the phone crop below laid over it. Each slot loads its clip only on the screens that show it, and
 * the clips start once the page is idle (playbook 3.4).
 */
export function HeroFilm({ hero, film }: { hero: Hero; film: string }) {
  const common = { label: "Hero film", startWhenIdle: true, still: false, sizes: "100vw" } as const;
  return (
    <>
      {/* The 3:4 phone poster covers the phone's box at about the screen's width. */}
      <HeroPicture wide={film} phone={`${film}-mobile`} phoneSizes="100vw" alt={hero.alt} className="absolute inset-0" />
      <Film {...common} name={film} media="(min-width: 1024px)" className="absolute inset-0 hidden lg:block" />
      <Film {...common} name={[`${film}-mobile`, film]} media="(max-width: 1023.98px)" className="absolute inset-0 lg:hidden" />
    </>
  );
}
