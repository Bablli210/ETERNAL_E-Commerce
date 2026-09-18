"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

/** G10 · "Added to bag" when the drawer stays closed: slides up 16 px, stays 3 s, slides out. */
export function Toast() {
  const { toast, openDrawer, dismissToast } = useCart();
  const [leaving, setLeaving] = useState(false);
  // A new toast resets the exit state (adjusted during render, per React's guidance).
  const [seenId, setSeenId] = useState<number | null>(toast?.id ?? null);
  if (toast && seenId !== toast.id) {
    setSeenId(toast.id);
    setLeaving(false);
  }
  useEffect(() => {
    if (!toast) return;
    const hide = window.setTimeout(() => setLeaving(true), 3000);
    const gone = window.setTimeout(() => dismissToast(), 3250);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, [toast, dismissToast]);
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className={`${leaving ? "toast-exit" : "toast-enter"} fixed inset-x-4 bottom-24 z-[70] mx-auto flex max-w-[440px] items-center justify-between gap-4 bg-night px-4 py-3 text-[13px] text-linen lg:bottom-8`}>
      <span className="truncate">
        Added to bag · {toast.title} {toast.label}
      </span>
      <button type="button" className="lnk lnk-quiet shrink-0 text-linen" onClick={openDrawer}>
        View
      </button>
    </div>
  );
}
