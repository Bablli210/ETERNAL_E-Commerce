import { finderQuestions, type FinderOption } from "@/content/finder";
import { families, moodToFamily, type MoodKey } from "@/content/taxonomy";
import type { ScentIndexEntry } from "./catalogue";

export type Answers = Record<string, string[]>; // questionId -> optionIds

export type Match = { entry: ScentIndexEntry; reasons: string[] };

/** Where the finder keeps the last profile, for the order's quiz_profile cart attribute. */
export const QUIZ_PROFILE_KEY = "eternal.quiz.v1";

/**
 * The stored profile, as JSON: the answers as they read on an order
 * ("notes=amber-spice,gourmand", never "%2C") and when they were given, so
 * attribution can let an old profile expire as it does an old ad touch.
 */
export type QuizProfile = { profile: string; at: number };

/** The answers in each question's own order, so the same choices read the same however they were tapped. */
const canonical = (answers: Answers): Answers =>
  Object.fromEntries(finderQuestions.map((q) => [q.id, q.options.filter((o) => (answers[q.id] ?? []).includes(o.id)).map((o) => o.id)]).filter(([, ids]) => ids.length));

/** The answers as one readable string, for the stored profile and the finder_complete event. */
export const profileOf = (answers: Answers) => decodeURIComponent(answersToParams(canonical(answers)).toString());

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

/** The tags the finder reads: scent tags only, never the line, audience or size tags a product also carries. */
const SCENT_TAGS = new Set(finderQuestions.flatMap((q) => q.options.flatMap((o) => o.tags)));

/** How much a scent in the chosen line leads a unisex scent of the same fit, in a her or him pool. */
const LINE_EDGE = 0.15;
/** What a strength answer is worth against a scent's known sillage: about what one answer's tags are worth. */
const STRENGTH = 0.4;
/** How far a match that repeats an earlier match's tags falls back, so three matches show some range. */
const VARIETY = 0.35;

/** A stable number per (answers, scent): equal scores order differently for different answers, never alphabetically. */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** 1 inside the answer's sillage band, 0.5 one step outside it, else 0. Sillage reads as a whole number from 1 to 10, so the bands leave no gaps. */
const bandFit = (sillage: number, [lo, hi]: [number, number]) => {
  const s = Math.min(10, Math.max(1, Math.round(sillage)));
  return s >= lo && s <= hi ? 1 : s >= lo - 1 && s <= hi + 1 ? 0.5 : 0;
};

/** Scores that are equal on paper can differ in the last bit; rounded, they tie and the tie-breaks decide. */
const settle = (n: number) => Math.round(n * 1e9) / 1e9;

const overlap = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return 0;
  const shared = a.filter((t) => b.includes(t)).length;
  return shared / (a.length + b.length - shared);
};

/**
 * Three matches for any set of answers. The who question sets the pool: her
 * or him keeps that line and the unisex line, either of us keeps the unisex
 * line, surprise me keeps all three. Scents outside the pool, and scents with
 * no scent tags, only fill in when the pool is short: every combination of
 * answers returns `limit`.
 *
 * Every other answer adds its question's weight to the tags it names, shared
 * among the answer's tags (and among the answers, where two are picked), and
 * a scent scores the weight on its own tags, divided by the square root of how
 * many it has: a scent tagged with everything does not match everything.
 * Strength reads a scent's sillage where one is set, else its tags. A scent
 * in the chosen line leads a unisex one of equal fit by LINE_EDGE. The second
 * and third matches give way a little to scents unlike the ones already
 * chosen, so the three show some range. Equal scores go to Shopify's best
 * sellers, then the house's picks, then scents with a packshot, then in an
 * order set by the answers themselves.
 */
