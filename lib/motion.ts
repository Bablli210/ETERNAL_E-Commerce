"use client";

/** Motion tokens and the one switch every animation checks (see design/artboards/Motion-spec.dc.html). */
export const MOTION_KEY = "eternal.motion";
export const LOADED_KEY = "eternal.loaded";

export const dur = { xs: 120, s: 200, m: 320, l: 600, xl: 1200 } as const;
export const easing = {
  standard: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/** False under prefers-reduced-motion or when the visitor switched motion off. */
export function motionAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return document.documentElement.dataset.motion !== "off";
}

export const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 1024;
