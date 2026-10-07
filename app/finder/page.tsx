import type { Metadata } from "next";
import { headers } from "next/headers";
import { pageMeta } from "@/lib/metadata";
import { Finder } from "@/components/finder/Finder";
import { getScent, getScentIndex, toIndexEntry } from "@/lib/catalogue";
import { finderQuestions } from "@/content/finder";
import { answersFromParams, answersToParams, firstUnanswered, rankMatches } from "@/lib/finder";
import { siteImage } from "@/lib/site-images";
import { site } from "@/content/site";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const base: Metadata = pageMeta({
  title: "Scent finder — five questions, three matches",
  description: "Answer five quick questions and get three scents from across the house, each with its price and one tap to add it. No sign-up.",
  path: "/finder",
  image: siteImage("finder-band"),
});

/** The request's query as URLSearchParams, first value of each key. */
const toParams = (raw: Awaited<SearchParams>) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    const first = Array.isArray(v) ? v[0] : v;
    if (first !== undefined) params.set(k, first);
  }
  return params;
};

/*
 * Rendered per request: the URL is the finder's state, so a shared results
 * link (or a tap on a tile before the script loads) paints that screen first,
 * with the matches named in the link preview.
 */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const answers = answersFromParams(toParams(await searchParams));
  if (firstUnanswered(answers) < finderQuestions.length) return base;
  const matches = rankMatches(await getScentIndex(), answers, 3).map((m) => m.entry.title);
  return pageMeta({
    title: "My three eternal matches",
    absolute: true,
    description: `${matches.join(", ")}: three matches from the eternal scent finder. Five questions, no sign-up.`,
    path: "/finder",
    image: siteImage("finder-band"),
    noindex: true,
  });
}

export default async function FinderPage({ searchParams }: { searchParams: SearchParams }) {
  const [index, mysteryBox, raw, h] = await Promise.all([getScentIndex(), getScent("mystery-box"), searchParams, headers()]);
  const params = toParams(raw);
  // Only the finder's own state: valid answers and the question number, so the server and the browser open the same screen.
  const state = answersToParams(answersFromParams(params));
  const q = params.get("q");
  if (q && /^\d+$/.test(q)) state.set("q", q);
  const initialSearch = state.toString() ? `?${state.toString()}` : "";
  // One tile per answer, resolved here so the client component stays serialisable.
  const tiles: Record<string, string | null> = {};
  for (const question of finderQuestions) {
    for (const o of question.options) tiles[`${question.id}-${o.id}`] = siteImage([`finder-${question.id}-${o.id}`, ...(o.stills ?? [])]);
  }
  // The address the visitor is on, for the results link they share: the server renders the results too, where there is no window.
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = host && /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? `${h.get("x-forwarded-proto") === "http" ? "http" : "https"}://${host}` : site.url;
  return (
    <Finder
      index={index}
      mysteryBox={mysteryBox ? toIndexEntry(mysteryBox) : null}
      boxImage={siteImage(["products/mystery-box", "mystery-box"])}
      tiles={tiles}
      initialSearch={initialSearch}
      origin={origin}
    />
  );
}
