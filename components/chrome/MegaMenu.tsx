"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { familyOrder, families } from "@/content/taxonomy";
import type { ScentIndexEntry } from "@/lib/catalogue";

export type FeaturedTiles = { bestseller: ScentIndexEntry | null; newIn: ScentIndexEntry | null };

const lists = [
  {
    title: "By line",
    links: [
      { label: "Her — eterna", href: "/shop/her" },
      { label: "Him — eterno", href: "/shop/him" },
      { label: "Unisex — eternal", href: "/shop/unisex" },
      { label: "All scents", href: "/shop" },
    ],
  },
  {
    title: "By family",
    links: familyOrder.map((k) => ({ label: families[k].label, href: `/shop/${k}` })),
  },
  {
    title: "Start here",
    links: [
      { label: "Bestsellers", href: "/shop/bestsellers" },
      { label: "New arrivals", href: "/shop/new" },
      { label: "Discovery set", href: "/finder" },
      { label: "Mystery box", href: "/products/mystery-box" },
      { label: "Scent finder — 2 minutes", href: "/finder" },
    ],
  },
];

export function MegaMenu({ featured, onEnter, onLeave }: { featured: FeaturedTiles; onEnter: () => void; onLeave: () => void }) {
  return (
    <div className="drop-enter absolute inset-x-0 top-full hidden border-b border-dune bg-paper text-night lg:block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="wrap grid grid-cols-[repeat(3,minmax(0,160px))_1fr_1fr] gap-10 py-10">
        {lists.map((l) => (
          <div key={l.title}>
            <Eyebrow className="mb-4 block">{l.title}</Eyebrow>
            <ul className="flex flex-col gap-2.5">
              {l.links.map((lk) => (
                <li key={lk.href + lk.label}>
                  <Link href={lk.href} className="text-[14px] hover:text-sea">
                    {lk.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {[
          { e: featured.bestseller, eyebrow: "Featured", label: "Bestseller" },
          { e: featured.newIn, eyebrow: `New in ${featured.newIn?.lineLabel ?? "the house"}`, label: "New arrival" },
        ].map(({ e, eyebrow, label }, i) =>
          e ? (
            <Link key={i} href={`/products/${e.handle}`} className="group flex gap-4">
              <ProductImage src={e.image} alt={e.title} world={e.world} sizes="140px" className="h-[170px] w-[136px] shrink-0" />
              <div className="flex flex-col justify-center">
                <Eyebrow>{eyebrow}</Eyebrow>
                <span className="display-m mt-1 group-hover:text-sea">{e.title}</span>
                <span className="mt-1 text-[12px] text-ash">{e.inspiredBy ? `Inspired by ${e.inspiredBy}` : e.lineLabel ?? label}</span>
                <Price money={e.price} className="mt-2 text-[13px] font-medium" />
              </div>
            </Link>
          ) : null,
        )}
      </div>
    </div>
  );
}
