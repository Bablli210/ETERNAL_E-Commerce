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
  /**
   * "House Original", exactly as the owner's approved sheet writes it. It wins
   * over a Shopify inspired_by metafield: the sheet is the record.
   */
  inspiredBy?: string;
  /** One of the Eternal Originals: the house's own composition, inspired by no other fragrance. */
  original?: boolean;
  /** Not sold: kept out of the catalogue the site shows, whatever Shopify says. */
  inactive?: boolean;
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
    line: "eterno",
    inspiredBy: "Armani Acqua di Giò Elixir",
    pick: true,
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
    line: "eterna",
    inspiredBy: "Armani My Way",
    pick: true,
    colorWorld: { bg: "#A9C4E4", accent: "#3F6FA8", dark: false, source: "packshot" },
    notesShort: ["Orange blossom", "tuberose", "vanilla"],
  },
  "caribbean-punch": {
    line: "eternal",
    inspiredBy: "Lorenzo Pazzaglia Summer Hammer",
    pick: true,
    colorWorld: { bg: "#F0E3CC", accent: "#D9843A", dark: false, source: "packshot" },
    notesShort: ["Mango", "coconut", "sandalwood"],
  },
  "forbidden-apple": {
    line: "eterno",
    inspiredBy: "Clive Christian Crab Apple Blossom",
    signature: "The memory you shouldn’t revisit is the one that still owns you.",
    colorWorld: { bg: "#F1D3D6", accent: "#4F6B3F", dark: false, source: "proposed" },
    notesShort: ["Apple blossom", "rhubarb", "driftwood"],
  },
  wayne: {
    line: "eterno",
    original: true,
    pick: true,
    signature: "Don’t be the man she notices. Be the man she asks about.",
    colorWorld: { bg: "#2B2A28", accent: "#B97A2B", dark: true, source: "proposed" },
    notesShort: ["Bergamot", "lavender", "incense"],
    tale: "wayne",
  },
  mercury: {
    line: "eterno",
    inspiredBy: "Bvlgari Tygar",
    signature: "Wherever you arrive, belong there.",
    colorWorld: { bg: "#C7C3CE", accent: "#6F5E8A", dark: false, source: "proposed" },
    notesShort: ["Grapefruit", "amberwood", "musk"],
  },
  sapphire: {
    line: "eterno",
    inspiredBy: "Ex Nihilo Blue Talisman",
    pick: true,
    signature: "They don’t remind people of a perfume. They remind people of you.",
    colorWorld: { bg: "#1B3F8F", accent: "#DCE6F5", dark: true, source: "proposed" },
    notesShort: ["Pear", "ginger", "white musk"],
    tale: "sapphire",
  },
  "enzo-1898": {
    line: "eterno",
    inspiredBy: "Chanel Allure Superleggera",
    pick: true,
    signature: "He looks like money was never the problem.",
    colorWorld: { bg: "#2F5A4E", accent: "#6B3A2B", dark: true, source: "proposed" },
    notesShort: ["Mandarin", "cedarwood", "white musk"],
    tale: "enzo-1898",
  },
  "tonic-club": {
    line: "eterno",
    inspiredBy: "Maison Francis Kurkdjian Gentle Fluidity Silver",
    signature: "Monaco has enough money. Wear something it remembers.",
    colorWorld: { bg: "#DDE9C8", accent: "#3E5A2E", dark: false, source: "proposed" },
    notesShort: ["Juniper", "nutmeg", "ambery woods"],
    tale: "tonic-club",
  },
  linen: {
    line: "eterno",
    inspiredBy: "Prada L'Homme EDT",
    signature: "First impressions don’t wait for your résumé.",
    colorWorld: { bg: "#F2EFE8", accent: "#9A968D", dark: false, source: "proposed" },
    notesShort: ["Neroli", "iris", "cedar"],
    tale: "linen",
  },
  divina: { line: "eterna", inspiredBy: "Burberry Goddess", notesShort: ["Pink pepper", "gardenia", "sandalwood"] },
  fiji: { line: "eternal", original: true, notesShort: ["Citrus", "aquatic florals", "ambergris"] },
  carbon: { line: "eterno", inspiredBy: "Dior Sauvage", notesShort: ["Bergamot", "Sichuan pepper", "cedar"] },
  /** Three scents in one box: no line and no notes of its own. */
  "mystery-box": { notesShort: [] },
  "hundred-whispers": { line: "eterna", original: true, pick: true, notesShort: ["Peach", "coconut", "tuberose"] },
  "vintage-vanilla": { line: "eterna", inspiredBy: "Matière Première Vanilla Powder", pick: true },
  // Lines and originals from the owner's approved "Inspired by" sheet (Oct 2026). Notes and tags still to come for the newer ones.
  aurora: { line: "eterna", inspiredBy: "Givenchy L'Interdit EDP" },
  bloom: { line: "eterna", inspiredBy: "Victoria's Secret Bombshell" },
  paradox: { line: "eterna", inspiredBy: "Prada Paradoxe" },
  ciel: { line: "eterno", inspiredBy: "Roja Elysium" },
  "smoked-aura": { line: "eterno", inspiredBy: "Creed Aventus (Smokey Edition)" },
  /** Inactive on the owner's sheet: off the site (no page, card or search) while Shopify still lists it. */
  "ultra-smoke": { line: "eterno", inactive: true },
  "mango-eclipse": { line: "eternal", inspiredBy: "Unique'e Luxury Mangonificent" },
  hera: { line: "eterna", inspiredBy: "Burberry Her" },
  "secret-no-7": { line: "eterna", inspiredBy: "Jean Paul Gaultier La Belle" },
  "vanilla-blanche": { line: "eterna", inspiredBy: "Kayali Vanilla 28" },
  atlantis: { line: "eterno", inspiredBy: "Issey Miyake Le Sel d'Issey" },
  atomic: { line: "eterno", inspiredBy: "Paco Rabanne Invictus Rouge" },
  cipher: { line: "eterno", inspiredBy: "Nishane Hacivat" },
  eden: { line: "eterno", inspiredBy: "Jean Paul Gaultier Le Beau Paradise Garden" },
  "golden-hour": { line: "eterno", inspiredBy: "Creed Millésime Impérial" },
  icon: { line: "eterno", inspiredBy: "Creed Aventus" },
  poseidon: { line: "eterno", inspiredBy: "Spirit of Dubai Bahar" },
  "zesty-ginger": { line: "eterno", inspiredBy: "Louis Vuitton L'Immensité" },
  "aqua-marine": { line: "eternal", inspiredBy: "Louis Vuitton Afternoon Swim" },
  citron: { line: "eternal", inspiredBy: "Byredo Bal d'Afrique Absolu" },
  element: { line: "eternal", inspiredBy: "Maison Francis Kurkdjian Baccarat Rouge 540" },
  harmony: { line: "eternal", inspiredBy: "Louis Vuitton Symphony" },
  "neroli-code": { line: "eternal", inspiredBy: "Guerlain Néroli Outrenoir" },
  oasis: { line: "eternal", inspiredBy: "Louis Vuitton Imagination" },
  "shore-club": { line: "eternal", inspiredBy: "Louis Vuitton Pacific Chill" },
  mystique: { line: "eterna", original: true },
  "raw-seduction": { line: "eterno", original: true },
};
