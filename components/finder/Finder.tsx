"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { finderQuestions } from "@/content/finder";
import { site } from "@/content/site";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { rankMatches, summariseAnswers, type Answers } from "@/lib/finder";
import { useCart } from "@/components/cart/CartProvider";
import { ProductCard } from "@/components/product/ProductCard";
import { ImageSlot } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/format";

const encode = (a: Answers) => btoa(encodeURIComponent(JSON.stringify(a)));
const decode = (s: string): Answers | null => {
  try {
    return JSON.parse(decodeURIComponent(atob(s))) as Answers;
  } catch {
    return null;
  }
};

export function Finder({ index, mysteryBox }: { index: ScentIndexEntry[]; mysteryBox: ScentIndexEntry | null }) {
  const total = finderQuestions.length;
  // A shared link restores the answers and opens on the results.
  const searchParams = useSearchParams();
  const shared = useMemo(() => {
    const a = searchParams.get("a");
    return a ? decode(a) : null;
  }, [searchParams]);
  const [step, setStep] = useState(shared ? total : 0);
  const [answers, setAnswers] = useState<Answers>(shared ?? {});
  const [copied, setCopied] = useState(false);
  const { addMany } = useCart();
  const done = step >= total;

  const q = finderQuestions[Math.min(step, total - 1)];
  const chosen = answers[q.id] ?? [];
  const toggle = (id: string) => {
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (cur.includes(id)) return { ...prev, [q.id]: cur.filter((x) => x !== id) };
      if (q.max === 1) return { ...prev, [q.id]: [id] };
      if (cur.length >= q.max) return prev;
      return { ...prev, [q.id]: [...cur, id] };
    });
  };
  const next = () => setStep((s) => Math.min(total, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const retake = () => {
    setAnswers({});
    setStep(0);
    window.history.replaceState(null, "", "/finder");
  };

  const matches = useMemo(() => (done ? rankMatches(index, answers, 3) : []), [done, index, answers]);
  const summary = useMemo(() => summariseAnswers(answers), [answers]);
  const trio = matches.every((m) => m.entry.sample?.availableForSale) && matches.length === 3;
  const trioPrice = trio ? matches.reduce((n, m) => n + parseFloat(m.entry.sample!.price.amount), 0) : 0;

  const share = async () => {
    const url = `${window.location.origin}/finder?a=${encode(answers)}`;
    window.history.replaceState(null, "", url);
    try {
      if (navigator.share) {
        await navigator.share({ title: "My three eternal matches", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* cancelled */
    }
  };

  const addTrio = () =>
    addMany(
      matches.map((m) => ({
        variantId: m.entry.sample!.id,
        numericId: m.entry.sample!.numericId,
        handle: m.entry.handle,
        title: m.entry.title,
        variantLabel: m.entry.sample!.label,
        kind: "sample" as const,
        price: m.entry.sample!.price,
        image: m.entry.image,
        lineLabel: m.entry.lineLabel,
        world: m.entry.world,
      })),
    );

  if (done) {
    return (
      <section className="wrap py-10 lg:py-16">
        <p className="tnum text-[12px] text-ash">Step {total} of {total}</p>
        <h1 className="display-l mt-3">Your three matches</h1>
        <p className="body-l mt-3 max-w-[60ch] text-ash">
          Chosen from {index.filter((e) => e.kind === "scent").length} scents for {summary.length ? summary.join(", ") : "you"}.
        </p>
        <div className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-3">
          {matches.map((m, i) => (
            <div key={m.entry.handle} data-reveal style={{ ["--i" as string]: i }}>
              <ProductCard entry={m.entry} badge={`${m.percent}% match`} reason={m.reasons.slice(0, 3).join(", ") || undefined} />
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-dune pt-8 md:flex-row md:items-center md:justify-between">
          {trio ? (
            <button type="button" className="btn" onClick={addTrio}>
              Try all three as {site.sampleSizeMl} ml samples — {formatMoney({ amount: trioPrice, currencyCode: matches[0].entry.price.currencyCode })}
            </button>
          ) : mysteryBox ? (
            <Link href="/products/mystery-box" className="btn">
              Not ready for a bottle? The mystery box — three {site.sampleSizeMl} ml samples, {formatMoney(mysteryBox.price)}
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-5 text-[13px]">
            <button type="button" className="lnk lnk-quiet" onClick={share}>
              {copied ? "Link copied" : "Share results"} <Icon name="share" size={14} />
            </button>
            <button type="button" className="lnk lnk-quiet" onClick={retake}>
              Retake <Icon name="refresh" size={14} />
            </button>
          </div>
        </div>
        <p className="mt-6 text-[12px] text-ash">Your answers only shape the matches. Nothing is saved unless you share the link.</p>
      </section>
    );
  }

  return (
    <section className="wrap py-10 lg:py-16">
      <div className="flex items-center gap-2" aria-hidden="true">
        {finderQuestions.map((_, i) => (
          <span key={i} className={`h-1 w-8 ${i <= step ? "bg-night" : "bg-dune"}`} />
        ))}
      </div>
      <p className="tnum mt-4 text-[12px] text-ash">
        Step {step + 1} of {total} · {q.eyebrow}
      </p>
      <h1 className="display-l mt-3">{q.title}</h1>
      <p className="body-l mt-3 max-w-[56ch] text-ash">{q.help}</p>

      <ul className={`mt-10 grid gap-4 ${q.options.length > 4 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`} role="group" aria-label={q.title}>
        {q.options.map((o) => {
          const on = chosen.includes(o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o.id)}
                className={`group relative flex aspect-[4/3] w-full flex-col justify-end overflow-hidden p-4 text-left transition-transform duration-200 hover:-translate-y-1 ${on ? "ring-2 ring-night ring-offset-2 ring-offset-linen" : ""}`}
              >
                <ImageSlot label={o.art} className="absolute inset-0" />
                <span className="serif relative z-10 bg-linen/90 px-2 py-1 text-[20px] leading-none lg:text-[24px]">{o.label}</span>
                {on && (
                  <span className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center bg-night text-linen">
                    <Icon name="check" size={14} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 flex items-center justify-between border-t border-dune pt-6">
        <button type="button" className="btn btn-ghost" onClick={back} disabled={step === 0}>
          <Icon name="arrow-left" size={16} /> Back
        </button>
        <button type="button" className="btn" onClick={next} disabled={chosen.length === 0}>
          {step === total - 1 ? "See my matches" : "Next"} <Icon name="arrow-right" size={16} className="btn-arrow" />
        </button>
      </div>
      <p className="mt-6 text-[12px] text-ash">Your answers only shape the matches. Nothing is saved unless you share the link.</p>
    </section>
  );
}
