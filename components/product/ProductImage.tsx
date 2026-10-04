import Image from "next/image";
import { Mark } from "@/components/ui/Wordmark";
import type { World } from "@/lib/catalogue";

/**
 * A packshot on its colour world, painted visible straight from the server
 * HTML. Nothing waits for hydration: an image held at opacity 0 does not
 * count as painted, which kept collection LCP at 4.5 s. `priority` (the first
 * row of a grid) loads eagerly at high fetch priority. H4: on any device that
 * can hover, the notes still crossfades in under the pointer, card by card
 * (collection.css); touch-only phones never fetch it. A product without a
 * picture yet shows its colour world and the eternal mark.
 */
export function ProductImage({
  src,
  hoverSrc = null,
  alt,
  world,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  fit = "cover",
  className = "",
}: {
  src: string | null;
  hoverSrc?: string | null;
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
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: world.bg }}>
      {src ? (
        <>
          <Image src={src} alt={alt} fill sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className={`pimg-lift ${fitClass}`} />
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
