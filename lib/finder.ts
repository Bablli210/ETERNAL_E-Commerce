import { finderQuestions, type FinderOption } from "@/content/finder";
import type { ScentIndexEntry } from "./catalogue";

export type Answers = Record<string, string[]>; // questionId -> optionIds

export type Match = { entry: ScentIndexEntry; reasons: string[] };

/** Where the finder keeps the last profile, for the order's quiz_profile cart attribute. */
export const QUIZ_PROFILE_KEY = "eternal.quiz.v1";

/**
 * The stored profile, as JSON: the answers as they read on an order
 * ("mood=after-dark,warm-skin", never "%2C") and when they were given, so
 * attribution can let an old profile expire as it does an old ad touch.
 */
export type QuizProfile = { profile: string; at: number };

/** The answers as one readable string, for the stored profile and the finder_complete event. */
export const profileOf = (answers: Answers) => decodeURIComponent(answersToParams(answers).toString());

/** The value to store under QUIZ_PROFILE_KEY when the finder is completed now. */
export const quizProfileRecord = (answers: Answers) => JSON.stringify({ profile: profileOf(answers), at: Date.now() } satisfies QuizProfile);

/** The stored profile while it is younger than `maxAge` ms, else null. One stored without a time (before it carried one) counts as expired. */
export function readQuizProfile(raw: string | null, maxAge: number, now = Date.now()): string | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<QuizProfile> | null;
    return typeof v?.profile === "string" && typeof v.at === "number" && now - v.at < maxAge ? v.profile : null;
  } catch {
    return null;
  }
}

/**
 * Three matches for any set of answers. The who question sets the pool: her
 * or him keeps that line and the unisex line, either of us keeps the unisex
 * line, surprise me keeps all three. Every other answer scores a point when
 * its tags meet the scent's, and the line itself scores so the chosen line
 * leads. Scents without a line carry no tags to match, so they only fill in
 * when the pool is short: every combination of answers returns `limit`.
 * Ties go to Shopify's best sellers, then to scents with a packshot.
 */
export function rankMatches(index: ScentIndexEntry[], answers: Answers, limit = 3): Match[] {
  const chosen: FinderOption[] = finderQuestions.flatMap((q) => q.options.filter((o) => (answers[q.id] ?? []).includes(o.id)));
  const line = chosen.find((o) => o.line)?.line ?? null;
  const scored = chosen.filter((o) => o.tags.length > 0);
  const inPool = (e: ScentIndexEntry) => Boolean(e.line) && (!line || e.line === line || (line !== "eternal" && e.line === "eternal"));

  const ranked = index
    .filter((e) => e.kind === "scent")
    .map((entry) => {
      const reasons = scored.filter((o) => o.tags.some((t) => entry.tags.includes(t))).map((o) => o.reason);
      const fit = !line || entry.line === line ? 1 : entry.line === "eternal" ? 0.5 : 0;
      return { entry, reasons, score: reasons.length + fit, pool: inPool(entry) };
    })
    .sort(
      (a, b) =>
        Number(b.pool) - Number(a.pool) ||
        b.score - a.score ||
        Number(b.entry.isBestseller) - Number(a.entry.isBestseller) ||
        Number(Boolean(b.entry.image)) - Number(Boolean(a.entry.image)) ||
        a.entry.title.localeCompare(b.entry.title),
    );
  return ranked.slice(0, limit).map(({ entry, reasons }) => ({ entry, reasons }));
}

export function summariseAnswers(answers: Answers): string[] {
  return finderQuestions.flatMap((q) => q.options.filter((o) => (answers[q.id] ?? []).includes(o.id)).map((o) => o.reason));
}

/** Answers as readable URL parameters (?who=her&mood=sea-air,golden-hour), so a link or the back button reopens them. */
export function answersToParams(answers: Answers): URLSearchParams {
  const params = new URLSearchParams();
  for (const q of finderQuestions) {
    const ids = answers[q.id];
    if (ids?.length) params.set(q.id, ids.join(","));
  }
  return params;
}

/** The inverse, keeping only options that exist and no more than each question allows. */
export function answersFromParams(params: URLSearchParams): Answers {
  const answers: Answers = {};
  for (const q of finderQuestions) {
    const ids = (params.get(q.id) ?? "")
      .split(",")
      .filter((id, i, all) => q.options.some((o) => o.id === id) && all.indexOf(id) === i)
      .slice(0, q.max);
    if (ids.length) answers[q.id] = ids;
  }
  return answers;
}

/** The first question without an answer, or the question count once all are answered. */
export const firstUnanswered = (answers: Answers) => {
  const i = finderQuestions.findIndex((q) => !answers[q.id]?.length);
  return i === -1 ? finderQuestions.length : i;
};
