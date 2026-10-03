import { getImageProps } from "next/image";
import { preload as preloadResource } from "react-dom";
import { Figure } from "./Figure";
import { BackgroundVideo } from "@/components/motion/BackgroundVideo";
import { siteImage } from "@/lib/site-images";
import { siteVideo } from "@/lib/site-videos";

/**
 * Preloads a still only where its slot shows. A film with a desktop and a
 * mobile crop renders both slots and lets CSS hide one; a plain priority
 * image would preload both on every device, so the phone would download the
 * desktop poster before its own.
 */
function preloadFor(src: string, sizes: string, media: string) {
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  preloadResource(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: "high", media });
}

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
  imageClassName = "",
  dark = false,
  style,
  sizes = "100vw",
  priority = false,
  preload = "auto",
  startWhenIdle = false,
  media,
}: {
  name: string | string[];
  label: string;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  /** Classes for the still and the clip, e.g. an object position for a crop. */
  imageClassName?: string;
  dark?: boolean;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  /** Paint the poster first and start the clip only once the page is idle. */
  startWhenIdle?: boolean;
  /** Only load the clip (and preload the still) when this media query matches, for slots CSS hides. */
  media?: string;
}) {
  // With a media query the preload carries it; the image itself must not preload everywhere.
  const preloadEverywhere = priority && !media;
  for (const n of Array.isArray(name) ? name : [name]) {
    const sources = siteVideo(n);
    const poster = siteImage(n);
    if (sources && poster) {
      if (priority && media) preloadFor(poster, sizes, media);
      return (
        <BackgroundVideo
          sources={sources}
          poster={poster}
          alt={alt}
          className={className}
          imageClassName={imageClassName}
          style={style}
          sizes={sizes}
          priority={preloadEverywhere}
          preload={preload}
          startWhenIdle={startWhenIdle}
          media={media}
        />
      );
    }
  }
  const still = siteImage(name);
  if (still && priority && media) preloadFor(still, sizes, media);
  return (
    <Figure
      name={name}
      label={label}
      alt={alt}
      className={className}
      placeholderClassName={placeholderClassName}
      imageClassName={imageClassName}
      dark={dark}
      style={style}
      sizes={sizes}
      priority={preloadEverywhere}
    />
  );
}
