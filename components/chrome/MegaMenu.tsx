"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { site } from "@/content/site";
import { familyOrder, families } from "@/content/taxonomy";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { InspiredBy } from "@/components/product/InspiredBy";
import { LineLabel } from "@/components/product/LineLabel";
import { LineName } from "@/components/ui/LineName";

export type FeaturedTiles = { bestseller: ScentIndexEntry | null; newIn: ScentIndexEntry | null };

const lists = [
  {
    title: "By line",
    links: [
      { label: "For her", line: "eterna" as const, href: "/shop/her" },
      { label: "For him", line: "eterno" as const, href: "/shop/him" },
      { label: "Unisex", line: "eternal" as const, href: "/shop/unisex" },
      { label: "All scents", href: "/shop" },
    ],
  },
  {
    title: "By scent",
    links: familyOrder.map((k) => ({ label: families[k].label, href: `/shop/${k}` })),
  },
  {
    title: "Start here",
    links: [
      { label: "Find your scent", href: "/finder" },
      { label: `Mystery box · 3 × ${site.sampleSizeMl} ml`, href: "/products/mystery-box" },
      { label: "Where to start", href: "/shop/bestsellers" },
      { label: "New arrivals", href: "/shop/new" },
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
                    {"line" in lk && lk.line ? (
                      <>
                        {lk.label} <span aria-hidden="true">·</span> <LineName line={lk.line} size="1.15em" />
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
        {[
          { e: featured.bestseller, eyebrow: "House pick" },
          { e: featured.newIn, eyebrow: "New in" },
        ].map(({ e, eyebrow }, i) =>
          e ? (
            <Link key={i} href={`/products/${e.handle}`} className="rise-in group flex gap-4" style={{ ["--i" as string]: i + 1 }}>
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
          ) : null,
        )}
      </div>
    </div>
  );
}
