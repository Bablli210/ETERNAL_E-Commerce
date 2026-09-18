"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";

/** Bottom-right on mobile, appears after 3 s, hidden while the bag is open. Renders nothing until a number is set. */
export function WhatsAppFloat() {
  const { open } = useCart();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 3000);
    return () => window.clearTimeout(t);
  }, []);
  if (!site.whatsapp || !show || open) return null;
  return (
    <a
      href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hello eternal — I have a question about a scent.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fade-enter fixed bottom-24 right-4 z-[50] flex h-12 w-12 items-center justify-center bg-night text-linen hover:bg-sea lg:bottom-8 lg:right-8"
    >
      <Icon name="whatsapp" size={22} />
    </a>
  );
}
