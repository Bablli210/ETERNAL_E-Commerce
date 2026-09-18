/**
 * Tales — one per scent, in the voice of Scents.pdf. Only Shadow of the Sea
 * is written in full on the boards; the others carry their signature line
 * and art direction, and their body is a placeholder to paste from the PDF.
 */
export type Tale = {
  slug: string;
  title: string;
  handle: string; // the scent it belongs to
  line: "eterna" | "eterno" | "eternal";
  signature: string;
  heroArt: string;
  readTime: string;
  paragraphs: string[];
  complete: boolean;
};

export const tales: Tale[] = [
  {
    slug: "shadow-of-the-sea",
    title: "The sea signs the ones it gives back.",
    handle: "shadow-of-the-sea",
    line: "eterno",
    signature: "You can smell the ones the sea decided to give back.",
    heroArt: "Campaign still, full bleed — fishing boat coming out of the fog, first light",
    readTime: "3 min read",
    complete: true,
    paragraphs: [
      "There’s an island the old charts leave blank. Not unmarked by accident — left off on purpose, the way you’d avoid writing down a name you didn’t want to say twice.",
      "Every so often, a boat didn’t come back on time. Fog took it, or the current did, or something neither one wanted credit for. When the men finally did return, sunburned and short on words, the village always knew before the boat reached the harbour. They knew by the smell carried in on the wind ahead of it.",
      "Bergamot first, the same as always, the same sea-bright citrus every boat came home with. Then something underneath it that didn’t belong to any boat. Smoke with no fire behind it. Resin, dark and warm, like a temple nobody remembered building. Patchouli deep in the collar, tonka bean in the skin, as if the island had pressed itself into them and hadn’t finished letting go.",
      "Wives said their husbands smelled different for months after. Not worse. Just marked. Like the sea had signed them.",
      "Nobody asked the men what happened on the island. They wouldn’t have answered. But every fisherman who returned from it stopped being afraid of open water again — as if whatever found him out there had already done its worst, and let him go anyway.",
      "Some men come back from the sea. A few come back changed by it. You can smell the difference from the shore.",
    ],
  },
  {
    slug: "wayne",
    title: "Don’t be the man she notices. Be the man she asks about.",
    handle: "wayne",
    line: "eterno",
    signature: "Don’t be the man she notices. Be the man she asks about.",
    heroArt: "Dinner table, one empty chair, low light",
    readTime: "3 min read",
    complete: false,
    paragraphs: ["[Full tale to paste from Scents.pdf — 250–400 words in the same voice.]"],
  },
  {
    slug: "enzo-1898",
    title: "Lake Como, Sunday",
    handle: "enzo-1898",
    line: "eterno",
    signature: "He looks like money was never the problem.",
    heroArt: "Lake Como, silver grand tourer, Sunday",
    readTime: "3 min read",
    complete: false,
    paragraphs: ["[Full tale to paste from Scents.pdf — 250–400 words in the same voice.]"],
  },
  {
    slug: "forbidden-apple",
    title: "The memory you shouldn’t revisit is the one that still owns you.",
    handle: "forbidden-apple",
    line: "eterna",
    signature: "The memory you shouldn’t revisit is the one that still owns you.",
    heroArt: "Crab-apple tree beside a hotel entrance",
    readTime: "3 min read",
    complete: false,
    paragraphs: ["[Full tale to paste from Scents.pdf — 250–400 words in the same voice.]"],
  },
  {
    slug: "mercury",
    title: "Wherever you arrive, belong there.",
    handle: "mercury",
    line: "eterno",
    signature: "Wherever you arrive, belong there.",
    heroArt: "Departures board, dusk",
    readTime: "3 min read",
    complete: false,
    paragraphs: ["[Full tale to paste from Scents.pdf — 250–400 words in the same voice.]"],
  },
];

export const taleBySlug = (slug: string) => tales.find((t) => t.slug === slug);
export const taleForHandle = (handle: string) => tales.find((t) => t.handle === handle);
