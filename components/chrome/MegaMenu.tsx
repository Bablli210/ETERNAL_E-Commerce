"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { site } from "@/content/site";
import { familyOrder, families, lines } from "@/content/taxonomy";
import { occasionOrder, occasions, occasionsLive } from "@/content/occasions";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { InspiredBy } from "@/components/product/InspiredBy";
import { LineLabel } from "@/components/product/LineLabel";
import { Mark } from "@/components/ui/Wordmark";

/** `thumbs`: the menu's small stills by site image name (siteImage, so each address carries its version), or null. */
export type FeaturedTiles = { bestseller: ScentIndexEntry | null; thumbs: Record<string, string | null> };

type MenuLink = { label: string; href: string; line?: "eterna" | "eterno" | "eternal" };

const byLine: MenuLink[] = [
  { label: "For her", line: "eterna", href: "/shop/her" },
  { label: "For him", line: "eterno", href: "/shop/him" },
  { label: "Unisex", line: "eternal", href: "/shop/unisex" },
  { label: "All scents", href: "/shop" },
];

const startHere: MenuLink[] = [
  { label: "Find your scent", href: "/finder" },
  { label: `Mystery box · 3 × ${site.sampleSizeMl} ml`, href: "/products/mystery-box" },
  { label: "Where to start", href: "/shop/bestsellers" },
  { label: "New arrivals", href: "/shop/new" },
];

/** By line, by scent, by occasion, the Eternal Originals by name, then where to start: the phone menu's folds, side by side. */
function listsFor(originals: ScentIndexEntry[]): { title: React.ReactNode; key: string; links: MenuLink[] }[] {
  return [
    { key: "line", title: "By line", links: byLine },
    { key: "scent", title: "By scent", links: familyOrder.map((k) => ({ label: families[k].label, href: `/shop/${k}` })) },
    // Shop by occasion (content/occasions.ts).
    ...(occasionsLive ? [{ key: "occasion", title: "By occasion", links: occasionOrder.map((k) => ({ label: occasions[k].label, href: `/shop/${k}` })) }] : []),
    {
      key: "originals",
      title: (
        <span className="inline-flex items-center gap-1.5">
          <Mark size={16} className="shrink-0 text-gold-text" />
          Eternal Originals
        </span>
      ),
      links: [...originals.map((e) => ({ label: e.title, href: `/products/${e.handle}` })), { label: "All Eternal Originals", href: "/shop/originals" }],
    },
    { key: "start", title: "Start here", links: startHere },
  ];
}

export function MegaMenu({ featured, originals, onEnter, onLeave }: { featured: FeaturedTiles; originals: ScentIndexEntry[]; onEnter: () => void; onLeave: () => void }) {
  const lists = listsFor(originals);
  return (
    <div className="drop-enter absolute inset-x-0 top-full hidden border-b border-dune bg-paper text-night lg:block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {/* The lists share the panel; a very wide screen adds the house pick beside them. */}
      <div className="wrap grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-8 py-10 2xl:grid-cols-[repeat(var(--n),minmax(0,1fr))_minmax(0,1.9fr)]" style={{ ["--n" as string]: lists.length }}>
        {lists.map((l) => (
          <div key={l.key}>
            <Eyebrow className={`mb-4 block whitespace-nowrap ${l.key === "originals" ? "!text-gold-text" : ""}`}>{l.title}</Eyebrow>
            <ul className="flex flex-col gap-2.5">
              {l.links.map((lk) => (
                <li key={lk.href + lk.label}>
                  <Link href={lk.href} className="text-[14px] hover:text-sea">
                    {lk.line ? (
                      <>
                        {lk.label} · {lines[lk.line].label}
                      </>
                    ) : (
                      lk.label
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {featured.bestseller && <Featured e={featured.bestseller} eyebrow="House pick" />}
      </div>
    </div>
  );
}

function Featured({ e, eyebrow }: { e: ScentIndexEntry; eyebrow: string }) {
  return (
    <Link href={`/products/${e.handle}`} className="rise-in group flex gap-4 max-2xl:hidden" style={{ ["--i" as string]: 1 }}>
      <ProductImage src={e.image} hoverSrc={e.hoverImage} alt={e.title} world={e.world} sizes="136px" className="h-[136px] w-[136px] shrink-0" />
      <div className="flex flex-col justify-center">
        <Eyebrow>{eyebrow}</Eyebrow>
        <span className="display-m mt-1 group-hover:text-sea">{e.title}</span>
        {e.inspiredBy ? (
          <InspiredBy as="span" name={e.inspiredBy} className="mt-1 text-[12px] text-ash" />
        ) : e.line ? (
          <span className="mt-1 text-[12px] text-ash">
            <LineLabel line={e.line} />
          </span>
        ) : null}
        <Price money={e.price} className="mt-2 text-[13px] font-medium" />
      </div>
    </Link>
  );
}
