"use client";

import type { ReactNode } from "react";
import { facts } from "@/lib/facts";
import { track } from "@/lib/client/analytics";

/** A wa.me link with the message already typed. Null until facts.whatsapp is set. */
export const whatsappHref = (text?: string) => (facts.whatsapp ? `https://wa.me/${facts.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null);

/** Starting a chat is a lead (Meta Lead, GA4 generate_lead); the ui event says where it started. */
export function trackWhatsApp(label: string) {
  track({ name: "ui", action: "whatsapp_click", label });
  track({ name: "generate_lead", method: "whatsapp" });
}

/** A plain WhatsApp link (no SDK) for the menu, footer and search; renders nothing until the number is set. */
export function WhatsAppLink({ text, label, className, children }: { text?: string; label: string; className?: string; children: ReactNode }) {
  const href = whatsappHref(text);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => trackWhatsApp(label)}>
      {children}
    </a>
  );
}
