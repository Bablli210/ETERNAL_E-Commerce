"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { familyOrder, families, lines, type LineKey } from "@/content/taxonomy";
import { occasionOrder, occasions, occasionsLive } from "@/content/occasions";
import { site } from "@/content/site";
import { facts } from "@/lib/facts";
import { formatMoney } from "@/lib/format";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { ProductImage } from "@/components/product/ProductImage";
import { Icon } from "@/components/ui/Icon";
import { Mark, Wordmark } from "@/components/ui/Wordmark";
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
function Row({ href, follow, thumb, title, sub }: { href: string; follow: Follow; thumb?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} replace onClick={follow(href)} className={`flex items-center gap-4 py-2.5 ${thumb ? "min-h-[76px]" : "min-h-14"}`}>
        {thumb && <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-sand">{thumb}</span>}
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-medium leading-snug">{title}</span>
          {sub && <span className="block truncate text-[13px] text-ash">{sub}</span>}
        </span>
        <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />
      </Link>
    </li>
  );
}

/** One way to shop, folded under its name; opening one folds the others (details[name]). */
function Group({ title, children, all }: { title: React.ReactNode; children: React.ReactNode; all: { href: string; label: string; follow: Follow } }) {
  return (
    <details name="menu-shop" className="menu-group group border-b border-dune">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="serif text-[24px] leading-none">{title}</span>
        <Icon name="chevron-down" size={18} className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="pb-3">
        <ul className="divide-y divide-dune/70 border-t border-dune/70">{children}</ul>
        <Link href={all.href} replace onClick={all.follow(all.href)} className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold">
          <span className="lnk">{all.label}</span>
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </details>
  );
}

/**
 * The phone menu: four ways to shop, each a fold (by line, by scent, by occasion, the Eternal Originals), then the
 * finder and the mystery box, then the rest of the house.
 */
export function MobileMenu({ onClose, counts, box, originals }: { onClose: () => void; counts: Record<LineKey, number>; box: ScentIndexEntry | null; originals: ScentIndexEntry[] }) {
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
          <Group title="By line" all={{ href: "/shop", label: "All scents", follow }}>
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
          </Group>
          <Group title="By scent" all={{ href: "/shop", label: "All scents", follow }}>
            {familyOrder.map((k) => (
              <Row key={k} href={`/shop/${k}`} follow={follow} title={families[k].label} sub={families[k].descriptor} />
            ))}
          </Group>
          {occasionsLive && (
            <Group title="By occasion" all={{ href: "/shop", label: "All scents", follow }}>
              {occasionOrder.map((k) => (
                <Row key={k} href={`/shop/${k}`} follow={follow} title={occasions[k].label} sub={occasions[k].descriptor} />
              ))}
            </Group>
          )}
          <Group
            title={
              <span className="inline-flex items-center gap-2.5">
                <Mark size={24} className="shrink-0 text-gold-text" />
                Eternal Originals
              </span>
            }
            all={{ href: "/shop/originals", label: "All Eternal Originals", follow }}
          >
            {originals.map((e) => (
              <Row
                key={e.handle}
                href={`/products/${e.handle}`}
                follow={follow}
                thumb={<ProductImage src={e.image} alt="" world={e.world} sizes="44px" className="h-full w-full" />}
                title={e.title}
                sub={[e.line && AUDIENCES.find((a) => a.key === e.line)?.label, "composed by the house"].filter(Boolean).join(" · ")}
              />
            ))}
          </Group>
          <ul className="divide-y divide-dune border-b border-dune">
            <Row
              href="/finder"
              follow={follow}
              thumb={<Image src="/images/finder-band.jpg" alt="" fill sizes="44px" className="object-cover" />}
              title="Find your scent"
              sub="A few questions, three matches"
            />
            {box && (
              <Row
                href={`/products/${box.handle}`}
                follow={follow}
                thumb={<Image src="/images/mystery-box.jpg" alt="" fill sizes="44px" className="object-cover" />}
                title="Mystery box"
                sub={`Three ${site.sampleSizeMl} ml samples · ${box.bottle?.availableForSale ? formatMoney(box.price) : "out of stock for now"}`}
              />
            )}
          </ul>
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
