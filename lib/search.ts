import type { ScentIndexEntry } from "./catalogue";
import { families, moods, type LineKey } from "@/content/taxonomy";
import { track } from "@/lib/client/analytics";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Words that join a query ("for", "of the") and name nothing. */
const STOP = new Set(["for", "the", "by", "of", "and", "de", "di", "a", "an", "to"]);

/** Who a query is for: the audience words, and the line names that carry them. */
const AUDIENCE: Record<string, LineKey> = {
  her: "eterna", hers: "eterna", women: "eterna", woman: "eterna", womens: "eterna", ladies: "eterna", female: "eterna", feminine: "eterna", eterna: "eterna",
  him: "eterno", his: "eterno", men: "eterno", man: "eterno", mens: "eterno", male: "eterno", masculine: "eterno", eterno: "eterno",
  unisex: "eternal", both: "eternal", everyone: "eternal", eternal: "eternal",
};

/**
 * Predictive search over the catalogue: names, the original each scent is
 * inspired by, notes, families and moods. The inspired-by name is the
 * dominant intent ("Blue Talisman"), so it scores as high as the name. In a
 * query of several words the short ones ("di" in "Acqua di Gio") are dropped,
 * so they cannot match unrelated names, and joining words ("for") never match.
 *
 * Audience words ("for her", "men", "unisex", or a line's own name) choose the
 * line: alone they list that line; with other words they keep the matches in
 * that line, or every match when the line has none ("wayne for her").
 */
export function searchIndex(index: ScentIndexEntry[], query: string, limit = 6): { entry: ScentIndexEntry; matchedInspiredBy: boolean }[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const audience = new Set(words.map((w) => AUDIENCE[w]).filter((k): k is LineKey => Boolean(k)));
  const rest = words.filter((w) => !AUDIENCE[w] && !STOP.has(w));
  // A lone joining word ("for", typed on the way to "for him") still searches.
  const base = rest.length || audience.size ? rest : words;
  const terms = base.length > 1 && base.some((t) => t.length >= 3) ? base.filter((t) => t.length >= 3) : base;
  const forAudience = (e: ScentIndexEntry) => Boolean(e.line && audience.has(e.line));

  if (!terms.length) {
    // Only an audience: that line, real sellers and the house's picks first.
    return index
      .filter(forAudience)
      .sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || Number(b.isPick) - Number(a.isPick) || a.title.localeCompare(b.title))
      .slice(0, limit)
      .map((entry) => ({ entry, matchedInspiredBy: false }));
  }

  const scored = index
    .map((entry) => {
      const title = norm(entry.title);
      const titleWords = title.split(" ");
      const inspired = entry.inspiredBy ? norm(entry.inspiredBy) : "";
      const notes = norm(entry.notesShort.join(" "));
      const kinds = norm([...entry.families.map((f) => families[f].label), ...entry.moods.map((m) => moods[m].label), ...entry.tags].join(" "));
      let score = 0;
      let matchedInspiredBy = false;
      for (const t of terms) {
        if (titleWords.some((w) => w.startsWith(t))) score += 6;
        // Inside a word only from four letters, so "her" never finds "Cipher".
        else if (t.length >= 4 && title.includes(t)) score += 4;
        if (inspired.includes(t)) {
          score += 5;
          matchedInspiredBy = true;
        }
        if (notes.includes(t)) score += 2;
        if (kinds.includes(t)) score += 1.5;
      }
      if (terms.every((t) => title.includes(t) || inspired.includes(t))) score += 3;
      return { entry, score, matchedInspiredBy };
    })
    .filter((r) => r.score > 0);
  const inLine = audience.size ? scored.filter((r) => forAudience(r.entry)) : scored;
  return (inLine.length ? inLine : scored)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit)
    .map(({ entry, matchedInspiredBy }) => ({ entry, matchedInspiredBy }));
}

const reported = new Set<string>();

/**
 * Sends one search event per distinct term per visit, with how many scents
 * matched. The terms that match nothing are the originals visitors look for
 * and the catalogue does not name yet.
 */
export function reportSearch(term: string, results: number) {
  const key = norm(term);
  if (key.length < 2 || reported.has(key)) return;
  reported.add(key);
  track({ name: "search", term: term.trim(), results });
}
