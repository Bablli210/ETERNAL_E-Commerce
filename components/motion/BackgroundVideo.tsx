"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motionAllowed } from "@/lib/motion";
import type { VideoSources } from "@/lib/site-videos";

function watch(media: string | undefined, cb: () => void) {
  const queries = [window.matchMedia("(prefers-reduced-motion: reduce)")];
  if (media) queries.push(window.matchMedia(media));
  for (const q of queries) q.addEventListener("change", cb);
  // The site's own Motion on/off switch writes data-motion onto <html>.
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    for (const q of queries) q.removeEventListener("change", cb);
    observer.disconnect();
  };
}

/**
 * Whether a background film may play. False on the server and during
 * hydration, so the poster is what renders first either way, and false for
 * the rest of the visit under prefers-reduced-motion or with motion switched
 * off — the element is never mounted, so it is never started and never has to
 * be paused. A data saver or a slow connection no longer holds it back, at the
 * owner's request: the phone clips are small (about half a megabyte in all)
 * and only start once the page is idle. `media` keeps a slot that CSS has
 * hidden from downloading its clip: the desktop and mobile crops of one film
 * cost one download, not two.
 */
function usePlayable(media?: string): boolean {
  const subscribe = useCallback((cb: () => void) => watch(media, cb), [media]);
  return useSyncExternalStore(
    subscribe,
    () => motionAllowed() && (!media || window.matchMedia(media).matches),
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

/** Starts a clip muted, buffering it fully; resolves false on a refusal (autoplay off, iOS Low Power Mode). */
function play(video: HTMLVideoElement | null) {
  if (!video) return Promise.resolve(false);
  video.muted = true;
  video.preload = "auto";
  return video.play().then(
    () => true,
    () => false,
  );
}

/** The gestures that let a page start a video the browser refused to autoplay. */
const GESTURES = ["pointerup", "touchend", "click", "keydown"] as const;

/** WebM first, then MP4. `onNone` fires on the last one's error: with <source> children, that is how a clip with no format this browser plays reports it (play() then never settles). */
function Sources({ sources, onNone }: { sources: VideoSources; onNone?: () => void }) {
  return (
    <>
      {sources.webm && <source src={sources.webm} type="video/webm" onError={sources.mp4 ? undefined : onNone} />}
      {sources.mp4 && <source src={sources.mp4} type="video/mp4" onError={onNone} />}
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
 * hand-over cannot be seen. The loop buffers while the intro plays. An intro
 * that cannot play, or breaks off, hands over to the loop at once.
 *
 * `poster={null}` leaves the still to the caller (the home hero paints one
 * <picture> for both of its slots), so only the clip is drawn here.
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
  clipFlush = false,
}: {
  sources: VideoSources;
  /** A clip that plays once before the loop; its last frame is the loop's first. */
  intro?: VideoSources | null;
  poster: string | null;
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
  /**
   * Inset the clip only on its right and bottom edges. For a box that can fill the whole screen (the home hero), where
   * Chrome counts neither the poster nor a clip that also fills it for LCP; an all-round inset would leave the clip,
   * alone, eligible.
   */
  clipFlush?: boolean;
}) {
  const playable = usePlayable(media);
  const [playing, setPlaying] = useState(false);
  // Whether the loop has taken over from the intro (from the start when there is none).
  const [looping, setLooping] = useState(!intro);
  // Motion switched off (or the slot's media query lost) unmounts the clips: when they come back they fade in again.
  const [wasPlayable, setWasPlayable] = useState(playable);
  if (wasPlayable !== playable) {
    setWasPlayable(playable);
    if (!playable) setPlaying(false);
  }
  const introRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  // Set when the intro turns out to have no format this browser plays; that is known at mount, before the film may start.
  const introDead = useRef(false);
  const started = useRef(false);
  // A refused start (iOS Low Power Mode, some in-app browsers) is tried again at the visitor's first tap or key, which
  // the browser counts as permission; this undoes the waiting listeners.
  const unarm = useRef<(() => void) | null>(null);
  const playClip = useCallback((video: HTMLVideoElement | null) => {
    void play(video).then((ok) => {
      if (ok || !video) return;
      unarm.current?.();
      const again = () => {
        unarm.current?.();
        void play(video);
      };
      for (const g of GESTURES) window.addEventListener(g, again, { capture: true, passive: true });
      unarm.current = () => {
        for (const g of GESTURES) window.removeEventListener(g, again, { capture: true });
        unarm.current = null;
      };
    });
  }, []);
  useEffect(() => () => unarm.current?.(), []);
  const toLoop = useCallback(() => playClip(loopRef.current), [playClip]);
  // The intro while it is mounted and playable; once the loop has taken over (or after motion comes back on), the loop.
  const start = useCallback(() => {
    started.current = true;
    playClip(introDead.current ? loopRef.current : (introRef.current ?? loopRef.current));
  }, [playClip]);
  // A phone pauses the film when the visitor switches apps or locks the screen, and Safari can pause a muted film it
  // started that scrolls out of view: once the page and the film are back in sight, it plays on.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playable) return;
    const resume = () => {
      if (!started.current || document.visibilityState !== "visible") return;
      const clip = introRef.current && !introDead.current ? introRef.current : loopRef.current;
      if (clip && clip.paused && !clip.ended) playClip(clip);
    };
    const seen = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && resume());
    if (box.current) seen.observe(box.current);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
    return () => {
      seen.disconnect();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
    };
  }, [playable, playClip]);
  // No intro format plays here: before the start, the loop simply goes first; after it, the loop takes over now.
  const introNone = useCallback(() => {
    introDead.current = true;
    if (started.current) toLoop();
  }, [toLoop]);
  useStartWhenIdle(start, startWhenIdle && playable);
  // Without the idle wait, a film with an intro starts here: neither clip autoplays, so the loop never races the intro.
  useEffect(() => {
    if (playable && intro && !startWhenIdle) start();
  }, [playable, intro, startWhenIdle, start]);
  // Only add `relative` when the caller has not already positioned the box.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);
  // Inset by 1 px so a clip is always a hair smaller than the poster: otherwise sub-pixel rounding can make it the
  // larger paint, and LCP would move to whenever the clip starts.
  const clip = `bg-video absolute ${clipFlush ? "left-0 top-0 h-[calc(100%-1px)] w-[calc(100%-1px)]" : "inset-px h-[calc(100%-2px)] w-[calc(100%-2px)]"} object-cover ${imageClassName} ${playing ? "is-playing" : ""}`;
  return (
    <div ref={box} className={`${positioned ? "" : "relative"} overflow-hidden ${className}`} style={style}>
      {poster && <Image src={poster} alt={alt} fill sizes={sizes} preload={priority} className={`object-cover ${imageClassName}`} />}
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
          // A decode or network failure of the intro itself. React also hands this handler the <source> elements'
          // errors (a WebM a Safari skips by type), which are not failures: the next source is tried.
          onError={(e) => {
            if (e.target === e.currentTarget) toLoop();
          }}
        >
          <Sources sources={intro} onNone={introNone} />
        </video>
      )}
    </div>
  );
}
