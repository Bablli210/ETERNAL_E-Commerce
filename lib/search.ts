import type { ScentIndexEntry } from "./catalogue";
import { families, lines, moods } from "@/content/taxonomy";
import { track } from "@/lib/client/analytics";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Predictive search over the catalogue: names, the original each scent is
 * inspired by, notes, families, moods and the line with its audience ("for
 * him"). The inspired-by name is the dominant intent ("Blue Talisman"), so it
 * scores as high as the name. In a query of several words the short ones
 * ("di" in "Acqua di Gio") are dropped, so they cannot match unrelated names.
 */
export function searchIndex(index: ScentIndexEntry[], query: string, limit = 6): { entry: ScentIndexEntry; matchedInspiredBy: boolean }[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const terms = words.length > 1 && words.some((t) => t.length >= 3) ? words.filter((t) => t.length >= 3) : words;
  return index
    .map((entry) => {
      const title = norm(entry.title);
      const titleWords = title.split(" ");
      const inspired = entry.inspiredBy ? norm(entry.inspiredBy) : "";
      const notes = norm(entry.notesShort.join(" "));
      const kinds = norm([...entry.families.map((f) => families[f].label), ...entry.moods.map((m) => moods[m].label), ...entry.tags].join(" "));
      const line = entry.line ? norm(`${lines[entry.line].label} for ${lines[entry.line].audience}`) : "";
      let score = 0;
      let matchedInspiredBy = false;
      for (const t of terms) {
        if (titleWords.some((w) => w.startsWith(t))) score += 6;
        else if (title.includes(t)) score += 4;
        if (inspired.includes(t)) {
          score += 5;
          matchedInspiredBy = true;
        }
        if (notes.includes(t)) score += 2;
        if (kinds.includes(t)) score += 1.5;
        if (line.includes(t)) score += 1;
      }
      if (terms.every((t) => title.includes(t) || inspired.includes(t))) score += 3;
      return { entry, score, matchedInspiredBy };
    })
    .filter((r) => r.score > 0)
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
