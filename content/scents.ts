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
  /** Only where the original is confirmed; the page names it in its body, never in a title. */
  inspiredBy?: string;
  comparison?: string;
  signature?: string;
  /** Three real notes, top to base: each renders as a chip, so never a phrase. */
  notesShort?: string[];
  notes?: NoteStage[];
  colorWorld?: { bg: string; accent: string; dark: boolean; source: "packshot" | "proposed" };
  longevity?: number; // 1–10
  sillage?: number; // 1–10
  wear?: { time?: string; season?: string; occasion?: string; projection?: string };
  tale?: string; // slug in content/tales.ts
  alsoTry?: string[]; // handles
  /**
   * The house's own pick: orders "Where to start" and the menu's picks. It is
   * an editorial choice, never shown as a sales claim; a Bestseller badge comes
   * only from real sales (playbook 5.6).
   */
  pick?: boolean;
  featured?: boolean;
};

export const scents: Record<string, ScentContent> = {
  "shadow-of-the-sea": {
    pick: true,
    inspiredBy: "Acqua di Giò Elixir",
    comparison:
      "Ours keeps the bergamot opening but leans into the incense and ambery woods, so the drydown is smokier and sits closer to the skin. [Replace with the perfumer’s note.]",
    signature: "You can smell the ones the sea decided to give back.",
    // The Shopify description is the product truth: marine notes and bergamot; rosemary, clary sage and geranium; patchouli, incense and ambery woods.
    notesShort: ["Bergamot", "rosemary", "incense"],
    notes: [
      { stage: "Top", name: "Marine notes & bergamot", copy: "Sea-bright citrus — the same as every boat comes home with.", art: "Bergamot on wet stone" },
      { stage: "Heart", name: "Rosemary, clary sage & geranium", copy: "Herbs from the cliffs above the water: green, aromatic, salted by the spray.", art: "Rosemary, sage and geranium leaf" },
      { stage: "Base", name: "Patchouli, incense & ambery woods", copy: "Smoke with no fire behind it, deep in the collar — as if the island had pressed itself into you and hadn’t finished letting go.", art: "Incense smoke and patchouli leaf" },
    ],
    colorWorld: { bg: "#0F2B3C", accent: "#C9D8DE", dark: true, source: "proposed" },
    longevity: 8,
    sillage: 6,
    wear: { time: "Evening", season: "Autumn to spring", occasion: "Dates, dinners, signature", projection: "Arm’s length" },
    tale: "shadow-of-the-sea",
    alsoTry: ["sapphire", "tonic-club"],
    featured: true,
  },
  destiny: {
    pick: true,
    colorWorld: { bg: "#A9C4E4", accent: "#3F6FA8", dark: false, source: "packshot" },
    notesShort: ["Orange blossom", "tuberose", "vanilla"],
  },
  "caribbean-punch": {
    pick: true,
    colorWorld: { bg: "#F0E3CC", accent: "#D9843A", dark: false, source: "packshot" },
    notesShort: ["Mango", "coconut", "sandalwood"],
  },
  "forbidden-apple": {
    inspiredBy: "Clive Christian Crab Apple Blossom",
    signature: "The memory you shouldn’t revisit is the one that still owns you.",
    colorWorld: { bg: "#F1D3D6", accent: "#4F6B3F", dark: false, source: "proposed" },
    notesShort: ["Apple blossom", "rhubarb", "driftwood"],
  },
  wayne: {
    pick: true,
    signature: "Don’t be the man she notices. Be the man she asks about.",
    colorWorld: { bg: "#2B2A28", accent: "#B97A2B", dark: true, source: "proposed" },
    notesShort: ["Bergamot", "lavender", "incense"],
    tale: "wayne",
  },
  mercury: {
    signature: "Wherever you arrive, belong there.",
    colorWorld: { bg: "#C7C3CE", accent: "#6F5E8A", dark: false, source: "proposed" },
    notesShort: ["Grapefruit", "amberwood", "musk"],
  },
  sapphire: {
    pick: true,
    inspiredBy: "Blue Talisman",
    signature: "They don’t remind people of a perfume. They remind people of you.",
    colorWorld: { bg: "#1B3F8F", accent: "#DCE6F5", dark: true, source: "proposed" },
    notesShort: ["Pear", "ginger", "white musk"],
    tale: "sapphire",
  },
  "enzo-1898": {
    pick: true,
    signature: "He looks like money was never the problem.",
    colorWorld: { bg: "#2F5A4E", accent: "#6B3A2B", dark: true, source: "proposed" },
    notesShort: ["Mandarin", "cedarwood", "white musk"],
    tale: "enzo-1898",
  },
  "tonic-club": {
    signature: "Monaco has enough money. Wear something it remembers.",
    colorWorld: { bg: "#DDE9C8", accent: "#3E5A2E", dark: false, source: "proposed" },
    notesShort: ["Juniper", "nutmeg", "ambery woods"],
    tale: "tonic-club",
  },
  linen: {
    signature: "First impressions don’t wait for your résumé.",
    colorWorld: { bg: "#F2EFE8", accent: "#9A968D", dark: false, source: "proposed" },
    notesShort: ["Neroli", "iris", "cedar"],
    tale: "linen",
  },
  divina: { notesShort: ["Pink pepper", "gardenia", "sandalwood"] },
  fiji: { notesShort: ["Citrus", "aquatic florals", "ambergris"] },
  carbon: { notesShort: ["Bergamot", "Sichuan pepper", "cedar"] },
  /** Three scents in one box: no line and no notes of its own. */
  "mystery-box": { notesShort: [] },
  "hundred-whispers": { pick: true, notesShort: ["Peach", "coconut", "tuberose"] },
  "vintage-vanilla": { pick: true },
  // Untagged in Shopify; the owner gave each one's line (Oct 2026). Notes and tags still to come.
  aurora: { line: "eterna" },
  bloom: { line: "eterna" },
  paradox: { line: "eterna" },
  ciel: { line: "eterno" },
  "smoked-aura": { line: "eterno" },
  "ultra-smoke": { line: "eterno" },
  "mango-eclipse": { line: "eternal" },
};
