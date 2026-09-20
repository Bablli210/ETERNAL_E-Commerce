"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";
import { motionAllowed } from "@/lib/motion";
import type { VideoSources } from "@/lib/site-videos";

type Connection = { saveData?: boolean; effectiveType?: string };

const connection = () => (navigator as Navigator & { connection?: Connection & Partial<EventTarget> }).connection;

/** True on a metered or very slow connection, where a background film is not worth the bytes. */
function sparing(): boolean {
  const c = connection();
  if (!c) return false;
  return Boolean(c.saveData) || c.effectiveType === "slow-2g" || c.effectiveType === "2g";
}

function watch(media: string | undefined, cb: () => void) {
  const queries = [window.matchMedia("(prefers-reduced-motion: reduce)")];
  if (media) queries.push(window.matchMedia(media));
  for (const q of queries) q.addEventListener("change", cb);
  // The site's own Motion on/off switch writes data-motion onto <html>.
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  const c = connection();
  c?.addEventListener?.("change", cb);
  return () => {
    for (const q of queries) q.removeEventListener("change", cb);
    observer.disconnect();
    c?.removeEventListener?.("change", cb);
  };
}

/**
 * Whether a background film may play. False on the server and during
 * hydration, so the poster is what renders first either way, and false for
 * the rest of the visit under prefers-reduced-motion or with motion switched
 * off — the element is never mounted, so it is never started and never has to
 * be paused. `media` keeps a slot that CSS has hidden from downloading its
 * clip: the desktop and mobile crops of one film cost one download, not two.
 */
function usePlayable(media?: string): boolean {
  const subscribe = useCallback((cb: () => void) => watch(media, cb), [media]);
  return useSyncExternalStore(
    subscribe,
    () => motionAllowed() && !sparing() && (!media || window.matchMedia(media).matches),
    () => false,
  );
}

/**
 * A silent looping film behind page content, with the still underneath it.
 *
 * The poster is a real `next/image`, so it is what loads, what the visitor
 * sees while the clip buffers, and what stays when motion is off. The film
 * fades in over it once it is actually playing, which is why the clip's first
 * frame and the poster have to be the same frame.
 */
export function BackgroundVideo({
  sources,
  poster,
  alt = "",
  className = "",
  style,
  sizes = "100vw",
  priority = false,
  preload = "auto",
  media,
}: {
  sources: VideoSources;
  poster: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  /** Only load the clip when this media query matches, for slots CSS hides. */
  media?: string;
}) {
  const playable = usePlayable(media);
  const [playing, setPlaying] = useState(false);
  // Only add `relative` when the caller has not already positioned the box.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);
  return (
    <div className={`${positioned ? "" : "relative"} overflow-hidden ${className}`} style={style}>
      <Image src={poster} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      {playable && (
        <video
          className={`bg-video absolute inset-0 h-full w-full object-cover ${playing ? "is-playing" : ""}`}
          autoPlay
          muted
          loop
          playsInline
          preload={preload}
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
        >
          {sources.webm && <source src={sources.webm} type="video/webm" />}
          {sources.mp4 && <source src={sources.mp4} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}
