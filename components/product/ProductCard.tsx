import Link from "next/link";
import type { ReactNode } from "react";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { ProductImage } from "./ProductImage";
import { AddToBagButton } from "@/components/cart/AddToBagButton";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { joinNotes } from "@/lib/format";

/**
 * Everything needed to decide, without a click: bottle on its colour world,
 * line, name, inspired-by, three notes, price, and two actions. H4: on
 * desktop the actions rise into place on hover or focus; on mobile they are
 * always visible.
 */
export function ProductCard({ entry, priority = false, badge, reason, className = "" }: { entry: ScentIndexEntry; priority?: boolean; badge?: ReactNode; reason?: string; className?: string }) {
  const product = { handle: entry.handle, title: entry.title, image: entry.image, lineLabel: entry.lineLabel, world: entry.world };
  const showBadge = badge ?? (entry.isBestseller ? "Bestseller" : entry.isNew ? "New" : null);
  return (
    <article className={`group flex flex-col ${className}`} data-card={entry.handle}>
      <Link href={`/products/${entry.handle}`} className="relative block" aria-label={entry.title}>
        <ProductImage src={entry.image} hoverSrc={entry.hoverImage} alt={entry.title} world={entry.world} priority={priority} className="aspect-[4/5] w-full" />
        {showBadge && <span className={`badge absolute left-3 top-3 ${showBadge === "New" ? "badge-gold" : ""}`}>{showBadge}</span>}
        {reason && <span className="absolute bottom-3 left-3 bg-linen/90 px-2 py-1 text-[11px] text-night">{reason}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        <div className="flex items-baseline justify-between">
          <Eyebrow>{entry.lineLabel ?? " "}</Eyebrow>
        </div>
        <h3 className="display-m">
          <Link href={`/products/${entry.handle}`} className="hover:text-sea">
            {entry.title}
          </Link>
        </h3>
        <p className="text-[13px] leading-snug text-ash">
          {entry.inspiredBy ? <span className="block">Inspired by {entry.inspiredBy}</span> : null}
          {entry.notesShort.length > 0 && <span className="block">{joinNotes(entry.notesShort)}</span>}
        </p>
        <Price money={entry.price} className="mt-1 text-[14px] font-medium" />
        <div className="card-actions mt-3 flex flex-wrap gap-2">
          {entry.bottle && <AddToBagButton variant={entry.bottle} product={product} kind={entry.kind === "set" ? "set" : "bottle"} size="sm" label={entry.kind === "set" ? "Add to bag" : `Add ${entry.bottle.label}`} />}
          {entry.sample ? (
            <AddToBagButton variant={entry.sample} product={product} kind="sample" size="sm" look="secondary" label={`Try ${entry.sample.label}`} />
          ) : (
            <Link href={`/products/${entry.handle}`} className="btn btn-secondary btn-sm">
              View
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
