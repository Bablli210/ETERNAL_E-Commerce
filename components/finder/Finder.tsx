"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { finderQuestions } from "@/content/finder";
import { site } from "@/content/site";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { answersFromParams, answersToParams, firstUnanswered, QUIZ_PROFILE_KEY, rankMatches, summariseAnswers, type Answers, type Match } from "@/lib/finder";
import { facts } from "@/lib/facts";
import { motionAllowed } from "@/lib/motion";
import { writeRaw } from "@/lib/client/storage";
import { track } from "@/lib/client/analytics";
import { formatMoney, joinNotes } from "@/lib/format";
import { useCart } from "@/components/cart/CartProvider";
import { AddToBagButton } from "@/components/cart/AddToBagButton";
import { ProductImage } from "@/components/product/ProductImage";
import { lineWithAudience } from "@/components/product/line";
import { ImageSlot } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Wordmark";

const total = finderQuestions.length;

/*
 * The URL is the finder's state: ?who=her&time=day&q=3 is question 3 with two
 * answers, and a full set of answers without q is the results. Each answer
 * pushes a history entry, so the phone's back gesture steps back a question,
 * and coming back from a match's product page reopens the matches.
 */
const CHANGE = "eternal:finder";
const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
};
const readSearch = () => window.location.search;
/** The server renders question 1, so the first screen paints before any script runs. */
const serverSearch = () => "";

const screenFrom = (search: string): { answers: Answers; step: number } => {
  const params = new URLSearchParams(search);
  const answers = answersFromParams(params);
  const open = firstUnanswered(answers);
  const q = Number(params.get("q"));
  return { answers, step: params.has("q") && q >= 1 ? Math.min(q - 1, open) : open };
};

const hrefFor = (answers: Answers, step: number) => {
  const params = answersToParams(answers);
  if (!params.toString()) return "/finder";
  if (step < total) params.set("q", String(step + 1));
  // Commas are legal in a query; leaving them bare keeps a shared link readable.
  return `/finder?${params.toString().replace(/%2C/g, ",")}`;
};

const navigate = (href: string, mode: "push" | "replace") => {
  if (mode === "push") window.history.pushState(null, "", href);
  else window.history.replaceState(null, "", href);
  window.dispatchEvent(new Event(CHANGE));
};

/** Single-choice answers move on by themselves, after the choice has shown. */
const ADVANCE_MS = 280;

