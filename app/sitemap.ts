import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { collections } from "@/content/taxonomy";
import { tales } from "@/content/tales";
import { getCatalogue } from "@/lib/catalogue";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { all } = await getCatalogue();
  const base = site.url.replace(/\/$/, "");
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/shop`, priority: 0.9 },
    { url: `${base}/finder`, priority: 0.8 },
    { url: `${base}/tales`, priority: 0.6 },
    { url: `${base}/house`, priority: 0.5 },
    { url: `${base}/help`, priority: 0.3 },
    ...collections.filter((c) => c.slug !== "all").map((c) => ({ url: `${base}/shop/${c.slug}`, priority: 0.7 })),
    ...all.map((s) => ({ url: `${base}/products/${s.handle}`, priority: 0.8, lastModified: s.createdAt })),
    ...tales.map((t) => ({ url: `${base}/tales/${t.slug}`, priority: 0.5 })),
  ];
}
