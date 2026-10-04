import type { Metadata } from "next";
import { CollectionPage } from "@/components/product/CollectionPage";
import { parseGridState } from "@/components/product/grid-state";
import { getCollection } from "@/lib/catalogue";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/*
 * Rendered per request: ads land here with their state in the URL (?h= for a
 * carousel, ?q= from search, ?line= or ?family=), and the first paint must
 * already be that grid.
 */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const s = parseGridState(await searchParams);
  const base: Metadata = { alternates: { canonical: "/shop" } };
  if (s.q) return { ...base, title: `Results for “${s.q}”`, robots: { index: false, follow: true } };
  if (s.h.length) return { ...base, title: "Selected scents", robots: { index: false, follow: true } };
  return { ...base, title: "Shop all scents", description: "Every scent in the house, across the three lines: eterna for her, eterno for him and eternal for both." };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const [col, params] = await Promise.all([getCollection("all"), searchParams]);
  if (!col) return null;
  return <CollectionPage def={col.def} scents={col.scents} initial={parseGridState(params)} />;
}
