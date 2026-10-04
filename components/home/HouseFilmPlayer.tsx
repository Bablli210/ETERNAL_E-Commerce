"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { VideoSources } from "@/lib/site-videos";

/**
 * The house film loads only on tap: the clip sits under its poster with
 * preload="none", so nothing of it downloads until the tap, and play() runs
 * inside the tap itself, which is what lets iOS start it with sound. With no
 * clip in public/videos yet, the poster is a plain link to the house page with
 * no play button, so nothing promises a film that is not there.
 */
export function HouseFilmPlayer({ sources, poster, className = "" }: { sources: VideoSources | null; poster: ReactNode; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  if (!sources) {
    return (
      <div className={`group ${className}`}>{poster}</div>
    );
  }
  const play = () => {
    setPlaying(true);
    ref.current?.play().catch(() => {
      /* refused: the controls are showing, so a second tap plays it */
    });
  };
  return (
    <div className={`group ${className}`}>
      <video ref={ref} className="absolute inset-0 h-full w-full bg-night object-cover" controls={playing} playsInline preload="none">
        {sources.webm && <source src={sources.webm} type="video/webm" />}
        {sources.mp4 && <source src={sources.mp4} type="video/mp4" />}
      </video>
      {!playing && (
        <>
          {poster}
          <button type="button" className="absolute inset-0 flex items-center justify-center" onClick={play} aria-label="Play the house film">
            <span className="flex h-16 w-16 items-center justify-center border border-linen/70 text-linen transition-transform duration-200 group-hover:scale-[1.06]">
              <Icon name="play" size={24} />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
