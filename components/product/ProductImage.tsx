import Image from "next/image";
import { ImageSlot } from "@/components/ui/Primitives";
import type { World } from "@/lib/catalogue";

/** A packshot on its colour world; falls back to a labelled slot when there is no image yet. */
export function ProductImage({
  src,
  alt,
  world,
  label = "Bottle on colour world",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  fit = "cover",
  className = "",
}: {
  src: string | null;
  alt: string;
  world: World;
  label?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: world.bg }}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`hover-lift ${fit === "cover" ? "object-cover" : "object-contain"}`} />
      ) : (
        <ImageSlot label={label} dark={world.dark} className="absolute inset-0" style={{ backgroundColor: world.bg }} />
      )}
    </div>
  );
}
