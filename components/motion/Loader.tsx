"use client";

import { useEffect } from "react";
import { Mark } from "@/components/ui/Wordmark";

/**
 * G1 · the mark draws in a single stroke, then the Linen curtain lifts
 * (600 + 400 ms). MotionScript decides before paint whether it shows at all:
 * desktop, home page, first page of the session, never for an ad visitor.
 */
export function Loader() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.loading !== "1") return;
    const t = window.setTimeout(() => delete html.dataset.loading, 1020);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="loader" aria-hidden="true">
      <Mark size={128} draw />
    </div>
  );
}
