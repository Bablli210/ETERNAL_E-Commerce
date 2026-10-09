import type { Metadata } from "next";
import { EternalOriginals, FeaturedTale, Hero, LineTiles, OccasionTiles, ProofStrip, ScentTiles, TalesTeaser, TryBeforeYouCommit, WhereToStart } from "@/components/home/Sections";
import { getBestsellers, getCatalogue, getFeaturedScent, getLineCounts, getOriginals, getScent, toIndexEntry, type Scent } from "@/lib/catalogue";
import { occasionOrder, occasionsLive, type OccasionKey } from "@/content/occasions";
import type { Money } from "@/lib/shopify/types";
import type { Hero as HeroDef } from "@/content/heroes";
import { site } from "@/content/site";
import { pageMeta } from "@/lib/metadata";

/**
 * Every version of the home page is the one page "/" to search engines and
 * link previews. The title is absolute: "/" is served from /home/<still>, a
 * child of the layout, whose template would add the house's name twice.
 */
export const homeMetadata: Metadata = pageMeta({ title: `${site.name} — ${site.tagline}`, absolute: true, description: site.description, path: "/" });

const home = site.url.replace(/\/$/, "");
/** Who the shop is and how to search it, for search engines: the house, its WhatsApp line, and the shop's search. */
const houseLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${home}/#house`,
      name: site.name,
      url: `${home}/`,
      logo: `${home}/apple-icon.png`,
      description: site.description,
      // Only a real profile; the bare instagram.com placeholder is not one.
      ...(/instagram\.com\/[^/?#]+/.test(site.instagram) ? { sameAs: [site.instagram] } : {}),
      ...(site.whatsapp ? { contactPoint: { "@type": "ContactPoint", contactType: "customer service", telephone: `+${site.whatsapp}`, availableLanguage: ["English", "Arabic"] } } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${home}/#site`,
      url: `${home}/`,
      name: site.name,
      publisher: { "@id": `${home}/#house` },
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${home}/shop?q={search_term_string}` }, "query-input": "required name=search_term_string" },
    },
  ],
};

/** One pick from each line first, then the house's next ones in order, so every audience sees a way in. */
function onePerLineFirst(picks: Scent[], n: number): Scent[] {
  const firsts = new Set(["eterna", "eterno", "eternal"].map((line) => picks.find((s) => s.line === line)).filter((s): s is Scent => Boolean(s)));
  return [...picks.filter((s) => firsts.has(s)), ...picks.filter((s) => !firsts.has(s))].slice(0, n);
}

/** The lowest available price among these, or null when none is for sale. */
function lowest(prices: (Money | null | undefined)[]): Money | null {
  return prices.reduce<Money | null>((low, p) => (p && (!low || parseFloat(p.amount) < parseFloat(low.amount)) ? p : low), null);
}

/**
 * The home page around one hero still (content/heroes.ts). Section order per
 * playbook 4.2: prices on the first screen, the first product card about 1.6
 * phone screens down.
 */
export async function HomePage({ hero }: { hero: HeroDef }) {
  const [heroScent, featured, picks, counts, mysteryBox, { scents }, originals] = await Promise.all([
    getScent(hero.handle),
    getFeaturedScent(),
    getBestsellers(8),
    getLineCounts(),
    getScent("mystery-box"),
    getCatalogue(),
    getOriginals(),
  ]);
  const fromPrice = lowest(scents.map((s) => (s.bottle?.availableForSale ? s.bottle.price : null)));
  // A 5 ml offer appears by itself once a scent has a 5 ml variant; the finder's trio needs every scent to have one.
  const samplePrice = lowest(scents.map((s) => (s.sample?.availableForSale ? s.sample.price : null)));
  const everySampled = scents.length > 0 && scents.every((s) => s.sample?.availableForSale);
  return (
    <>
      {/* "<" escaped, so no string in the data can close the tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(houseLd).replace(/</g, "\\u003c") }} />
      <Hero hero={hero} scent={heroScent ? toIndexEntry(heroScent) : null} fromPrice={fromPrice} samplePrice={samplePrice} />
      <ProofStrip />
      <LineTiles counts={counts} total={scents.length} />
      <WhereToStart entries={onePerLineFirst(picks, 4).map(toIndexEntry)} total={scents.length} />
      <TryBeforeYouCommit mysteryBox={mysteryBox ? toIndexEntry(mysteryBox) : null} everySampled={everySampled} />
      <EternalOriginals entries={originals.map(toIndexEntry)} />
      <ScentTiles />
      {occasionsLive && <OccasionTiles counts={Object.fromEntries(occasionOrder.map((k) => [k, scents.filter((s) => s.occasions.includes(k)).length])) as Record<OccasionKey, number>} />}
      <FeaturedTale scent={featured} />
      {/* The house film section is off the home page for now, at the owner's request; HouseFilm stays in Sections.tsx to bring back. */}
      <TalesTeaser exclude={featured?.taleSlug ?? null} />
    </>
  );
}
