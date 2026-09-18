import type { Metadata } from "next";
import { Bestsellers, FeaturedTale, FinderEntry, Hero, HouseFilm, LineTiles, MoodTiles, ProofStrip, RiskReducers, TalesTeaser } from "@/components/home/Sections";
import { MobileStickyBar } from "@/components/home/MobileStickyBar";
import { getBestsellers, getCatalogue, getFeaturedScent, getLineCounts, getScent, toIndexEntry } from "@/lib/catalogue";
import { site } from "@/content/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, bestsellers, counts, mysteryBox, { scents }] = await Promise.all([getFeaturedScent(), getBestsellers(8), getLineCounts(), getScent("mystery-box"), getCatalogue()]);
  return (
    <>
      <Hero featured={featured} />
      <ProofStrip />
      <LineTiles counts={counts} total={scents.length} />
      <Bestsellers entries={bestsellers.map(toIndexEntry)} />
      <FinderEntry />
      <FeaturedTale scent={featured} />
      <MoodTiles />
      <RiskReducers mysteryBox={mysteryBox ? toIndexEntry(mysteryBox) : null} />
      <HouseFilm />
      <TalesTeaser />
      <MobileStickyBar />
    </>
  );
}
