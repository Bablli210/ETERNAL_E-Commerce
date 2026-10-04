"use client";

import { useEffect } from "react";
import { track } from "@/lib/client/analytics";

/**
 * The phone's answer to card hover (collection.css): the small button on a
 * product card's image turns that card, and only that card, to its notes
 * still and back. One listener for the whole page, so cards that arrive later
 * (filters, the finder) work too; the tap never reaches the card's link.
 */
export function CardNotes() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest<HTMLButtonElement>("[data-notes-toggle]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest(".group");
      if (!card) return;
      const on = card.classList.toggle("notes-on");
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Show the bottle" : "Show the notes");
      if (on) track({ name: "ui", action: "notes_toggle", label: card.getAttribute("data-card") ?? undefined });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
