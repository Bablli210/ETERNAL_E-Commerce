import Image from "next/image";
import { ImageSlot } from "./Primitives";
import { siteImage } from "@/lib/site-images";

/**
 * An image slot that renders the real photograph once the file exists in
 * `public/images/`, and the labelled art-direction placeholder until then.
 *
 * `name` is the file's base name without an extension, or a list of names to
 * try in order. `label` is the art direction, shown in the placeholder.
 * `alt` is the real alternative text: leave it empty for images that sit
 * behind their own link or heading, so screen readers are not told twice.
 */
export function Figure({
  name,
  label,
  alt = "",
  className = "",
  placeholderClassName = "",
  dark = false,
  style,
  sizes = "100vw",
  priority = false,
  fit = "cover",
  imageClassName = "",
  ...rest
}: {
  name: string | string[];
  label: string;
  alt?: string;
  className?: string;
  /** Classes that style the placeholder only, dropped once a real image exists. */
  placeholderClassName?: string;
  dark?: boolean;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  imageClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const src = siteImage(name);
  if (!src) return <ImageSlot label={label} dark={dark} className={`${className} ${placeholderClassName}`} style={style} {...rest} />;
  // Only add `relative` when the caller has not already positioned the box.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);
  return (
    <div className={`${positioned ? "" : "relative"} overflow-hidden ${className}`} style={style} {...rest}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`${fit === "cover" ? "object-cover" : "object-contain"} ${imageClassName}`}
      />
    </div>
  );
}
