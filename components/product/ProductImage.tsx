import Image, { getImageProps } from "next/image";
import { Mark } from "@/components/ui/Wordmark";
import type { World } from "@/lib/catalogue";

/**
 * A packshot, painted visible straight from the server
 * HTML. Nothing waits for hydration: an image held at opacity 0 does not
 * count as painted, which kept collection LCP at 4.5 s. `priority` (the first
 * row of a grid) loads eagerly at high fetch priority. H4: on any device that
 * can hover, the notes still crossfades in under the pointer, card by card
 * (collection.css); touch-only phones never fetch it. A product without a
 * picture yet shows its colour world and the eternal mark; one with a picture
 * shows nothing behind it, so no colour flashes in before the image.
 * `touchSrc` is what a phone-sized touch screen shows instead (the notes
 * picture): it cannot hover to it, so it opens on it. The query is the
 * exact complement of the hover layer's (collection.css), so any screen that
 * can show the hover layer opens on the bottle. One <picture>, so each
 * device downloads only the frame it shows.
 */
export function ProductImage({
  src,
  hoverSrc = null,
  touchSrc = null,
  alt,
  world,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  fit = "cover",
  className = "",
}: {
  src: string | null;
  hoverSrc?: string | null;
  /** Shown instead of `src` on a phone-sized touch screen. */
  touchSrc?: string | null;
  alt: string;
  world: World;
  /** @deprecated Ignored: a product without a picture shows the mark, never a label. */
  label?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  return (
    <div className={`relative overflow-hidden ${className}`} style={src ? undefined : { backgroundColor: world.bg }}>
      {src ? (
        <>
          {touchSrc ? (
            <picture className="absolute inset-0">
              <source media="(any-hover: none) and (max-width: 1023.98px)" srcSet={getImageProps({ src: touchSrc, alt: "", fill: true, sizes }).props.srcSet} sizes={sizes} />
              <Image src={src} alt={alt} fill sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className={`pimg-lift ${fitClass}`} />
            </picture>
          ) : (
            <Image src={src} alt={alt} fill sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className={`pimg-lift ${fitClass}`} />
          )}
          {hoverSrc && (
            <span className="pimg-hover" aria-hidden="true">
              <Image src={hoverSrc} alt="" fill sizes={sizes} className={`img-hover ${fitClass}`} />
            </span>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ color: world.accent }} {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}>
          <Mark className="h-auto w-[36%] opacity-45" />
        </div>
      )}
    </div>
  );
}
