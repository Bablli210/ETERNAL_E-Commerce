import { occasionOrder, occasions, occasionsLive } from "./occasions";

export type LineKey = "eterna" | "eterno" | "eternal";

export const lines: Record<
  LineKey,
  { key: LineKey; label: string; audience: string; slug: string; blurb: string; tone: string; toneDark: boolean }
> = {
  eterna: {
    key: "eterna",
    label: "eterna",
    audience: "Her",
    slug: "her",
    blurb: "florals, fruits, soft musks",
    tone: "#E3CFC4",
    toneDark: false,
  },
  eterno: {
    key: "eterno",
    label: "eterno",
    audience: "Him",
    slug: "him",
    blurb: "woods, citrus, amber",
    tone: "#1F3F50",
    toneDark: true,
  },
  eternal: {
    key: "eternal",
    label: "eternal",
    audience: "Unisex",
    slug: "unisex",
    blurb: "shared signatures",
    tone: "#E9E4D3",
    toneDark: false,
  },
};

export const lineBySlug: Record<string, LineKey> = { her: "eterna", him: "eterno", unisex: "eternal" };

export type FamilyKey = "fresh" | "woody" | "amber-spice" | "floral" | "gourmand" | "aquatic";

export const families: Record<
  FamilyKey,
  { key: FamilyKey; label: string; descriptor: string; tags: string[]; world: { bg: string; accent: string; dark: boolean } }
> = {
  fresh: { key: "fresh", label: "Fresh", descriptor: "Citrus, tropical fruit and mineral notes, bright from the first spray.", tags: ["fresh", "citrus", "tropical", "mineral"], world: { bg: "#DDE9C8", accent: "#3E5A2E", dark: false } },
  woody: { key: "woody", label: "Woody", descriptor: "Cedar, sandalwood and dry woods.", tags: ["woody"], world: { bg: "#D8CBB8", accent: "#5A3E2B", dark: false } },
  "amber-spice": { key: "amber-spice", label: "Amber & spice", descriptor: "Amber, spice and smoke: warm scents for the evening.", tags: ["amber", "spicy", "smoky"], world: { bg: "#E3C9A8", accent: "#8F5B1B", dark: false } },
  floral: { key: "floral", label: "Floral", descriptor: "Blossom, petals and soft powder.", tags: ["floral", "powdery"], world: { bg: "#F1D3D6", accent: "#9A4F5E", dark: false } },
  gourmand: { key: "gourmand", label: "Gourmand", descriptor: "Vanilla, tonka and sweet notes you want to stay near.", tags: ["gourmand", "sweet"], world: { bg: "#EBD9C3", accent: "#7A4A2B", dark: false } },
  aquatic: { key: "aquatic", label: "Aquatic", descriptor: "Sea air and cool water.", tags: ["aquatic"], world: { bg: "#A9C4E4", accent: "#163A4E", dark: false } },
};

export const familyOrder: FamilyKey[] = ["fresh", "woody", "amber-spice", "floral", "gourmand", "aquatic"];

/** Each family's still in public/images, then the stills that stand in until it is installed (Shop by scent, the finder). */
export const familyStills: Record<FamilyKey, string[]> = {
  fresh: ["family-fresh", "mood-golden-hour"],
  woody: ["family-woody", "products/raw-seduction-3"],
  "amber-spice": ["family-amber-spice", "mood-after-dark"],
  floral: ["family-floral", "mood-wild-garden"],
  gourmand: ["family-gourmand", "mood-warm-skin"],
  aquatic: ["family-aquatic", "mood-sea-air"],
};

export type MoodKey = "sea-air" | "golden-hour" | "after-dark" | "fresh-linen" | "warm-skin" | "wild-garden";

