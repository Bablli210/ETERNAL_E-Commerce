"use client";

import type { ReactNode } from "react";
import { track, type AnalyticsItem } from "@/lib/client/analytics";

export type ListItem = { handle: string; item: AnalyticsItem };

/**
 * Sends select_item when a product link inside the list is tapped, so the
 * reports show which home entry points start a visit. Each product marks
 * itself with data-card="<handle>" (ProductCard already does); buttons such as
 * add to bag are not selections and report their own event.
 */
export function SelectList({ list, items, className, children }: { list: string; items: ListItem[]; className?: string; children: ReactNode }) {
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (!target.closest("a")) return;
    const handle = target.closest<HTMLElement>("[data-card]")?.dataset.card;
    const index = items.findIndex((i) => i.handle === handle);
    if (index >= 0) track({ name: "select_item", list, index, item: items[index].item });
  };
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}
