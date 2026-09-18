/**
 * The scent finder: five questions, one per screen. Every option maps to
 * tags on the products; results are all scents ranked by tag overlap.
 */
export type FinderOption = { id: string; label: string; art: string; tags: string[]; line?: "eterna" | "eterno" | "eternal"; reason: string };
export type FinderQuestion = { id: string; eyebrow: string; title: string; help: string; max: number; options: FinderOption[] };

export const finderQuestions: FinderQuestion[] = [
  {
    id: "who",
    eyebrow: "Who is it for?",
    title: "Who will wear it?",
    help: "Pick one. Every line has its own signatures; unisex sits between them.",
    max: 1,
    options: [
      { id: "her", label: "Her", art: "eterna — soft light on linen", tags: [], line: "eterna", reason: "her" },
      { id: "him", label: "Him", art: "eterno — stone and low sun", tags: [], line: "eterno", reason: "him" },
      { id: "either", label: "Either of us", art: "eternal — bone and shadow", tags: [], line: "eternal", reason: "either of you" },
      { id: "any", label: "Surprise me", art: "All three lines", tags: [], reason: "any line" },
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
      { id: "both", label: "All day, into the night", art: "Golden hour on stone", tags: ["musky", "woody", "sweet"], reason: "day into night" },
    ],
  },
  {
    id: "mood",
    eyebrow: "Mood",
    title: "Which feeling do you want to carry?",
    help: "Pick up to two. We use it to narrow the scents to the ones that match your mood, not just your notes.",
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
    help: "Pick one. The place says more about your taste than a note list does.",
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
    title: "How close should people have to stand?",
    help: "Pick one. Projection is a choice, not a rating.",
    max: 1,
    options: [
      { id: "soft", label: "Close to the skin", art: "Linen weave", tags: ["musky", "powdery", "fresh"], reason: "worn close" },
      { id: "present", label: "An arm’s length", art: "Frosted glass", tags: ["woody", "floral", "citrus"], reason: "present" },
      { id: "loud", label: "The whole room", art: "Resin and smoke", tags: ["amber", "sweet", "smoky", "spicy"], reason: "made to be noticed" },
    ],
  },
];
