"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
 * Runs `start` once the page has finished loading and the main thread is
 * idle, so the poster, the fonts and the first tap never compete with the
 * film for a phone's bandwidth.
 */
function useStartWhenIdle(start: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let idle = 0;
    let timer = 0;
    const whenIdle = () => {
      // Safari before 18 has no requestIdleCallback.
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 2500 });
      else timer = window.setTimeout(start, 600);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
    return () => {
      window.removeEventListener("load", whenIdle);
      if (idle) window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, [start, enabled]);
}

/** Starts a clip muted, buffering it fully; a refusal (autoplay off, low-power mode) leaves whatever shows now. */
function play(video: HTMLVideoElement | null) {
  if (!video) return Promise.resolve(false);
  video.muted = true;
  video.preload = "auto";
  return video.play().then(
    () => true,
    () => false,
  );
}

function Sources({ sources }: { sources: VideoSources }) {
  return (
    <>
      {sources.webm && <source src={sources.webm} type="video/webm" />}
      {sources.mp4 && <source src={sources.mp4} type="video/mp4" />}
    </>
  );
}

/**
 * A silent looping film behind page content, with the still underneath it.
 *
 * The poster is a real `next/image`, so it is what loads, what the visitor
 * sees while the clip buffers, and what stays when motion is off. The film
 * fades in over it once it is actually playing, which is why the clip's first
 * frame and the poster have to be the same frame.
 *
 * With an `intro`, that clip plays once first and the loop takes over when it
 * ends: the intro's last frame is the loop's first (and the poster), so the
 * hand-over cannot be seen. The loop buffers while the intro plays.
 */
export function BackgroundVideo({
  sources,
  intro = null,
  poster,
  alt = "",
  className = "",
  style,
  sizes = "100vw",
  priority = false,
  preload = "auto",
  startWhenIdle = false,
  media,
  imageClassName = "",
}: {
  sources: VideoSources;
  /** A clip that plays once before the loop; its last frame is the loop's first. */
  intro?: VideoSources | null;
  poster: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  /** Fetch nothing of the clip until the page is idle, then start it (the hero). */
  startWhenIdle?: boolean;
  /** Only load the clip when this media query matches, for slots CSS hides. */
  media?: string;
  /** Classes for the poster and the clip together, e.g. an object position. */
  imageClassName?: string;
}) {
  const playable = usePlayable(media);
  const [playing, setPlaying] = useState(false);
  // Whether the loop has taken over from the intro (from the start when there is none).
  const [looping, setLooping] = useState(!intro);
  const introRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const toLoop = useCallback(() => void play(loopRef.current), []);
  const start = useCallback(() => {
    if (!intro) return void play(loopRef.current);
    // An intro that cannot play at all (no format this browser takes) goes straight to the loop.
    play(introRef.current).then((ok) => {
      if (!ok && introRef.current?.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) toLoop();
    });
  }, [intro, toLoop]);
  useStartWhenIdle(start, startWhenIdle && playable);
  // Without the idle wait, an intro is started here rather than by autoplay, so a clip no browser format suits still hands over.
  useEffect(() => {
    if (playable && intro && !startWhenIdle) start();
  }, [playable, intro, startWhenIdle, start]);
  // Only add `relative` when the caller has not already positioned the box.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);
  // Inset by 1 px so a clip is always a hair smaller than the poster: otherwise sub-pixel rounding can make it the
  // larger paint, and LCP would move to whenever the clip starts.
  const clip = `bg-video absolute inset-px h-[calc(100%-2px)] w-[calc(100%-2px)] object-cover ${imageClassName} ${playing ? "is-playing" : ""}`;
  return (
    <div className={`${positioned ? "" : "relative"} overflow-hidden ${className}`} style={style}>
      <Image src={poster} alt={alt} fill sizes={sizes} preload={priority} className={`object-cover ${imageClassName}`} />
      {playable && (
        <video
          ref={loopRef}
          className={clip}
          autoPlay={!intro && !startWhenIdle}
          muted
          loop
          playsInline
          preload={intro || startWhenIdle ? "none" : preload}
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => {
            setPlaying(true);
            setLooping(true);
          }}
        >
          <Sources sources={sources} />
        </video>
      )}
      {playable && intro && !looping && (
        // Above the loop until the loop is playing; its last frame holds while the loop starts.
        <video
          ref={introRef}
          className={clip}
          muted
          playsInline
          preload={startWhenIdle ? "none" : preload}
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => {
            setPlaying(true);
            // Buffer the loop now, so it is ready when the intro ends.
            const loop = loopRef.current;
            if (loop && loop.preload !== "auto") {
              loop.preload = "auto";
              loop.load();
            }
          }}
          onEnded={toLoop}
        >
          <Sources sources={intro} />
        </video>
      )}
    </div>
  );
}
