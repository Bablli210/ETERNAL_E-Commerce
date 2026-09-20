import { Figure } from "./Figure";
import { BackgroundVideo } from "@/components/motion/BackgroundVideo";
import { siteImage } from "@/lib/site-images";
import { siteVideo } from "@/lib/site-videos";

/**
 * An image slot that plays a looping film once the clip exists.
 *
 * `name` is the base name shared by the clip and its poster: `home-hero`
 * reads `public/videos/home-hero.{webm,mp4}` and `public/images/home-hero.*`.
 * A name only becomes a film when both are present, so the poster and the
 * first frame can never disagree. With no clip this is exactly `Figure`: the
 * still if it exists, the labelled placeholder if it does not.
 */
export function Film({
  name,
  label,
  alt = "",
  className = "",
  placeholderClassName = "",
  dark = false,
  style,
  sizes = "100vw",
  priority = false,
  preload = "auto",
  media,
}: {
  name: string | string[];
  label: string;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  dark?: boolean;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  /** Only load the clip when this media query matches, for slots CSS hides. */
  media?: string;
}) {
  for (const n of Array.isArray(name) ? name : [name]) {
    const sources = siteVideo(n);
    const poster = siteImage(n);
    if (sources && poster) {
      return (
        <BackgroundVideo
          sources={sources}
          poster={poster}
          alt={alt}
          className={className}
          style={style}
          sizes={sizes}
          priority={priority}
          preload={preload}
          media={media}
        />
      );
    }
  }
  return (
    <Figure
      name={name}
      label={label}
      alt={alt}
      className={className}
      placeholderClassName={placeholderClassName}
      dark={dark}
      style={style}
      sizes={sizes}
      priority={priority}
    />
  );
}
