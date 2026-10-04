"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { track } from "@/lib/client/analytics";

/** Sends ui faq_open with the question when a <details> inside opens, so the server-rendered accordion stays as it is. */
export function FaqTrack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // toggle does not bubble; a capturing listener still sees it.
    const onToggle = (e: Event) => {
      const d = e.target;
      if (d instanceof HTMLDetailsElement && d.open) track({ name: "ui", action: "faq_open", label: d.querySelector("summary")?.textContent ?? undefined });
    };
    el.addEventListener("toggle", onToggle, true);
    return () => el.removeEventListener("toggle", onToggle, true);
  }, []);
  return <div ref={ref}>{children}</div>;
}
