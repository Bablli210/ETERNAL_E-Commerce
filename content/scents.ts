import type { LineKey } from "./taxonomy";

/**
 * Editorial data per scent, keyed by Shopify handle. This is the content
 * the boards put in product metafields (inspired_by, color_world,
 * signature_line, story, notes_copy, longevity, sillage, wear-it). When a
 * product carries the matching metafield in Shopify it wins over this file,
 * so the catalogue can migrate to metafields one field at a time.
 *
 * Colour worlds: two are fixed by existing packshots (destiny, caribbean
 * punch); the other eight are the direction sheet's proposals for the
 * packaging team to confirm. Scents without an entry take their primary
 * family's palette, per the direction's rule.
 */
export type NoteStage = { stage: "Top" | "Heart" | "Base"; name: string; copy: string; art: string };

export type ScentContent = {
  line?: LineKey;
  inspiredBy?: string;
  comparison?: string;
  signature?: string;
  notesShort?: string[];
  notes?: NoteStage[];
  colorWorld?: { bg: string; accent: string; dark: boolean; source: "packshot" | "proposed" };
  longevity?: number; // 1–10
  sillage?: number; // 1–10
  wear?: { time?: string; season?: string; occasion?: string; projection?: string };
  tale?: string; // slug in content/tales.ts
  alsoTry?: string[]; // handles
  bestseller?: boolean;
  featured?: boolean;
};

export const scents: Record<string, ScentContent> = {
  "shadow-of-the-sea": {
    inspiredBy: "Acqua di Giò Elixir",
    comparison:
      "Ours keeps the bergamot opening but leans into the incense and resin, so the drydown is smokier and sits closer to the skin. [Replace with the perfumer’s note.]",
    signature: "You can smell the ones the sea decided to give back.",
    notesShort: ["Bergamot", "incense", "tonka bean"],
    notes: [
      { stage: "Top", name: "Bergamot", copy: "Sea-bright citrus — the same as every boat comes home with.", art: "Bergamot on wet stone" },
      { stage: "Heart", name: "Incense & resin", copy: "Smoke with no fire behind it. Resin, dark and warm, like a temple nobody remembered building.", art: "Resin tears and smoke" },
      { stage: "Base", name: "Patchouli & tonka bean", copy: "Deep in the collar, in the skin — as if the island had pressed itself into you and hadn’t finished letting go.", art: "Tonka beans and patchouli leaf" },
    ],
    colorWorld: { bg: "#0F2B3C", accent: "#C9D8DE", dark: true, source: "proposed" },
    longevity: 8,
    sillage: 6,
    wear: { time: "Evening", season: "Autumn to spring", occasion: "Dates, dinners, signature", projection: "Arm’s length" },
    tale: "shadow-of-the-sea",
    alsoTry: ["sapphire", "tonic-club"],
    bestseller: true,
    featured: true,
  },
  destiny: {
    colorWorld: { bg: "#A9C4E4", accent: "#3F6FA8", dark: false, source: "packshot" },
    notesShort: ["Orange blossom", "tuberose", "vanilla"],
    bestseller: true,
  },
  "caribbean-punch": {
    colorWorld: { bg: "#F0E3CC", accent: "#D9843A", dark: false, source: "packshot" },
    notesShort: ["Mango", "coconut", "sandalwood"],
    bestseller: true,
  },
  "forbidden-apple": {
    inspiredBy: "Crab Apple Blossom",
    signature: "The memory you shouldn’t revisit is the one that still owns you.",
    colorWorld: { bg: "#F1D3D6", accent: "#4F6B3F", dark: false, source: "proposed" },
    notesShort: ["Apple blossom", "rhubarb", "driftwood"],
    tale: "forbidden-apple",
  },
  wayne: {
    signature: "Don’t be the man she notices. Be the man she asks about.",
    colorWorld: { bg: "#2B2A28", accent: "#B97A2B", dark: true, source: "proposed" },
    notesShort: ["Bergamot", "lavender", "incense"],
    tale: "wayne",
    bestseller: true,
  },
  mercury: {
    signature: "Wherever you arrive, belong there.",
    colorWorld: { bg: "#C7C3CE", accent: "#6F5E8A", dark: false, source: "proposed" },
    notesShort: ["Grapefruit", "then warmer", "and darker"],
    tale: "mercury",
  },
  sapphire: {
    inspiredBy: "Blue Talisman",
    colorWorld: { bg: "#1B3F8F", accent: "#DCE6F5", dark: true, source: "proposed" },
    notesShort: ["Pear", "ginger", "white musk"],
    bestseller: true,
  },
  "enzo-1898": {
    signature: "He looks like money was never the problem.",
    colorWorld: { bg: "#2F5A4E", accent: "#6B3A2B", dark: true, source: "proposed" },
    notesShort: ["Mandarin", "cedarwood", "white musk"],
    tale: "enzo-1898",
    bestseller: true,
  },
  "tonic-club": {
    colorWorld: { bg: "#DDE9C8", accent: "#3E5A2E", dark: false, source: "proposed" },
    notesShort: ["Juniper", "nutmeg", "ambery woods"],
  },
  linen: {
    colorWorld: { bg: "#F2EFE8", accent: "#9A968D", dark: false, source: "proposed" },
    notesShort: ["Neroli", "iris", "cedar"],
  },
  "hundred-whispers": { bestseller: true },
  "vintage-vanilla": { bestseller: true },
  "mystery-box": {
    line: "eternal",
    notesShort: ["Three 5 ml samples", "chosen for you"],
  },
};
