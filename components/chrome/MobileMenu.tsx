"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { lines } from "@/content/taxonomy";
import { site } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Wordmark";

const rows = [
  { label: "Shop all scents", href: "/shop" },
  { label: "Bestsellers", href: "/shop/bestsellers" },
  { label: "New arrivals", href: "/shop/new" },
  { label: "Mystery box", href: "/products/mystery-box" },
  { label: "Tales", href: "/tales" },
  { label: "The house", href: "/house" },
  { label: "Help & delivery", href: "/help" },
];

export function MobileMenu({ onClose }: { onClose: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" aria-label="Close menu" onClick={onClose} className="fade-enter absolute inset-0 bg-night/40" />
      <aside className="drawer-left absolute inset-y-0 left-0 flex w-[88%] max-w-[400px] flex-col overflow-y-auto bg-linen text-night">
        <header className="flex h-[var(--header-h)] items-center justify-between border-b border-dune px-5">
          <Wordmark href="/" />
          <button ref={first} type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center">
            <Icon name="close" />
          </button>
        </header>
        <div className="flex flex-col gap-6 px-5 py-6">
          <Link href="/finder" onClick={onClose} className="btn btn-block">
            Find your scent — 2 minutes
          </Link>
          <div className="grid grid-cols-3 gap-2">
            {(["eterna", "eterno", "eternal"] as const).map((k) => {
              const l = lines[k];
              return (
                <Link key={k} href={`/shop/${l.slug}`} onClick={onClose} className={`flex aspect-[3/4] flex-col justify-end p-3 ${l.toneDark ? "text-linen" : "text-night"}`} style={{ backgroundColor: l.tone }}>
                  <span className="serif text-[22px] leading-none">{l.label}</span>
                  <span className="mt-1 text-[11px] opacity-80">{l.audience}</span>
                </Link>
              );
            })}
          </div>
          <ul className="divide-y divide-dune border-y border-dune">
            {rows.map((r) => (
              <li key={r.href}>
                <Link href={r.href} onClick={onClose} className="flex h-12 items-center justify-between text-[15px] font-medium">
                  {r.label}
                  <Icon name="chevron-right" size={16} className="text-ash" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-dune px-5 py-4 text-[12px] text-ash">
          <span>EGP · Egypt</span>
          {site.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-night">
              <Icon name="whatsapp" size={18} /> Chat on WhatsApp
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
