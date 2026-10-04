import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionPage } from "@/components/product/CollectionPage";
import { collections, lines, type LineKey } from "@/content/taxonomy";
import { getCollection } from "@/lib/catalogue";

export const revalidate = 300;
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
  return { title, description: def.descriptor, alternates: { canonical: `/shop/${def.slug}` } };
}

export default async function CollectionRoute({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const col = await getCollection(collection);
  if (!col) notFound();
  return <CollectionPage def={col.def} scents={col.scents} />;
}