export const moods: Record<MoodKey, { key: MoodKey; label: string; descriptor: string; tags: string[]; art: string; wash: string }> = {
  "sea-air": { key: "sea-air", label: "Sea air", descriptor: "Salt, open water and cool air.", tags: ["aquatic", "mineral", "fresh"], art: "Sea air — ingredient macro", wash: "#A9C4E4" },
  "golden-hour": { key: "golden-hour", label: "Golden hour", descriptor: "Citrus and ripe fruit for late, warm light.", tags: ["citrus", "tropical", "fruity"], art: "Golden hour — ingredient macro", wash: "#E3C9A8" },
  "after-dark": { key: "after-dark", label: "After dark", descriptor: "Amber, smoke and woods for the night.", tags: ["amber", "smoky", "spicy", "woody"], art: "After dark — ingredient macro", wash: "#2B2A28" },
  "fresh-linen": { key: "fresh-linen", label: "Fresh linen", descriptor: "Clean musk and soft powder, like washed cotton.", tags: ["powdery", "musky", "fresh"], art: "Fresh linen — ingredient macro", wash: "#E9E4D3" },
  "warm-skin": { key: "warm-skin", label: "Warm skin", descriptor: "Vanilla, amber and musk, warm as skin.", tags: ["sweet", "gourmand", "amber", "musky"], art: "Warm skin — ingredient macro", wash: "#E3CFC4" },
  "wild-garden": { key: "wild-garden", label: "Wild garden", descriptor: "Flowers and fruit, picked in the open.", tags: ["floral", "fruity"], art: "Wild garden — ingredient macro", wash: "#DDE9C8" },
};

export const moodOrder: MoodKey[] = ["sea-air", "golden-hour", "after-dark", "fresh-linen", "warm-skin", "wild-garden"];

/**
 * Collections the shop understands, by slug. "bestsellers" keeps its URL for
 * the links already out there, but it lists the house's picks under that
 * name: no page claims sales the store cannot show.
 */
export type CollectionDef = {
  slug: string;
  title: string;
  descriptor: string;
  kind: "all" | "line" | "family" | "mood" | "bestsellers" | "new" | "originals" | "occasion";
  key?: string;
};

/** The house's own compositions, said the same way on the home page, the menu and their collection. */
export const ORIGINALS_DESCRIPTOR = "Our own compositions, not inspired by another fragrance.";

export const collections: CollectionDef[] = [
  { slug: "all", kind: "all", title: "All scents", descriptor: "Every scent in the house, across the three lines." },
  { slug: "her", kind: "line", key: "eterna", title: "eterna", descriptor: "For her — florals, fruits and soft musks, composed to be remembered." },
  { slug: "him", kind: "line", key: "eterno", title: "eterno", descriptor: "For him — woods, citrus and amber, composed for the man people ask about." },
  { slug: "unisex", kind: "line", key: "eternal", title: "eternal", descriptor: "Unisex — shared signatures that sit close to the skin." },
  { slug: "bestsellers", kind: "bestsellers", title: "Where to start", descriptor: "The house’s picks for a first bottle, across the three lines." },
  { slug: "new", kind: "new", title: "New arrivals", descriptor: "The latest compositions to join the house." },
  { slug: "originals", kind: "originals", title: "Eternal Originals", descriptor: ORIGINALS_DESCRIPTOR },
  ...familyOrder.map((k) => ({ slug: k, kind: "family" as const, key: k, title: families[k].label, descriptor: families[k].descriptor })),
  // Shop by occasion, once the owner has approved its lists (content/occasions.ts).
  ...(occasionsLive ? occasionOrder.map((k) => ({ slug: k, kind: "occasion" as const, key: k, title: occasions[k].label, descriptor: occasions[k].descriptor })) : []),
];

/**
 * The house shops by scent, not by mood: the old mood pages forward to the
 * nearest scent family (next.config.ts), so links already shared still land.
 * Moods stay as tags the finder matches on.
 */
export const moodToFamily: Record<MoodKey, FamilyKey> = {
  "sea-air": "aquatic",
  "golden-hour": "fresh",
  "after-dark": "amber-spice",
  "fresh-linen": "floral",
  "warm-skin": "gourmand",
  "wild-garden": "floral",
};

export const collectionBySlug = (slug: string) => collections.find((c) => c.slug === slug);
