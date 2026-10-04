"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/client/analytics";

/** A plain wa.me link, prefilled, that logs which page the chat started from. */
export function WhatsAppLink({ number, text, from, className = "", children }: { number: string; text: string; from: string; className?: string; children: ReactNode }) {
  return (
    <a href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={className} onClick={() => track({ name: "ui", action: "whatsapp_click", label: from })}>
      {children}
    </a>
  );
}
