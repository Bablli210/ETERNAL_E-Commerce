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
  { key: FamilyKey; label: string; tags: string[]; world: { bg: string; accent: string; dark: boolean } }
> = {
  fresh: { key: "fresh", label: "Fresh", tags: ["fresh", "citrus", "tropical", "mineral"], world: { bg: "#DDE9C8", accent: "#3E5A2E", dark: false } },
  woody: { key: "woody", label: "Woody", tags: ["woody"], world: { bg: "#D8CBB8", accent: "#5A3E2B", dark: false } },
  "amber-spice": { key: "amber-spice", label: "Amber & spice", tags: ["amber", "spicy", "smoky"], world: { bg: "#E3C9A8", accent: "#8F5B1B", dark: false } },
  floral: { key: "floral", label: "Floral", tags: ["floral", "powdery"], world: { bg: "#F1D3D6", accent: "#9A4F5E", dark: false } },
  gourmand: { key: "gourmand", label: "Gourmand", tags: ["gourmand", "sweet"], world: { bg: "#EBD9C3", accent: "#7A4A2B", dark: false } },
  aquatic: { key: "aquatic", label: "Aquatic", tags: ["aquatic"], world: { bg: "#A9C4E4", accent: "#163A4E", dark: false } },
};

export const familyOrder: FamilyKey[] = ["fresh", "woody", "amber-spice", "floral", "gourmand", "aquatic"];

export type MoodKey = "sea-air" | "golden-hour" | "after-dark" | "fresh-linen" | "warm-skin" | "wild-garden";

export const moods: Record<MoodKey, { key: MoodKey; label: string; tags: string[]; art: string; wash: string }> = {
  "sea-air": { key: "sea-air", label: "Sea air", tags: ["aquatic", "mineral", "fresh"], art: "Sea air — ingredient macro", wash: "#A9C4E4" },
  "golden-hour": { key: "golden-hour", label: "Golden hour", tags: ["citrus", "tropical", "fruity"], art: "Golden hour — ingredient macro", wash: "#E3C9A8" },
  "after-dark": { key: "after-dark", label: "After dark", tags: ["amber", "smoky", "spicy", "woody"], art: "After dark — ingredient macro", wash: "#2B2A28" },
  "fresh-linen": { key: "fresh-linen", label: "Fresh linen", tags: ["powdery", "musky", "fresh"], art: "Fresh linen — ingredient macro", wash: "#E9E4D3" },
  "warm-skin": { key: "warm-skin", label: "Warm skin", tags: ["sweet", "gourmand", "amber", "musky"], art: "Warm skin — ingredient macro", wash: "#E3CFC4" },
  "wild-garden": { key: "wild-garden", label: "Wild garden", tags: ["floral", "fruity"], art: "Wild garden — ingredient macro", wash: "#DDE9C8" },
};

export const moodOrder: MoodKey[] = ["sea-air", "golden-hour", "after-dark", "fresh-linen", "warm-skin", "wild-garden"];

/** Collections the shop understands, by slug. */
export type CollectionDef = {
  slug: string;
  title: string;
  descriptor: string;
  kind: "all" | "line" | "family" | "mood" | "bestsellers" | "new";
  key?: string;
};

export const collections: CollectionDef[] = [
  { slug: "all", kind: "all", title: "All scents", descriptor: "Every scent in the house, across the three lines." },
  { slug: "her", kind: "line", key: "eterna", title: "eterna", descriptor: "For her — florals, fruits and soft musks, composed to be remembered." },
  { slug: "him", kind: "line", key: "eterno", title: "eterno", descriptor: "For him — woods, citrus and amber, composed for the man people ask about." },
  { slug: "unisex", kind: "line", key: "eternal", title: "eternal", descriptor: "For both — shared signatures that sit close to the skin." },
  { slug: "bestsellers", kind: "bestsellers", title: "Bestsellers", descriptor: "Most worn this month, across the three lines." },
  { slug: "new", kind: "new", title: "New arrivals", descriptor: "The latest compositions to join the house." },
  ...familyOrder.map((k) => ({ slug: k, kind: "family" as const, key: k, title: families[k].label, descriptor: `${families[k].label} — the scents that open that way.` })),
  ...moodOrder.map((k) => ({ slug: k, kind: "mood" as const, key: k, title: moods[k].label, descriptor: `For when you know the feeling but not the notes.` })),
];

export const collectionBySlug = (slug: string) => collections.find((c) => c.slug === slug);
