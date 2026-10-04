"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track, type AnalyticsItem } from "@/lib/client/analytics";

/**
 * A product card's one link. It is stretched over the whole card (.card-link
 * in collection.css), so the picture and the name open the same page with
 * one tab stop. Inside a list it reports select_item with the card's position.
 */
export function CardLink({ href, list, index, item, className, children }: { href: string; list?: string; index?: number; item: AnalyticsItem; className?: string; children: ReactNode }) {
  const onClick = list !== undefined && index !== undefined ? () => track({ name: "select_item", list, index, item }) : undefined;
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
