"use client";

import { MOTION_KEY } from "@/lib/motion";
import { SERVER_SNAPSHOT, useStoredRaw, writeRaw } from "@/lib/client/storage";

/** The global "Enable motion" setting the spec asks for, beside prefers-reduced-motion. */
export function MotionToggle({ className = "" }: { className?: string }) {
  const raw = useStoredRaw(MOTION_KEY);
  const off = raw === "off";
  const ready = raw !== SERVER_SNAPSHOT;
  const toggle = () => {
    const next = off ? null : "off";
    writeRaw(MOTION_KEY, next);
    if (next) document.documentElement.dataset.motion = "off";
    else delete document.documentElement.dataset.motion;
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={!off} className={`inline-flex items-center gap-2 hover:text-night ${className}`} disabled={!ready}>
      <span className={`inline-block h-2 w-2 rounded-full ${off ? "bg-dune" : "bg-gold"}`} aria-hidden="true" />
      Motion {off ? "off" : "on"}
    </button>
  );
}
