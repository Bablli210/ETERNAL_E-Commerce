"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { lines, type LineKey } from "@/content/taxonomy";
import { site } from "@/content/site";
import { facts } from "@/lib/facts";
import { formatMoney } from "@/lib/format";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Wordmark";
import { useModal } from "./useModal";
import { WhatsAppLink } from "./WhatsAppLink";

/** Audience first: the line names differ by one letter, so a stranger picks "For him", and the name rides along. */
const AUDIENCES: { key: LineKey; label: string }[] = [
  { key: "eterna", label: "For her" },
  { key: "eterno", label: "For him" },
  { key: "eternal", label: "Unisex" },
];

const MORE = [
  { label: "Tales", href: "/tales" },
  { label: "Help & delivery", href: "/help" },
];

const codLive = facts.paymentMethods.some((m) => /cash on delivery/i.test(m));

type Follow = (href: string) => (e: React.MouseEvent) => void;

/** Links replace the menu's history entry (useModal), so Back from the page they open skips the closed menu. */
function Row({ href, follow, thumb, title, sub }: { href: string; follow: Follow; thumb: React.ReactNode; title: React.ReactNode; sub: React.ReactNode }) {
  return (
    <li>
      <Link href={href} replace onClick={follow(href)} className="flex min-h-[76px] items-center gap-4 py-2.5">
        <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-sand">{thumb}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-medium leading-snug">{title}</span>
          <span className="block truncate text-[13px] text-ash">{sub}</span>
        </span>
        <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />
      </Link>
    </li>
  );
}

export function MobileMenu({ onClose, counts, box }: { onClose: () => void; counts: Record<LineKey, number>; box: ScentIndexEntry | null }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  // Back closes the menu instead of leaving the site.
  const { follow } = useModal(panel, close, onClose);

  return (
    <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onClose} className="fade-enter absolute inset-0 bg-night/40" />
      <aside ref={panel} className="drawer-left absolute inset-y-0 left-0 flex w-[88%] max-w-[400px] flex-col overflow-y-auto overscroll-contain bg-linen pb-[env(safe-area-inset-bottom)] text-night">
        <header className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-dune pl-5 pr-2">
          <Wordmark href="/" replace onClick={follow("/")} />
          <button ref={close} type="button" onClick={onClose} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center">
            <Icon name="close" />
          </button>
        </header>

        <nav aria-label="Shop" className="px-5">
          <ul className="divide-y divide-dune border-b border-dune">
            {AUDIENCES.map(({ key, label }) => (
              <Row
                key={key}
                href={`/shop/${lines[key].slug}`}
                follow={follow}
                thumb={<Image src={`/images/line-${key}.jpg`} alt="" fill sizes="44px" className="object-cover" />}
                title={
                  <>
                    {label} · {lines[key].label}
                  </>
                }
                sub={`${counts[key]} scents · ${lines[key].blurb}`}
              />
            ))}
            {box && (
              <Row
                href={`/products/${box.handle}`}
                follow={follow}
                thumb={<Image src="/images/mystery-box.jpg" alt="" fill sizes="44px" className="object-cover" />}
                title="Mystery box"
                sub={`Three ${site.sampleSizeMl} ml samples · ${formatMoney(box.price)}`}
              />
            )}
            <Row
              href="/finder"
              follow={follow}
              thumb={<Image src="/images/finder-band.jpg" alt="" fill sizes="44px" className="object-cover" />}
              title="Find your scent"
              sub="A few questions, three matches"
            />
          </ul>
          <Link href="/shop" replace onClick={follow("/shop")} className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold">
            <span className="lnk">All scents</span>
            <Icon name="arrow-right" size={16} />
          </Link>
        </nav>

        <nav aria-label="More" className="mt-3 px-5">
          <ul className="divide-y divide-dune border-y border-dune">
            {MORE.map((r) => (
              <li key={r.href}>
                <Link href={r.href} replace onClick={follow(r.href)} className="flex h-12 items-center justify-between text-[15px]">
                  {r.label}
                  <Icon name="chevron-right" size={16} className="text-ash" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-dune px-5 py-3 text-[13px]">
          <WhatsAppLink label="menu" text="Hello eternal, I have a question about a scent." className="flex min-h-11 items-center gap-3">
            <Icon name="whatsapp" size={20} className="shrink-0" />
            <span>
              <span className="block font-medium">Chat with us on WhatsApp</span>
              {facts.whatsappHours && <span className="block text-[12px] text-ash">{facts.whatsappHours}</span>}
            </span>
          </WhatsAppLink>
          {codLive && (
            <p className="flex min-h-11 items-center gap-3 text-ash">
              <Icon name="shield" size={20} className="shrink-0 text-gold-text" /> Pay cash on delivery
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
