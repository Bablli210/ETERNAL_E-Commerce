/**
 * The scent finder: five questions, one per screen. Every option maps to
 * tags on the products; lib/finder.ts ranks the scents by tag overlap.
 * `sub` names the line next to its audience, because the three line names
 * differ by one letter.
 */
export type FinderOption = { id: string; label: string; sub?: string; art: string; tags: string[]; line?: "eterna" | "eterno" | "eternal"; reason: string };
export type FinderQuestion = { id: string; eyebrow: string; title: string; help: string; max: number; options: FinderOption[] };

export const finderQuestions: FinderQuestion[] = [
  {
    id: "who",
    eyebrow: "Who is it for?",
    title: "Who will wear it?",
    help: "Pick one. Each line is made for someone; eternal is shared.",
    max: 1,
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
    options: [
      { id: "day", label: "Daytime", art: "Morning light on sea water", tags: ["fresh", "citrus", "aquatic"], reason: "daytime" },
      { id: "night", label: "Night", art: "Candle on a dinner table", tags: ["amber", "woody", "smoky", "spicy"], reason: "night" },
      { id: "both", label: "Day into night", art: "Golden hour on stone", tags: ["musky", "woody", "sweet"], reason: "day into night" },
    ],
  },
  {
    id: "mood",
    eyebrow: "Mood",
    title: "Which feeling should it carry?",
    help: "Pick up to two.",
    max: 2,
    options: [
      { id: "sea-air", label: "Sea air", art: "Sea air — ingredient macro", tags: ["aquatic", "mineral", "fresh"], reason: "sea air" },
      { id: "golden-hour", label: "Golden hour", art: "Golden hour — ingredient macro", tags: ["citrus", "tropical", "fruity"], reason: "golden hour" },
      { id: "after-dark", label: "After dark", art: "After dark — ingredient macro", tags: ["amber", "smoky", "spicy", "woody"], reason: "after dark" },
      { id: "fresh-linen", label: "Fresh linen", art: "Fresh linen — ingredient macro", tags: ["powdery", "musky", "fresh"], reason: "fresh linen" },
      { id: "warm-skin", label: "Warm skin", art: "Warm skin — ingredient macro", tags: ["sweet", "gourmand", "amber", "musky"], reason: "warm skin" },
      { id: "wild-garden", label: "Wild garden", art: "Wild garden — ingredient macro", tags: ["floral", "fruity"], reason: "wild garden" },
    ],
  },
  {
    id: "place",
    eyebrow: "A place you love",
    title: "Where would you rather be right now?",
    help: "Pick one. A place says more about taste than a list of notes.",
    max: 1,
    options: [
      { id: "coast", label: "A quiet coast", art: "Wet stone, fog, harbour light", tags: ["aquatic", "mineral", "citrus"], reason: "the coast" },
      { id: "city", label: "A city at night", art: "Departures board, dusk", tags: ["woody", "amber", "spicy"], reason: "the city" },
      { id: "garden", label: "A walled garden", art: "Crab-apple tree, hotel entrance", tags: ["floral", "fruity", "powdery"], reason: "the garden" },
      { id: "kitchen", label: "A warm kitchen", art: "Vanilla pods and brown sugar", tags: ["sweet", "gourmand"], reason: "something warm" },
    ],
  },
  {
    id: "strength",
    eyebrow: "Strength",
    title: "How close should people stand?",
    help: "Pick one. Projection is a choice, not a rating.",
    max: 1,
    options: [
      { id: "soft", label: "Close to the skin", art: "Linen weave", tags: ["musky", "powdery", "fresh"], reason: "worn close" },
      { id: "present", label: "Arm’s length", art: "Frosted glass", tags: ["woody", "floral", "citrus"], reason: "arm’s length" },
      { id: "loud", label: "Fills the room", art: "Resin and smoke", tags: ["amber", "sweet", "smoky", "spicy"], reason: "fills the room" },
    ],
  },
];
