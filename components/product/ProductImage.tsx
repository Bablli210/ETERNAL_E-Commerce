"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageSlot } from "@/components/ui/Primitives";
import type { World } from "@/lib/catalogue";

/**
 * A packshot on its colour world. G7: it fades in from the colour world once
 * loaded, so there are never grey boxes; a priority image skips the fade and
 * paints visible from the server HTML, because an image at opacity 0 does not
 * count as painted and LCP would wait for hydration. H4: with a second frame,
 * hovering crossfades to it. Falls back to a labelled slot when there is no
 * image yet.
 */
export function ProductImage({
  src,
  hoverSrc = null,
  alt,
  world,
  label = "Bottle on colour world",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  fit = "cover",
  className = "",
}: {
  src: string | null;
  hoverSrc?: string | null;
  alt: string;
  world: World;
  label?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const img = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Images cached before hydration never fire onLoad; check them once mounted.
    if (img.current?.complete && img.current.naturalWidth > 0) {
      const t = window.setTimeout(() => setLoaded(true), 0);
      return () => window.clearTimeout(t);
    }
  }, []);
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: world.bg }}>
      {src ? (
        <>
          <Image ref={img} src={src} alt={alt} fill sizes={sizes} preload={priority} onLoad={() => setLoaded(true)} className={`${priority ? "" : `img-fade ${loaded ? "is-loaded" : ""}`} hover-lift ${fitClass}`} />
          {hoverSrc && <Image src={hoverSrc} alt="" fill sizes={sizes} className={`img-hover ${fitClass}`} aria-hidden="true" />}
        </>
      ) : (
        <ImageSlot label={label} dark={world.dark} className="absolute inset-0" style={{ backgroundColor: world.bg }} />
      )}
    </div>
  );
}
