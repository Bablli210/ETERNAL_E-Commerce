"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { track } from "@/lib/client/analytics";
import { parseJSON, pushRecentlyViewed, RECENT_KEY, useStoredRaw } from "@/lib/client/storage";
import { ProductImage } from "./ProductImage";
import { Price } from "@/components/ui/Primitives";

/** Records the visit, then shows up to four other scents seen earlier. */
export function RecentlyViewed({ current, index }: { current: string; index: ScentIndexEntry[] }) {
  const raw = useStoredRaw(RECENT_KEY);
  const items = useMemo(
    () =>
      parseJSON<string[]>(raw, [])
        .filter((h) => h !== current)
        .map((h) => index.find((e) => e.handle === h))
        .filter((e): e is ScentIndexEntry => Boolean(e))
        .slice(0, 4),
    [raw, current, index],
  );
  useEffect(() => {
    pushRecentlyViewed(current);
  }, [current]);
  if (!items.length) return null;
  return (
    <section className="border-t border-dune py-12">
      <div className="wrap">
        <h2 className="eyebrow mb-6 font-sans text-ash">Recently viewed</h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((e, i) => (
            <li key={e.handle} className="min-w-0">
              <Link
                href={`/products/${e.handle}`}
                className="group flex items-center gap-3"
                onClick={() => e.bottle && track({ name: "select_item", list: "recently_viewed", index: i, item: { productId: e.productId, variantId: e.bottle.numericId, name: e.title, price: parseFloat(e.price.amount) } })}
              >
                <ProductImage src={e.image} alt="" world={e.world} sizes="68px" className="h-[68px] w-[68px] shrink-0" />
                <div className="min-w-0">
                  <p className="display-m !text-[18px] group-hover:text-sea">{e.title}</p>
                  <Price money={e.price} className="text-[13px] text-ash" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
