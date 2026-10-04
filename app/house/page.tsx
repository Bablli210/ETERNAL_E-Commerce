import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import { getCatalogue, getLineCounts, getScent } from "@/lib/catalogue";
import { lines, type LineKey } from "@/content/taxonomy";
import { house } from "@/content/house";
import { site } from "@/content/site";
import { tales } from "@/content/tales";
import { confirmed, facts } from "@/lib/facts";
import { formatMoney } from "@/lib/format";
import { siteImage } from "@/lib/site-images";
import { lineWithAudience } from "@/components/product/line";
import { HouseCinema, type CinemaImage, type CinemaScene } from "@/components/house/HouseCinema";

export const revalidate = 300;

export const metadata: Metadata = pageMeta({
  title: "The house",
  description: "eternal is a perfume house from Cairo: eaux de parfum in three lines, eterna for her, eterno for him and eternal unisex.",
  path: "/house",
  image: siteImage("house-film-poster"),
});

const LINE_ORDER: LineKey[] = ["eterna", "eterno", "eternal"];
/** Who each line is for, as the band says it. */
const FOR: Record<LineKey, string> = { eterna: "For her", eterno: "For him", eternal: "Unisex" };

/** A still for a scene, or none: a scene without its picture plays on Night. */
const still = (name: string | string[], alt: string): CinemaImage | null => {
  const src = siteImage(name);
  return src ? { src, alt } : null;
};

/** "Made in Egypt" as it reads mid-sentence. */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * The house as a film (Direction B, Cinema): one scene per idea, in the
 * order a first visitor needs them. Every line is a fact the shop already
 * states; a scene whose fact is not confirmed is left out, and the founder's
 * scene appears only once the owner's words and portrait exist.
 */
export default async function HousePage() {
  const [counts, { scents }, box] = await Promise.all([getLineCounts(), getCatalogue(), getScent("mystery-box")]);
  const origin = confirmed(site.origin);
  const founderNote = confirmed(house.founderNote);
  const founderName = confirmed(house.founderName);
  const founderPhoto = siteImage("house-founder");
  const titles = new Map(scents.map((s) => [s.handle, s.title]));

  const tryIt = [
    facts.freeSamples && `Every bottle comes with a free ${site.sampleSizeMl} ml of another scent.`,
    box?.bottle?.availableForSale &&
      `Not ready for a bottle? The mystery box holds three ${site.sampleSizeMl} ml scents chosen by the house, for ${formatMoney(box.bottle.price)}.`,
  ].filter(Boolean);

  const scenes: CinemaScene[] = [
    {
      kind: "still",
      id: "house",
      img: still("house-film-poster", "The atelier: a long wooden table of amber bottles in a dim room"),
      kicker: "The house",
      line: site.tagline,
      sub: "eternal is a perfume house from Cairo. Our eaux de parfum come in three lines: eterna for her, eterno for him and eternal unisex.",
    },
    {
      kind: "still",
      id: "known",
      img: still("house-step-1", "Small glass bottles of perfume oil on a sunlit wooden table"),
      kicker: "The scent you know",
      line: "It starts with a scent you already love.",
      sub: "Where one of ours starts from a fragrance you may already know, its page names the original, so you know what to expect before you smell it.",
    },
    {
      kind: "still",
      id: "reading",
      img: still("house-step-2", "Pipettes resting in small beakers of perfume in window light"),
      kicker: "Our own reading",
      line: "Then we compose our own reading.",
      sub: "Every eternal scent is our own composition. Inspired by, never imitated.",
    },
    ...(origin
      ? [
          {
            kind: "still" as const,
            id: "origin",
            short: true,
            img: still(["hero-vintage-vanilla", "hero-linen"], "A bottle of Vintage Vanilla in a pool of vanilla custard"),
            kicker: `Eau de parfum · ${site.bottleSizeMl} ml`,
            line: `${origin.replace(/\.$/, "")}.`,
            sub: `Every bottle is an eau de parfum, ${site.bottleSizeMl} ml, ${lowerFirst(origin.replace(/\.$/, ""))}${facts.deliveryTime ? " and delivered across the country" : ""}.`,
          },
        ]
      : []),
    ...(tryIt.length
      ? [
          {
            kind: "still" as const,
            id: "skin",
            img: still("house-step-3", "A paper blotter strip held against a wrist"),
            kicker: "Chosen on skin",
            line: "Wear it before you choose it.",
            sub: tryIt.join(" "),
          },
        ]
      : []),
    {
      kind: "lines",
      id: "lines",
      kicker: "The lines",
      line: "Three lines, one house.",
      bands: LINE_ORDER.map((k) => ({
        name: lines[k].label,
        meta: `${FOR[k]} · ${counts[k]} scents · ${lines[k].blurb}`,
        href: `/shop/${lines[k].slug}`,
        img: still(`collection-${lines[k].slug}`, ""),
      })),
    },
    ...(tales.length
      ? [
          {
            kind: "tales" as const,
            id: "tales",
            img: still(["tale-featured", `tale-${tales[0].slug}`], "A fishing boat coming out of the fog at first light"),
            kicker: "The tales",
            line: "Every bottle carries a tale.",
            sigs: tales.slice(0, 4).map((t) => ({
              text: t.signature,
              who: `${titles.get(t.handle) ?? t.title} · ${lineWithAudience(t.line, ", ")}`,
              href: `/tales/${t.slug}`,
            })),
            more: { label: "Read the tales", href: "/tales" },
          },
        ]
      : []),
    ...(founderNote && founderName && founderPhoto
      ? [
          {
            kind: "still" as const,
            id: "founder",
            img: { src: founderPhoto, alt: founderName },
            kicker: "A note from the founder",
            line: "From the founder.",
            sub: founderNote,
            sign: founderName,
          },
        ]
      : []),
  ];

  return (
    <HouseCinema
      scenes={scenes}
      close={{
        title: "Find the one that stays.",
        sub: "Five quick questions, and the finder matches you to three scents from across the house.",
        primary: { label: "Find yours in 60 seconds", href: "/finder" },
        secondary: { label: `Shop all ${scents.length} scents`, href: "/shop" },
      }}
    />
  );
}
