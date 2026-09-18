"use client";

import { useEffect, useRef, useState } from "react";
import { motionAllowed } from "@/lib/motion";

/** H2 / F3 · a number counts up from 0 once it is half in view (800 ms, ease-out). Renders the final value without motion. */
export function CountUp({ value, duration = 800, prefix = "", suffix = "", decimals = 0, className = "" }: { value: number; duration?: number; prefix?: string; suffix?: string; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);
  return (
    <span ref={ref} className={`tnum ${className}`}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
