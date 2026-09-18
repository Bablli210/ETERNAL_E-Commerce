import type { Metadata } from "next";
import { CollectionPage } from "@/components/product/CollectionPage";
import { getCollection } from "@/lib/catalogue";

export const revalidate = 300;

export const metadata: Metadata = { title: "Shop all scents", description: "Every scent in the house, across the three lines — eterna, eterno and eternal.", alternates: { canonical: "/shop" } };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const col = await getCollection("all");
  if (!col) return null;
  return <CollectionPage def={col.def} scents={col.scents} query={q} />;
}
