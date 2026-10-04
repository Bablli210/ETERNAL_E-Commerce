import type { Metadata } from "next";
import { FeaturedTale, Hero, HouseFilm, LineTiles, MoodTiles, ProofStrip, TalesTeaser, TryBeforeYouCommit, WhereToStart } from "@/components/home/Sections";
import { getBestsellers, getCatalogue, getFeaturedScent, getLineCounts, getScent, toIndexEntry, type Scent } from "@/lib/catalogue";
import type { Money } from "@/lib/shopify/types";
import { site } from "@/content/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

/** The bottle the hero film shows. The film and this handle change together. */
const HERO_SCENT = "wayne";

/** One pick from each line first, then the house's next ones in order, so every audience sees a way in. */
function onePerLineFirst(picks: Scent[], n: number): Scent[] {
  const firsts = new Set(["eterna", "eterno", "eternal"].map((line) => picks.find((s) => s.line === line)).filter((s): s is Scent => Boolean(s)));
  return [...picks.filter((s) => firsts.has(s)), ...picks.filter((s) => !firsts.has(s))].slice(0, n);
}

/** The lowest available price among these, or null when none is for sale. */
function lowest(prices: (Money | null | undefined)[]): Money | null {
  return prices.reduce<Money | null>((low, p) => (p && (!low || parseFloat(p.amount) < parseFloat(low.amount)) ? p : low), null);
}

/** Section order per playbook 4.2: prices on the first screen, the first product card about 1.6 phone screens down. */
export default async function HomePage() {
  const [heroScent, featured, picks, counts, mysteryBox, { scents }] = await Promise.all([getScent(HERO_SCENT), getFeaturedScent(), getBestsellers(8), getLineCounts(), getScent("mystery-box"), getCatalogue()]);
  const fromPrice = lowest(scents.map((s) => (s.bottle?.availableForSale ? s.bottle.price : null)));
  // A 5 ml offer appears by itself once a scent has a 5 ml variant; the finder's trio needs every scent to have one.
  const samplePrice = lowest(scents.map((s) => (s.sample?.availableForSale ? s.sample.price : null)));
  const everySampled = scents.length > 0 && scents.every((s) => s.sample?.availableForSale);
  return (
    <>
      <Hero scent={heroScent ? toIndexEntry(heroScent) : null} fromPrice={fromPrice} samplePrice={samplePrice} />
      <ProofStrip />
      <LineTiles counts={counts} total={scents.length} />
      <WhereToStart entries={onePerLineFirst(picks, 4).map(toIndexEntry)} total={scents.length} />
      <TryBeforeYouCommit mysteryBox={mysteryBox ? toIndexEntry(mysteryBox) : null} everySampled={everySampled} />
      <MoodTiles />
      <FeaturedTale scent={featured} />
      <HouseFilm />
      <TalesTeaser exclude={featured?.taleSlug ?? null} />
    </>
  );
}
