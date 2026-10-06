import type { ReactNode } from "react";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { AddToBagButton } from "@/components/cart/AddToBagButton";
import { Price } from "@/components/ui/Primitives";
import { formatMoney, joinNotes } from "@/lib/format";
import { analyticsItem } from "./analytics-item";
import { CardLink } from "./CardLink";
import { InspiredBy } from "./InspiredBy";
import { LineLabel } from "./LineLabel";
import { ProductImage } from "./ProductImage";

/**
 * Everything needed to decide without opening the page, in the playbook's
 * order (4.3): the line with its audience, the name, the original it is
 * inspired by, three notes, the price, then one full-width Add. The whole
 * card is a single link to the product; "Try 5 ml" appears by itself once the
 * scent has a 5 ml variant.
 *
 * Badges: `badge={false}` means none. Otherwise "Bestseller" comes only from
 * real sales and "New" from the product's creation date.
 * Inside a list, `list` and `index` make opening the card report select_item.
 */
export function ProductCard({
  entry,
  priority = false,
  badge,
  reason,
  sizes,
  list,
  index,
  className = "",
}: {
  entry: ScentIndexEntry;
  priority?: boolean;
  badge?: ReactNode;
  reason?: string;
  /** The image's rendered width, for the srcset; ProductImage's default suits a 50vw slot. */
  sizes?: string;
  list?: string;
  index?: number;
  className?: string;
}) {
  const product = { productId: entry.productId, handle: entry.handle, title: entry.title, image: entry.image, lineLabel: entry.lineLabel, world: entry.world };
  const showBadge = badge ?? (entry.isBestseller ? "Bestseller" : entry.isNew ? "New" : null);
  return (
    <article className={`group relative flex h-full flex-col ${className}`} data-card={entry.handle}>
      <div className="relative">
        {/* The link names the product, so the picture stays silent. */}
        <ProductImage src={entry.image} hoverSrc={entry.hoverImage} alt="" world={entry.world} sizes={sizes} priority={priority} className="aspect-square w-full" />
        {showBadge && <span className={`badge absolute left-3 top-3 text-[12px] ${showBadge === "New" ? "badge-gold" : ""}`}>{showBadge}</span>}
        {reason && <span className="absolute bottom-3 left-3 bg-linen/90 px-2 py-1 text-[12px] text-night">{reason}</span>}
      </div>
      <div className="flex flex-1 flex-col pt-2.5">
        {/* A product without a line keeps the row, so names and prices line up across the grid. */}
        <p className="text-[12px] leading-4 text-ash">{entry.line ? <LineLabel line={entry.line} /> : "\u00a0"}</p>
        <h3 className="serif text-[20px] leading-[1.15] lg:text-[26px]">
          <CardLink href={`/products/${entry.handle}`} list={list} index={index} item={analyticsItem(entry)} className="card-link flex min-h-11 items-center hover:text-sea">
            {entry.title}
          </CardLink>
        </h3>
        {entry.inspiredBy && <InspiredBy name={entry.inspiredBy} className="text-[13px] leading-snug text-ash lg:text-[14px]" />}
        {entry.notesShort.length > 0 && <p className="line-clamp-2 text-[13px] leading-snug text-ash">{joinNotes(entry.notesShort.slice(0, 3))}</p>}
        <Price money={entry.price} className="mt-1 whitespace-nowrap text-[15px] font-medium" />
        <div className="card-actions relative z-[2] mt-auto flex flex-col pt-3">
          {entry.bottle && (
            <AddToBagButton variant={entry.bottle} product={product} kind={entry.kind === "set" ? "set" : "bottle"} size="sm" block label="Add to bag" />
          )}
          {entry.sample && (
            <AddToBagButton variant={entry.sample} product={product} kind="sample" size="sm" look="secondary" className="card-try" label={`Try ${entry.sample.label} · ${formatMoney(entry.sample.price)}`} />
          )}
        </div>
      </div>
    </article>
  );
}