export function rankMatches(index: ScentIndexEntry[], answers: Answers, limit = 3): Match[] {
  const picked = finderQuestions.map((q) => ({ q, options: q.options.filter((o) => (answers[q.id] ?? []).includes(o.id)) }));
  const chosen: FinderOption[] = picked.flatMap((p) => p.options);
  const line = chosen.find((o) => o.line)?.line ?? null;
  const seed = profileOf(answers);

  // What the answers ask for, tag by tag; strength apart, as it reads sillage first.
  const want = new Map<string, number>();
  const wantStrength = new Map<string, number>();
  let strength: { band: [number, number]; weight: number } | null = null;
  for (const { q, options } of picked) {
    for (const o of options) {
      if (!o.tags.length || !q.weight) continue;
      const share = q.weight / options.length;
      if (o.sillage) strength = { band: o.sillage, weight: share };
      const into = o.sillage ? wantStrength : want;
      for (const t of o.tags) into.set(t, (into.get(t) ?? 0) + share / o.tags.length);
    }
  }
  const inPool = (e: ScentIndexEntry) => Boolean(e.line) && (!line || e.line === line || (line !== "eternal" && e.line === "eternal"));

  const scored = index
    .filter((e) => e.kind === "scent")
    .map((entry) => {
      // A scent's own scent tags; a scent placed in a family only by its metafield reads as that family's tags.
      const own = entry.tags.filter((t) => SCENT_TAGS.has(t));
      const tags = own.length ? own : [...new Set(entry.families.flatMap((f) => families[f].tags))].filter((t) => SCENT_TAGS.has(t));
      const sillageKnown = typeof entry.sillage === "number" && strength !== null;
      let taste = 0;
      for (const t of tags) taste += (want.get(t) ?? 0) + (sillageKnown ? 0 : (wantStrength.get(t) ?? 0));
      taste = tags.length ? taste / Math.sqrt(tags.length) : 0;
      const strengthFit = sillageKnown && strength ? bandFit(entry.sillage as number, strength.band) : 0;
      const fit = line && line !== "eternal" && entry.line === line ? LINE_EDGE : 0;
      const reasons = chosen
        .filter((o) => (o.sillage && sillageKnown ? strengthFit === 1 : o.tags.some((t) => tags.includes(t))))
        .map((o) => o.reason);
      return { entry, tags, reasons, score: settle(taste + STRENGTH * (strength?.weight ?? 0) * strengthFit + fit), pool: inPool(entry) && tags.length > 0, tie: hash(`${seed}|${entry.handle}`) };
    })
    .sort(
      (a, b) =>
        Number(b.pool) - Number(a.pool) ||
        b.score - a.score ||
        Number(b.entry.isBestseller) - Number(a.entry.isBestseller) ||
        Number(b.entry.isPick) - Number(a.entry.isPick) ||
        Number(Boolean(b.entry.image)) - Number(Boolean(a.entry.image)) ||
        a.tie - b.tie,
    );

  // Greedy picks: each next match is the best score once its likeness to the matches already taken is counted against it.
  const out: typeof scored = [];
  const rest = [...scored];
  while (out.length < limit && rest.length) {
    let best = 0;
    if (out.length) {
      let bestValue = -Infinity;
      for (let i = 0; i < rest.length; i++) {
        const c = rest[i];
        // The pool still comes first: a scent outside it never outranks one inside.
        if (rest.some((r) => r.pool) && !c.pool) continue;
        const value = settle(c.score - VARIETY * Math.max(...out.map((o) => overlap(o.tags, c.tags))));
        if (value > bestValue) {
          bestValue = value;
          best = i;
        }
      }
    }
    out.push(rest.splice(best, 1)[0]);
  }
  return out.map(({ entry, reasons }) => ({ entry, reasons }));
}

export function summariseAnswers(answers: Answers): string[] {
  return finderQuestions.flatMap((q) => q.options.filter((o) => (answers[q.id] ?? []).includes(o.id)).map((o) => o.reason));
}

/** Answers as readable URL parameters (?who=her&notes=fresh,aquatic), so a link or the back button reopens them. */
export function answersToParams(answers: Answers): URLSearchParams {
  const params = new URLSearchParams();
  for (const q of finderQuestions) {
    const ids = answers[q.id];
    if (ids?.length) params.set(q.id, ids.join(","));
  }
  return params;
}

/** Answers from before the notes question: a mood reads as its scent family, a place as its nearest new place. */
const OLD_PLACE: Record<string, string> = { coast: "greek-island", city: "marrakech-souk", garden: "kyoto-garden", kitchen: "paris-cafe" };
function upgrade(params: URLSearchParams): URLSearchParams {
  const mood = params.get("mood");
  const place = params.get("place");
  if (!mood && !(place && OLD_PLACE[place])) return params;
  const next = new URLSearchParams(params);
  if (mood && !next.has("notes")) {
    const notes = [...new Set(mood.split(",").map((m) => moodToFamily[m as MoodKey]).filter(Boolean))].slice(0, 2);
    if (notes.length) next.set("notes", notes.join(","));
  }
  next.delete("mood");
  if (place && OLD_PLACE[place]) next.set("place", OLD_PLACE[place]);
  return next;
}

/** The inverse, keeping only options that exist and no more than each question allows. Links shared before the notes question still open their matches. */
export function answersFromParams(raw: URLSearchParams): Answers {
  const params = upgrade(raw);
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
