import type { ReactNode } from "react";
import Link from "next/link";
import { Accordion, Eyebrow, Meter, Price, SectionHead } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";
import { toIndexEntry, type Scent } from "@/lib/catalogue";
import { faqEntries } from "@/content/faq";
import { taleBySlug } from "@/content/tales";
import { families } from "@/content/taxonomy";
import { confirmed } from "@/lib/facts";
import { formatMoney, sentenceCase } from "@/lib/format";
import { siteImage } from "@/lib/site-images";
import { AddPairButton } from "./AddPairButton";
import { FaqTrack } from "./FaqTrack";
import { lineWithAudience } from "./line";
import { ProductImage } from "./ProductImage";

/** What each optional section needs before it renders. The page numbers only the sections that do. */
export const sectionReady = {
  differs: (s: Scent) => Boolean(s.inspiredBy && confirmed(s.comparison)),
  notes: (s: Scent) => Boolean(s.notes || s.description.trim()),
  wear: (s: Scent) => Boolean((s.wear && Object.values(s.wear).some(Boolean)) || s.longevity !== null || s.sillage !== null),
  tale: (s: Scent) => Boolean(s.taleSlug && taleBySlug(s.taleSlug) && s.story?.length),
};

/** Raises a text link's tap area to 44 px without moving its underline. */
const tapArea = "before:absolute before:inset-x-0 before:-inset-y-3 before:content-['']";

export function Differs({ scent, index }: { scent: Scent; index: string }) {
  return (
    <section className="row">
      <div className="cells lg:grid-cols-[1fr_2fr]">
        <div className="cell">
          <SectionHead index={index} title={`How it differs from ${scent.inspiredBy}`} stacked />
        </div>
        <div className="cell">
          <p className="body-l max-w-[60ch]">{confirmed(scent.comparison)}</p>
          <p className="mt-4 text-[12px] text-ash">Our own composition. Not affiliated with the original house.</p>
        </div>
      </div>
    </section>
  );
}

/**
 * What it smells like, as one answer in "Good to know": the notes as they
 * arrive on skin when the scent has them, else its description. The product
 * page has no notes section of its own; the three notes also sit under the name.
 */
export function notesAnswer(scent: Scent): ReactNode {
  if (scent.notes)
    return (
      <span className="grid gap-1">
        {scent.notes.map((n) => (
          <span key={n.stage}>
            <span className="font-semibold text-night">{n.stage}:</span> {n.name}
            {n.copy ? `. ${n.copy}` : ""}
          </span>
        ))}
      </span>
    );
  return scent.description.trim();
}

