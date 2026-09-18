import { finderQuestions, type FinderOption } from "@/content/finder";
import type { ScentIndexEntry } from "./catalogue";

export type Answers = Record<string, string[]>; // questionId -> optionIds

export type Match = { entry: ScentIndexEntry; percent: number; reasons: string[] };

/**
 * Results = every scent ranked by overlap between the chosen options' tags
 * and the product's tags. The line question filters; everything else scores.
 */
export function rankMatches(index: ScentIndexEntry[], answers: Answers, limit = 3): Match[] {
  const chosen: FinderOption[] = finderQuestions.flatMap((q) => q.options.filter((o) => (answers[q.id] ?? []).includes(o.id)));
  const lineChoice = chosen.find((o) => o.line)?.line ?? null;
  const scored = chosen.filter((o) => o.tags.length > 0);
  const maxScore = scored.length + 1;

  return index
    .filter((e) => e.kind === "scent")
    .filter((e) => !lineChoice || lineChoice === "eternal" || !e.line || e.line === lineChoice || e.line === "eternal")
    .map((entry) => {
      let score = 0;
      const reasons: string[] = [];
      for (const opt of scored) {
        if (opt.tags.some((t) => entry.tags.includes(t))) {
          score += 1;
          reasons.push(opt.reason);
        }
      }
      if (lineChoice && entry.line === lineChoice) {
        score += 1;
      } else if (lineChoice && entry.line === "eternal") {
        score += 0.5;
      } else if (!lineChoice) {
        score += 0.5;
      }
      if (entry.isBestseller) score += 0.15; // tiebreak toward proven scents
      if (entry.image) score += 0.05; // tiebreak toward scents with a packshot
      const percent = Math.max(0, Math.min(99, Math.round((score / maxScore) * 100)));
      return { entry, percent, reasons };
    })
    .sort((a, b) => b.percent - a.percent || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit);
}

export function summariseAnswers(answers: Answers): string[] {
  return finderQuestions.flatMap((q) => q.options.filter((o) => (answers[q.id] ?? []).includes(o.id)).map((o) => o.reason));
}
