import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionPage } from "@/components/product/CollectionPage";
import { collections } from "@/content/taxonomy";
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
  return { title: def.title, description: def.descriptor, alternates: { canonical: `/shop/${def.slug}` } };
}

export default async function CollectionRoute({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const col = await getCollection(collection);
  if (!col) notFound();
  return <CollectionPage def={col.def} scents={col.scents} />;
}