export function WearIt({ scent, index }: { scent: Scent; index: string }) {
  const wear = [
    ["Time", scent.wear?.time, "clock"],
    ["Season", scent.wear?.season, "sun"],
    ["Occasion", scent.wear?.occasion, "star"],
    ["Projection", scent.wear?.projection, "wave"],
  ].filter(([, v]) => v);
  return (
    <section className="row">
      <div className="cells lg:grid-cols-[1fr_2fr]">
        <div className="cell">
          <SectionHead index={index} title="Wear it" stacked />
        </div>
        <div className="cell">
        {wear.length > 0 && (
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4" data-reveal>
            {wear.map(([k, v, icon]) => (
              <div key={k} className="flex gap-3">
                <Icon name={icon as "clock"} size={20} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  <dt className="eyebrow text-ash">{k}</dt>
                  <dd className="mt-1 text-[15px]">{v}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
        {(scent.longevity !== null || scent.sillage !== null) && (
          <div className="mt-10 grid max-w-[720px] gap-5 sm:grid-cols-2">
            {scent.longevity !== null && <Meter label="Longevity" value={scent.longevity} />}
            {scent.sillage !== null && <Meter label="Sillage" value={scent.sillage} />}
          </div>
        )}
        <p className="mt-6 text-[13px] text-ash">Estimates until our wear tests are in.</p>
        </div>
      </div>
    </section>
  );
}

/**
 * `current` is the page it sits on: an answer never links to it. `questions`
 * rewords a question for this page (the mystery box returns a box, not a bottle).
 */
export function FaqSection({
  ids,
  samples = false,
  title = "Good to know",
  index,
  current,
  questions,
  lead = [],
}: {
  ids: string[];
  samples?: boolean;
  title?: string;
  index?: string;
  current?: string;
  questions?: Record<string, string>;
  /** Answers for this page only, shown first (the product's notes). */
  lead?: { id: string; q: string; a: ReactNode }[];
}) {
  const faq = faqEntries({ samples })
    .filter((f) => ids.includes(f.id))
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    .map((f) => ({ ...f, q: questions?.[f.id] ?? f.q, links: f.links?.filter((l) => l.href !== current) }))
    .map((f) => ({
      id: f.id,
      q: f.q,
      a: f.links?.length ? (
        <>
          {f.a}
          <span className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {f.links.map((l) => (
              <Link key={l.href} href={l.href} className={`lnk ${tapArea}`}>
                {l.label}
              </Link>
            ))}
          </span>
        </>
      ) : (
        f.a
      ),
    }));
  const items = [...lead, ...faq];
  if (!items.length) return null;
  return (
    <section className="row">
      <div className="cells lg:grid-cols-[1fr_2fr]">
        <div className="cell" data-reveal>
          {index && <span className="tnum serif mb-3 block text-[20px] text-gold">{index}</span>}
          <h2 className="display-l">{title}</h2>
          <Link href="/help" className={`lnk mt-6 ${tapArea}`}>
            All questions <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <div className="cell">
          <FaqTrack>
            <Accordion items={items} />
          </FaqTrack>
        </div>
      </div>
    </section>
  );
}

/** Why the two belong together, from what they share: line, families, or failing that the second one's notes. */
function pairReason(a: Scent, b: Scent): string | null {
  const shared = a.families.filter((f) => b.families.includes(f)).map((f) => families[f].label.toLowerCase());
  const both = shared.length ? `both ${shared.length > 1 ? `${shared.slice(0, -1).join(", ")} and ${shared.at(-1)}` : shared[0]}` : null;
  if (a.line && a.line === b.line) return `Two from ${lineWithAudience(a.line, ", ")}${both ? `, ${both}` : ""}.`;
  if (both) return `${sentenceCase(both)}.`;
  return b.notesShort.length ? `${b.title}: ${b.notesShort.join(", ").toLowerCase()}.` : null;
}

/** One curated pairing: the editorial "also try" pick first, else the closest scent in the catalogue. */
export function Pairing({ scent, pair, index }: { scent: Scent; pair: Scent; index: string }) {
  const a = toIndexEntry(scent), b = toIndexEntry(pair);
  return (
    <section className="row">
      <div className="cells md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr]" data-reveal>
        <div className="cell md:col-span-2 lg:col-span-1">
          <SectionHead index={index} title={`Pair it with ${pair.title}`} sub={pairReason(scent, pair) ?? undefined} stacked />
        </div>
        <div className="cell flex items-center">
          <MiniCard entry={a} />
        </div>
        <Link href={`/products/${b.handle}`} className="group cell flex items-center">
          <MiniCard entry={b} />
        </Link>
        <div className="cell flex flex-col justify-center gap-3 md:col-span-2 lg:col-span-1 lg:items-end">
            <p className="flex items-baseline justify-between gap-3 md:flex-col md:items-end md:gap-1">
              <span className="text-[13px] text-ash">Together</span>
              <span className="tnum text-[22px] font-medium">{formatMoney({ amount: parseFloat(scent.price.amount) + parseFloat(pair.price.amount), currencyCode: scent.price.currencyCode })}</span>
            </p>
          <AddPairButton a={a} b={b} />
        </div>
      </div>
    </section>
  );
}

/** An 88 × 88 thumbnail through the image optimiser: a 256 px AVIF of a few KB, never the full-size original. */
function MiniCard({ entry }: { entry: ReturnType<typeof toIndexEntry> }) {
  return (
    <div className="flex items-center gap-4">
      <ProductImage src={entry.image} alt="" world={entry.world} sizes="88px" className="h-[88px] w-[88px] shrink-0" />
      <div className="min-w-0">
        {entry.line && <span className="block text-[12px] text-ash">{lineWithAudience(entry.line)}</span>}
        <span className="display-m block group-hover:text-sea">{entry.title}</span>
        <Price money={entry.price} className="text-[14px] text-ash" />
      </div>
    </div>
  );
}

/** A published tale only: its opening paragraph under the wide campaign still, then the way in. */
export function TaleExcerpt({ scent, index }: { scent: Scent; index: string }) {
  const tale = scent.taleSlug ? taleBySlug(scent.taleSlug) : undefined;
  if (!tale || !scent.story?.length) return null;
  const still = siteImage(`tale-${tale.slug}`);
  return (
    <section className="row">
      <div className={`cells ${still ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
        {/* The still runs to the rules; the tale sits in the cell beside it. */}
        {still && <Figure name={`tale-${tale.slug}`} label="" sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-[7/3] lg:aspect-auto lg:h-full lg:min-h-[420px]" data-reveal />}
        <div className="cell max-w-[64ch] lg:max-w-none" data-reveal>
          <span className="tnum serif mb-3 block text-[20px] text-gold">{index}</span>
          <Eyebrow>The tale</Eyebrow>
          <h2 className="display-l mt-3">{tale.title}</h2>
          <div className="reading mt-8">
            <p>{scent.story[0]}</p>
          </div>
          <Link href={`/tales/${tale.slug}`} className={`lnk mt-8 ${tapArea}`}>
            Read the full tale · {tale.readTime} <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The mystery box, said plainly: what is inside, who chooses, and what comes after. */
export function BoxContents({ index, sampleMl, bottleMl }: { index: string; sampleMl: number; bottleMl: number }) {
  const items = [
    ["Three eaux de parfum", `${sampleMl} ml of each, in its own vial. Enough to wear every one more than once.`],
    ["Chosen by the house", "We choose the three, so the box stays a surprise until you open it."],
    ["Then, your bottle", `When one of them stays with you, its ${bottleMl} ml bottle is in the shop.`],
  ];
  return (
    <section className="row">
      <div className="cells md:grid-cols-4">
        <div className="cell">
          <SectionHead index={index} title="What is inside" stacked />
        </div>
          {items.map(([title, copy], i) => (
            <div key={title} className="cell" data-reveal style={{ ["--i" as string]: i }}>
              <p className="tnum text-[12px] font-semibold tracking-[0.08em] text-gold-text">0{i + 1}</p>
              <h3 className="display-m mt-1">{title}</h3>
              <p className="mt-2 max-w-[40ch] text-[16px] leading-relaxed text-ash">{copy}</p>
            </div>
          ))}
      </div>
    </section>
  );
}