export function Finder({ index, mysteryBox, boxImage, tiles }: { index: ScentIndexEntry[]; mysteryBox: ScentIndexEntry | null; boxImage: string | null; tiles: Record<string, string | null> }) {
  const search = useSyncExternalStore(subscribe, readSearch, serverSearch);
  const { answers, step } = useMemo(() => screenFrom(search), [search]);
  const [direction, setDirection] = useState<"fwd" | "back" | null>(null);
  const [composing, setComposing] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "manual">("idle");
  const { addMany } = useCart();
  const done = step >= total;
  const scents = index.filter((e) => e.kind === "scent").length;

  // The step this visit opened on: entries before it belong to another page, so Back replaces instead.
  const opened = useRef(0);
  const started = useRef(false);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    opened.current = screenFrom(window.location.search).step;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // Every screen starts at the top; the first paint keeps the browser's own position.
  const lastStep = useRef<number | null>(null);
  useEffect(() => {
    if (lastStep.current !== null && lastStep.current !== step) window.scrollTo({ top: 0 });
    lastStep.current = step;
  }, [step]);

  useEffect(() => {
    if (!composing) return;
    const t = window.setTimeout(() => setComposing(false), 1200);
    return () => window.clearTimeout(t);
  }, [composing]);

  const advance = () => {
    if (timer.current) window.clearTimeout(timer.current);
    // Read the URL, not the render: an auto-advance fires after the answer was written.
    const now = screenFrom(window.location.search);
    const question = finderQuestions[now.step];
    const picked = question && now.answers[question.id];
    if (!picked?.length) return;
    if (!started.current) {
      started.current = true;
      track({ name: "finder_start" });
    }
    track({ name: "finder_step", step: now.step + 1, question: question.id, answer: picked.join(",") });
    if (now.step === total - 1) {
      const profile = answersToParams(now.answers).toString();
      track({ name: "finder_complete", answers: profile, matches: rankMatches(index, now.answers, 3).map((m) => m.entry.handle) });
      writeRaw(QUIZ_PROFILE_KEY, profile);
      if (motionAllowed()) setComposing(true);
    }
    setDirection("fwd");
    navigate(hrefFor(now.answers, now.step + 1), "push");
  };

  const q = finderQuestions[Math.min(step, total - 1)];
  const chosen = answers[q.id] ?? [];
  const choose = (id: string) => {
    let picked: string[];
    if (q.max === 1) picked = [id];
    else if (chosen.includes(id)) picked = chosen.filter((x) => x !== id);
    else picked = [...chosen, id].slice(-q.max); // a third mood replaces the first
    const next = { ...answers, [q.id]: picked };
    if (!picked.length) delete next[q.id];
    navigate(hrefFor(next, step), "replace");
    if (q.max === 1) {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(advance, ADVANCE_MS);
    }
  };

  const back = () => {
    if (step === 0) return;
    setDirection("back");
    if (step > opened.current) window.history.back();
    else {
      opened.current = step - 1;
      navigate(hrefFor(answers, step - 1), "replace");
    }
  };

  const retake = () => {
    setDirection("back");
    setShareState("idle");
    opened.current = 0;
    navigate("/finder", "push");
  };

  const matches = useMemo(() => (done ? rankMatches(index, answers, 3) : []), [done, index, answers]);
  const summary = useMemo(() => summariseAnswers(answers), [answers]);
  const resultsUrl = () => `${window.location.origin}${hrefFor(answers, total)}`;

  const share = async () => {
    const url = resultsUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title: "My three eternal matches", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch (err) {
      // A cancelled share is not a failure; a refused clipboard shows the link to copy by hand.
      if (!(err instanceof DOMException && err.name === "AbortError")) setShareState("manual");
    }
  };

  if (composing) {
    return (
      <section className="wrap flex min-h-[60vh] flex-col items-center justify-center py-16 text-center" aria-live="polite">
        <Mark size={128} draw className="draw-slow text-night" />
        <p className="display-m mt-8">Composing your matches…</p>
        <p className="mt-2 text-[14px] text-ash">Reading your answers against {scents} scents.</p>
      </section>
    );
  }

  if (done) {
    const trio = matches.length === 3 && matches.every((m) => m.entry.sample?.availableForSale);
    const trioPrice = trio ? matches.reduce((n, m) => n + parseFloat(m.entry.sample!.price.amount), 0) : 0;
    const addTrio = () =>
      addMany(
        matches.map(({ entry: e }) => ({
          variantId: e.sample!.id,
          numericId: e.sample!.numericId,
          productId: e.productId,
          handle: e.handle,
          title: e.title,
          variantLabel: e.sample!.label,
          kind: "sample" as const,
          price: e.sample!.price,
          image: e.image,
          lineLabel: e.lineLabel,
          world: e.world,
        })),
      );
    const waText = () => encodeURIComponent(`Hello eternal, my finder matches are ${matches.map((m) => m.entry.title).join(", ")}. ${resultsUrl()}`);
    return (
      <section className="wrap pb-12 pt-6 lg:py-16">
        <p className="eyebrow text-ash">Your matches</p>
        <h1 className="mt-2 font-serif text-[32px] font-semibold leading-[1.08] lg:text-[clamp(36px,4vw,56px)]">Three to start with</h1>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-snug text-ash lg:text-[16px]">
          From {scents} scents, for {summary.join(" · ")}.
        </p>

        <ol className="mt-6 grid gap-6 md:mt-10 md:grid-cols-3 md:gap-x-6">
          {matches.map((m, i) => (
            <li key={m.entry.handle}>
              <MatchCard match={m} position={i} />
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-6">
          {trio ? (
            <div className="bg-paper p-5">
              <p className="text-[14px]">Not sure yet? Wear all three first.</p>
              <button type="button" className="btn btn-block mt-3" onClick={addTrio}>
                Try all 3 as {matches[0].entry.sample!.label} · {formatMoney({ amount: trioPrice, currencyCode: matches[0].entry.sample!.price.currencyCode })}
              </button>
              {facts.sampleCredit && <p className="mt-2 text-[12px] text-ash">{facts.sampleCredit}</p>}
            </div>
          ) : (
            mysteryBox?.bottle && (
              <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 bg-paper p-4">
                <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: mysteryBox.world.bg }}>
                  {boxImage && <Image src={boxImage} alt="" fill sizes="72px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-ash">Not ready for a bottle?</p>
                  <p className="font-serif text-[22px] font-semibold leading-tight">The mystery box</p>
                  <p className="mt-1 text-[14px] leading-snug text-ash">
                    Three {site.sampleSizeMl} ml scents, chosen by the house, so they may not be these three.
                  </p>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <AddToBagButton
                    variant={mysteryBox.bottle}
                    product={{ productId: mysteryBox.productId, handle: mysteryBox.handle, title: mysteryBox.title, image: mysteryBox.image, lineLabel: mysteryBox.lineLabel, world: mysteryBox.world }}
                    kind="set"
                    block
                    label={`Add the box · ${formatMoney(mysteryBox.bottle.price)}`}
                  />
                  <Link href={`/products/${mysteryBox.handle}`} className="mx-auto inline-flex min-h-11 items-center text-[13px] font-semibold">
                    <span className="lnk">What is inside</span>
                  </Link>
                </div>
              </div>
            )
          )}

          <div className="flex flex-col gap-3">
            {facts.whatsapp && (
              <a
                href={`https://wa.me/${facts.whatsapp}?text=${waText()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-block"
                onClick={() => track({ name: "generate_lead", method: "whatsapp_finder" })}
              >
                <Icon name="whatsapp" size={18} /> Send my matches to WhatsApp
              </a>
            )}
            <div className="flex flex-wrap items-center gap-x-6">
              <button type="button" className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold" onClick={share}>
                <span className="lnk lnk-quiet">{shareState === "copied" ? "Link copied" : "Share my matches"}</span> <Icon name="share" size={14} />
              </button>
              <button type="button" className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold" onClick={retake}>
                <span className="lnk lnk-quiet">Start again</span> <Icon name="refresh" size={14} />
              </button>
            </div>
            {shareState === "manual" && (
              <label className="block text-[12px] text-ash">
                Copy this link
                <input readOnly value={resultsUrl()} onFocus={(e) => e.currentTarget.select()} className="field mt-1 !h-11 !text-[16px]" />
              </label>
            )}
          </div>
        </div>
        <p className="mt-6 text-[12px] text-ash">No sign-up. Your answers only shape your matches.</p>
      </section>
    );
  }

  const showNext = q.max > 1 || chosen.length > 0;
  const cols = q.options.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4";
  const shape = q.options.length === 3 ? "aspect-[4/5] lg:aspect-[4/3]" : "aspect-[16/9] lg:aspect-[4/3]";
  return (
    <section className="wrap pb-10 pt-2 lg:py-12">
      <div className="flex h-11 items-center justify-between">
        {step > 0 ? (
          <button type="button" className="-ml-2 inline-flex h-11 items-center gap-1.5 px-2 text-[13px] font-semibold hover:text-sea" onClick={back}>
            <Icon name="arrow-left" size={16} /> Back
          </button>
        ) : (
          <span className="text-[12px] text-ash">Five questions, three matches</span>
        )}
        <p className="tnum text-[12px] text-ash">
          {step + 1} of {total}
        </p>
      </div>
      <div className="h-[2px] w-full bg-dune" role="progressbar" aria-label="Finder progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
        {/* F1: the progress bar fills. */}
        <div className="progress-fill h-full bg-night" style={{ transform: `scaleX(${(step + 1) / total})` }} />
      </div>

      {/* F1: screens slide in once the visitor moves; the first screen paints as it is. */}
      <div key={step} className={direction === "fwd" ? "screen-fwd" : direction === "back" ? "screen-back" : ""}>
        <p className="eyebrow mt-6 hidden text-ash lg:block">{q.eyebrow}</p>
        <h1 className="mt-4 font-serif text-[30px] font-semibold leading-[1.1] lg:mt-3 lg:text-[clamp(36px,4vw,56px)]">{q.title}</h1>
        <p className="mt-2 text-[15px] leading-snug text-ash lg:text-[17px]">{q.help}</p>

        <ul className={`mt-5 grid gap-2 lg:mt-10 lg:gap-4 ${cols}`} role="group" aria-label={q.title}>
          {q.options.map((o) => {
            const on = chosen.includes(o.id);
            const src = tiles[`${q.id}-${o.id}`];
            return (
              <li key={o.id}>
                {/* F2: the chosen tile takes a Night ring and a check; the others dim. */}
                <button type="button" aria-pressed={on} onClick={() => choose(o.id)} className={`tile relative block w-full overflow-hidden bg-sand text-left ${shape}`}>
                  {src ? (
                    <Image src={src} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className={`object-cover transition-opacity duration-200 ${chosen.length && !on ? "opacity-60" : ""}`} />
                  ) : (
                    <ImageSlot label={o.art} className="absolute inset-0" />
                  )}
                  <span aria-hidden="true" className={`pointer-events-none absolute inset-0 z-10 ${on ? "shadow-[inset_0_0_0_3px_var(--color-night)]" : ""}`} />
                  <span className="absolute inset-x-2 bottom-2 z-10 flex lg:inset-x-3 lg:bottom-3">
                    <span className="bg-linen/95 px-2 py-1">
                      <span className="block font-serif text-[18px] font-semibold leading-[1.1] lg:text-[22px]">{o.label}</span>
                      {o.sub && <span className="block text-[12px] leading-tight text-ash">{o.sub}</span>}
                    </span>
                  </span>
                  {on && (
                    <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center bg-night text-linen">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="draw" aria-hidden="true">
                        <path pathLength={1} d="m5 12 5 5L20 7" style={{ animationDuration: "200ms" }} />
                      </svg>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {showNext && (
        <button type="button" className="btn btn-block mt-5 lg:mt-8 lg:w-auto" onClick={advance} disabled={chosen.length === 0}>
          {step === total - 1 ? "See my matches" : "Next"} <Icon name="arrow-right" size={16} className="btn-arrow" />
        </button>
      )}
      <p className="mt-5 text-[12px] text-ash">No sign-up. Your answers only shape your matches.</p>
    </section>
  );
}

/** One match, decided without a click: line and audience, name, inspired-by, notes, why it matched, and its price on the Add button. */
function MatchCard({ match, position }: { match: Match; position: number }) {
  const e = match.entry;
  const product = { productId: e.productId, handle: e.handle, title: e.title, image: e.image, lineLabel: e.lineLabel, world: e.world };
  const select = () =>
    track({ name: "select_item", list: "finder", index: position, item: { productId: e.productId, variantId: e.bottle?.numericId ?? e.productId, name: e.title, price: parseFloat(e.price.amount), variant: e.bottle?.label, category: e.lineLabel } });
  return (
    <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 md:grid-cols-1 md:gap-0">
      <Link href={`/products/${e.handle}`} onClick={select} tabIndex={-1} aria-hidden="true" className="relative block self-start">
        <ProductImage src={e.image} alt="" world={e.world} sizes="(min-width: 768px) 30vw, 112px" className="aspect-[4/5] w-full" />
        {position === 0 && <span className="badge absolute left-2 top-2">Best match</span>}
      </Link>
      <div className="flex min-w-0 flex-col md:pt-4">
        {e.line && <p className="text-[12px] text-ash">{lineWithAudience(e.line)}</p>}
        <h2 className="font-serif text-[24px] font-semibold leading-[1.1] md:text-[28px]">
          <Link href={`/products/${e.handle}`} onClick={select} className="relative hover:text-sea before:absolute before:inset-x-0 before:-inset-y-2 before:content-['']">
            {e.title}
          </Link>
        </h2>
        {e.inspiredBy && (
          <p className="mt-1 text-[14px] leading-snug">
            Inspired by <span className="font-semibold">{e.inspiredBy}</span>
            <span className="text-ash"> · our own composition</span>
          </p>
        )}
        {e.notesShort.length > 0 && <p className="mt-1 text-[14px] leading-snug text-ash">{joinNotes(e.notesShort)}</p>}
        {match.reasons.length > 0 && <p className="mt-1 text-[12px] leading-snug text-gold-text">Matched on {match.reasons.join(", ")}</p>}
        {e.bottle && (
          <div className="mt-3">
            <AddToBagButton variant={e.bottle} product={product} size="sm" block label={`Add ${e.bottle.label} · ${formatMoney(e.bottle.price)}`} />
          </div>
        )}
      </div>
    </article>
  );
}
