/**
 * Shop by occasion: five occasions, each a hand-picked list of scents (by
 * Shopify handle). The lists are a proposal drawn from each scent's notes and
 * tags (the finder's time of day and places): warm amber, vanilla and smoke for
 * a date; clean musks and soft woods for every day; the scents that project for
 * an event; citrus and green notes outdoors; sea salt and tropical fruit by the
 * water. A scent may sit in two occasions.
 *
 * `occasionsLive` stays false until the owner approves the lists: until then no
 * page, menu link or home section shows them.
 */
export type OccasionKey = "date" | "everyday" | "event" | "outdoors" | "beach-side";

export const occasionsLive = false;

export const occasions: Record<OccasionKey, { key: OccasionKey; label: string; descriptor: string; still: string[]; world: { bg: string; accent: string; dark: boolean }; handles: string[] }> = {
  date: {
    key: "date",
    label: "Date",
    descriptor: "Vanilla, amber and smoke for the evening, worn close.",
    still: ["occasion-date", "mood-warm-skin"],
    world: { bg: "#E3CFC4", accent: "#7A4A2B", dark: false },
    handles: ["hundred-whispers", "mystique", "vanilla-blanche", "vintage-vanilla", "secret-no-7", "paradox", "raw-seduction", "wayne", "shadow-of-the-sea", "smoked-aura", "element", "neroli-code"],
  },
  everyday: {
    key: "everyday",
    label: "Everyday",
    descriptor: "Clean musks, soft woods and easy florals, for any day of the week.",
    still: ["occasion-everyday", "mood-fresh-linen"],
    world: { bg: "#E9E4D3", accent: "#5A5650", dark: false },
    handles: ["linen", "sapphire", "enzo-1898", "mercury", "harmony", "citron", "divina", "hera", "bloom", "aurora"],
  },
  event: {
    key: "event",
    label: "Event",
    descriptor: "Scents that fill a room, for weddings, dinners and nights out.",
    still: ["occasion-event", "mood-after-dark"],
    world: { bg: "#2B2A28", accent: "#B97A2B", dark: true },
    handles: ["icon", "atomic", "carbon", "cipher", "tonic-club", "smoked-aura", "destiny", "paradox", "aurora", "element"],
  },
  outdoors: {
    key: "outdoors",
    label: "Outdoors",
    descriptor: "Citrus, green notes and ginger, bright in the open air.",
    still: ["occasion-outdoors", "mood-golden-hour"],
    world: { bg: "#DDE9C8", accent: "#3E5A2E", dark: false },
    handles: ["forbidden-apple", "eden", "zesty-ginger", "ciel", "mercury", "oasis", "citron", "shore-club", "bloom"],
  },
  "beach-side": {
    key: "beach-side",
    label: "Beach Side",
    descriptor: "Sea salt, aquatic notes and tropical fruit, for days by the water.",
    still: ["occasion-beach-side", "mood-sea-air"],
    world: { bg: "#A9C4E4", accent: "#163A4E", dark: false },
    handles: ["aqua-marine", "atlantis", "poseidon", "golden-hour", "fiji", "caribbean-punch", "mango-eclipse", "shore-club", "eden"],
  },
};

export const occasionOrder: OccasionKey[] = ["date", "everyday", "event", "outdoors", "beach-side"];
