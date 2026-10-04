import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
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
  const description = "Every scent in the house, across the three lines: eterna for her, eterno for him and eternal unisex.";
  if (s.q) return pageMeta({ title: `Results for “${s.q}”`, description, path: "/shop", noindex: true });
  if (s.h.length) return pageMeta({ title: "Selected scents", description, path: "/shop", noindex: true });
  return pageMeta({ title: "Shop all scents", description, path: "/shop" });
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const [col, params] = await Promise.all([getCollection("all"), searchParams]);
  if (!col) return null;
  return <CollectionPage def={col.def} scents={col.scents} initial={parseGridState(params)} />;
}
