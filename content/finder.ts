import { families, familyOrder, familyStills } from "./taxonomy";

/**
 * The scent finder: five questions, one per screen. Who sets the pool of
 * scents; every other answer carries tags that lib/finder.ts matches against
 * each scent's tags, weighted by its question. Strength matches a scent's
 * sillage where Shopify or content/scents.ts gives one, else its tags.
 * `sub` names the line next to its audience, because the three line names
 * differ by one letter. `stills` are the images a tile falls back to until
 * its own (finder-<question>-<answer>) is installed.
 */
export type FinderOption = {
  id: string;
  label: string;
  sub?: string;
  art: string;
  tags: string[];
  line?: "eterna" | "eterno" | "eternal";
  /** Strength answers: the sillage band (1–10, whole numbers, both ends included) they stand for. */
  sillage?: [number, number];
  stills?: string[];
  reason: string;
};
export type FinderQuestion = { id: string; eyebrow: string; title: string; help: string; max: number; weight: number; options: FinderOption[] };

export const finderQuestions: FinderQuestion[] = [
  {
    id: "who",
    eyebrow: "Who is it for?",
    title: "Who will wear it?",
    help: "Pick one. Each line is made for someone; eternal is shared.",
    max: 1,
    weight: 0,
    options: [
      { id: "her", label: "Her", sub: "eterna", art: "eterna — soft light on linen", tags: [], line: "eterna", reason: "her" },
      { id: "him", label: "Him", sub: "eterno", art: "eterno — stone and low sun", tags: [], line: "eterno", reason: "him" },
      { id: "either", label: "Either of us", sub: "eternal, unisex", art: "eternal — bone and shadow", tags: [], line: "eternal", reason: "either of you" },
      { id: "any", label: "Surprise me", sub: "all three lines", art: "All three lines", tags: [], reason: "any line" },
    ],
  },
  {
    id: "time",
    eyebrow: "Time of day",
    title: "When will you wear it most?",
    help: "Pick one. Daytime scents open bright; night scents settle darker.",
    max: 1,
    weight: 1,
    options: [
      { id: "day", label: "Daytime", art: "Morning light on sea water", tags: ["fresh", "citrus", "aquatic", "fruity"], reason: "daytime" },
      { id: "night", label: "Night", art: "Candle on a dinner table", tags: ["amber", "woody", "smoky", "spicy"], reason: "night" },
      { id: "both", label: "Day into night", art: "Golden hour on stone", tags: ["musky", "woody", "sweet"], reason: "day into night" },
    ],
  },
  {
    id: "notes",
    eyebrow: "Notes",
    title: "Which notes draw you in?",
    help: "Pick up to two.",
    max: 2,
    weight: 2,
    options: familyOrder.map((k) => ({
      id: k,
      label: families[k].label,
      art: `${families[k].label} — ingredient still`,
      tags: families[k].tags,
      stills: familyStills[k],
      reason: `${families[k].label.toLowerCase()} notes`,
    })),
  },
  {
    id: "place",
    eyebrow: "A place you love",
    title: "Where would you rather be right now?",
    help: "Pick one. Go with the first place you picture.",
    max: 1,
    weight: 1,
    options: [
      { id: "greek-island", label: "A Greek island", art: "Whitewashed steps, sea glare, lemon trees", tags: ["aquatic", "citrus", "fresh"], stills: ["finder-place-coast", "mood-sea-air"], reason: "a Greek island" },
      { id: "paris-cafe", label: "A Paris café at night", art: "Zinc bar, crème brûlée, warm lamps", tags: ["sweet", "gourmand", "amber"], stills: ["finder-place-kitchen", "mood-warm-skin"], reason: "a Paris café" },
      { id: "marrakech-souk", label: "A Marrakech souk", art: "Spice cones, brass lanterns, smoke", tags: ["spicy", "amber", "smoky"], stills: ["finder-mood-after-dark", "mood-after-dark"], reason: "a Marrakech souk" },
      { id: "kyoto-garden", label: "A Kyoto garden", art: "Moss, blossom, a paper screen", tags: ["floral", "fruity", "powdery"], stills: ["finder-place-garden", "mood-wild-garden"], reason: "a Kyoto garden" },
      { id: "mountain-cabin", label: "A mountain cabin", art: "Cedar logs, a fire, wool", tags: ["woody", "smoky", "musky"], stills: ["family-woody", "products/raw-seduction-3"], reason: "a mountain cabin" },
    ],
  },
  {
    id: "strength",
    eyebrow: "Strength",
    title: "How close should people stand?",
    help: "Pick one. Projection is a choice, not a rating.",
    max: 1,
    weight: 1,
    options: [
      { id: "soft", label: "Close to the skin", art: "Linen weave", tags: ["musky", "powdery", "fresh"], sillage: [1, 4], reason: "worn close" },
      { id: "present", label: "Arm’s length", art: "Frosted glass", tags: ["woody", "floral", "citrus"], sillage: [5, 7], reason: "arm’s length" },
      { id: "loud", label: "Fills the room", art: "Resin and smoke", tags: ["amber", "sweet", "smoky", "spicy"], sillage: [8, 10], reason: "fills the room" },
    ],
  },
];
