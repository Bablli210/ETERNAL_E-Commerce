"use client";

import { useEffect } from "react";
import { Mark } from "@/components/ui/Wordmark";
import { LOADED_KEY } from "@/lib/motion";

/** G1 · once per session: the e∞ mark draws in a single stroke, then the Linen curtain lifts (600 + 400 ms; 500 ms on mobile). */
export function Loader() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.loading !== "1") return;
    try {
      sessionStorage.setItem(LOADED_KEY, "1");
    } catch {
      /* blocked storage: the curtain still lifts */
    }
    const total = window.innerWidth < 1024 ? 520 : 1020;
    const t = window.setTimeout(() => delete html.dataset.loading, total);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="loader" aria-hidden="true">
      <Mark size={128} draw />
    </div>
  );
}
