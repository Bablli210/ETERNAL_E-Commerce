import type { Metadata } from "next";
import { Finder } from "@/components/finder/Finder";
import { getScent, getScentIndex, toIndexEntry } from "@/lib/catalogue";
import { finderQuestions } from "@/content/finder";
import { siteImage } from "@/lib/site-images";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Scent finder — five questions, three matches",
  description: "Answer five quick questions and get three scents from across the house, each with its price and one tap to add it. No sign-up.",
  alternates: { canonical: "/finder" },
};

export default async function FinderPage() {
  const [index, mysteryBox] = await Promise.all([getScentIndex(), getScent("mystery-box")]);
  // One tile per answer, resolved here so the client component stays serialisable.
  const tiles: Record<string, string | null> = {};
  for (const q of finderQuestions) {
    for (const o of q.options) tiles[`${q.id}-${o.id}`] = siteImage(`finder-${q.id}-${o.id}`);
  }
  return <Finder index={index} mysteryBox={mysteryBox ? toIndexEntry(mysteryBox) : null} boxImage={siteImage(["products/mystery-box", "mystery-box"])} tiles={tiles} />;
}
