import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import { siteImage } from "@/lib/site-images";
import { notFound } from "next/navigation";
import { CollectionPage } from "@/components/product/CollectionPage";
import { parseGridState } from "@/components/product/grid-state";
import { collections, lines, type LineKey } from "@/content/taxonomy";
import { getCollection } from "@/lib/catalogue";

/*
 * Rendered per request, like /shop: the grid's state lives in the URL
 * (?family=, ?q=, ?all=1), and the first paint must already be that grid, so a
 * hard Back from a product lands on the same cards at the same height. The
 * static params still validate the slug.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return collections.filter((c) => c.slug !== "all").map((c) => ({ collection: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }): Promise<Metadata> {
  const { collection } = await params;
  const def = collections.find((c) => c.slug === collection);
  if (!def) return {};
  // The line names differ by one letter, so the tab and the in-app title bar say who each is for.
  const title = def.kind === "line" ? `${def.key === "eternal" ? "Unisex" : `For ${lines[def.key as LineKey].audience.toLowerCase()}`} · ${def.title}` : def.title;
  // A line previews with its own picture, a mood with its mood still; the rest with the house's.
  const image = def.kind === "line" ? siteImage([`collection-${def.slug}`, `line-${def.key}`]) : def.kind === "mood" ? siteImage(`mood-${def.key}`) : null;
  return pageMeta({ title, description: def.descriptor, path: `/shop/${def.slug}`, image });
}

export default async function CollectionRoute({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ collection }, query] = await Promise.all([params, searchParams]);
  const col = await getCollection(collection);
  if (!col) notFound();
  return <CollectionPage def={col.def} scents={col.scents} initial={parseGridState(query)} />;
}
