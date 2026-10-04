import { families, lines, moods, type FamilyKey, type LineKey, type MoodKey } from "@/content/taxonomy";

export type Sort = "recommended" | "new" | "price-asc" | "price-desc" | "az";

export const sorts: { key: Sort; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price, low to high" },
  { key: "price-desc", label: "Price, high to low" },
  { key: "az", label: "A – Z" },
];

/**
 * Everything a collection grid shows that a link can carry, so an ad can
 * deep-link to it and Back from a product returns to the same grid:
 * `/shop?line=eterno&family=woody&sort=price-asc&all=1`, `/shop?q=vanilla`,
 * or `/shop?h=wayne,sapphire,destiny` for a carousel ad (only those scents,
 * in that order).
 */
export type GridState = {
  q: string;
  line: LineKey | null;
  family: FamilyKey | null;
  mood: MoodKey | null;
  sort: Sort;
  /** Every match shown, not only the first page. */
  all: boolean;
  /** Handles from a carousel ad. */
  h: string[];
};

export const defaultGridState: GridState = { q: "", line: null, family: null, mood: null, sort: "recommended", all: false, h: [] };

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

const own = <K extends string>(value: string, record: Record<K, unknown>): K | null => (Object.hasOwn(record, value) ? (value as K) : null);

/** Reads a grid state from a query string, ignoring anything it does not recognise. */
export function parseGridState(params: Params): GridState {
  const get = (key: string) => {
    const v = params instanceof URLSearchParams ? params.get(key) : params[key];
    return ((Array.isArray(v) ? v[0] : v) ?? "").trim();
  };
  const sort = get("sort");
  return {
    q: get("q").slice(0, 80),
    line: own(get("line"), lines),
    family: own(get("family"), families),
    mood: own(get("mood"), moods),
    sort: sorts.some((s) => s.key === sort) ? (sort as Sort) : "recommended",
    all: get("all") === "1",
    h: get("h")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[a-z0-9-]+$/.test(s))
      .slice(0, 12),
  };
}

const KEYS = ["h", "q", "line", "family", "mood", "sort", "all"];

/** `search` with the grid's keys replaced by this state's; anything else (utm_*, fbclid) is kept. */
export function mergeGridQuery(search: string, s: GridState): string {
  const p = new URLSearchParams(search);
  for (const k of KEYS) p.delete(k);
  new URLSearchParams(gridQuery(s)).forEach((v, k) => p.set(k, v));
  const qs = p.toString().replace(/%2C/g, ",");
  return qs ? `?${qs}` : "";
}

/** The query string for a state, defaults left out: "" or "?family=woody&sort=az". */
export function gridQuery(s: GridState): string {
  const p = new URLSearchParams();
  if (s.h.length) p.set("h", s.h.join(","));
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.line) p.set("line", s.line);
  if (s.family) p.set("family", s.family);
  if (s.mood) p.set("mood", s.mood);
  if (s.sort !== "recommended") p.set("sort", s.sort);
  if (s.all) p.set("all", "1");
  const qs = p.toString().replace(/%2C/g, ",");
  return qs ? `?${qs}` : "";
}
