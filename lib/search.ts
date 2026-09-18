import type { ScentIndexEntry } from "./catalogue";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Predictive search over the catalogue. The inspired-by name is the
 * dominant intent ("Blue Talisman"), so it scores as high as the title.
 */
export function searchIndex(index: ScentIndexEntry[], query: string, limit = 6): { entry: ScentIndexEntry; matchedInspiredBy: boolean }[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const terms = q.split(" ").filter(Boolean);
  return index
    .map((entry) => {
      const title = norm(entry.title);
      const inspired = entry.inspiredBy ? norm(entry.inspiredBy) : "";
      const notes = norm(entry.notesShort.join(" "));
      const tags = norm(entry.tags.join(" "));
      const line = norm(entry.lineLabel ?? "");
      let score = 0;
      let matchedInspiredBy = false;
      for (const t of terms) {
        if (title.startsWith(t)) score += 6;
        else if (title.includes(t)) score += 4;
        if (inspired && inspired.includes(t)) {
          score += 5;
          matchedInspiredBy = true;
        }
        if (notes.includes(t)) score += 2;
        if (tags.includes(t)) score += 1.5;
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
