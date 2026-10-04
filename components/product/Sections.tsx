import Link from "next/link";
import { Accordion, Eyebrow, Meter, Price, SectionHead } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";
import { toIndexEntry, type Scent } from "@/lib/catalogue";
import { faq } from "@/content/faq";
import { taleBySlug } from "@/content/tales";
import { families } from "@/content/taxonomy";
import { confirmed } from "@/lib/facts";
import { formatMoney, sentenceCase } from "@/lib/format";
import { siteImage } from "@/lib/site-images";
import { AddPairButton } from "./AddPairButton";
import { FaqTrack } from "./FaqTrack";
import { lineWithAudience } from "./line";

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
    <section className="section border-t border-dune">
      <div className="wrap">
        <SectionHead index={index} title={`How it differs from ${scent.inspiredBy}`} />
        <p className="body-l mt-6 max-w-[60ch]">{confirmed(scent.comparison)}</p>
        <p className="mt-4 text-[12px] text-ash">Our own composition. Not affiliated with the original house.</p>
      </div>
    </section>
  );
}

/** "How it smells": the notes sculpture (products/<handle>-3) beside the pyramid, or the description and its notes. */
export function NotesPyramid({ scent, index }: { scent: Scent; index: string }) {
  const still = siteImage(`products/${scent.handle}-3`);
  return (
    <section id="notes" className="section scroll-mt-[var(--header-h)] border-t border-dune">
      <div className="wrap">
        <SectionHead index={index} title="How it smells" sub={scent.notes ? "Notes as they arrive on skin." : undefined} />
        <div className={`mt-10 grid gap-10 ${still ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start lg:gap-16" : ""}`}>
          {still && <Figure name={`products/${scent.handle}-3`} label="" alt={`${scent.title} among its notes`} sizes="(min-width: 768px) 40vw, calc(100vw - 40px)" className="aspect-[4/5] w-full" data-reveal />}
          {scent.notes ? (
            <ol>
              {scent.notes.map((n, i) => (
                <li key={n.stage} className="border-t border-dune py-6 first:border-t-0 first:pt-0" data-reveal style={{ ["--i" as string]: i }}>
                  <p className="tnum text-[12px] font-semibold tracking-[0.08em] text-gold-text uppercase">
                    0{i + 1} · {n.stage}
                  </p>
                  <h3 className="display-m mt-1">{n.name}</h3>
                  {n.copy && <p className="mt-2 max-w-[52ch] text-[16px] leading-relaxed text-ash">{n.copy}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <div data-reveal>
              <p className="body-l max-w-[52ch]">{scent.description}</p>
              {scent.notesShort.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {scent.notesShort.map((n) => (
                    <li key={n} className="chip cursor-default">
                      {sentenceCase(n)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function WearIt({ scent, index }: { scent: Scent; index: string }) {
  const wear = [
    ["Time", scent.wear?.time, "clock"],
    ["Season", scent.wear?.season, "sun"],
    ["Occasion", scent.wear?.occasion, "star"],
    ["Projection", scent.wear?.projection, "wave"],
  ].filter(([, v]) => v);
  return (
    <section className="section border-t border-dune">
      <div className="wrap">
        <SectionHead index={index} title="Wear it" />
        {wear.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4" data-reveal>
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
    </section>
  );
}

export function FaqSection({ ids, title = "Good to know", index }: { ids: string[]; title?: string; index?: string }) {
  const items = faq.filter((f) => ids.includes(f.id)).map((f) => ({ id: f.id, q: f.q, a: f.a }));
  if (!items.length) return null;
  return (
    <section className="section border-t border-dune">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div data-reveal>
          {index && <span className="tnum serif mb-3 block text-[20px] text-gold">{index}</span>}
          <h2 className="display-l">{title}</h2>
          <Link href="/help" className={`lnk mt-6 ${tapArea}`}>
            All questions <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <FaqTrack>
          <Accordion items={items} />
        </FaqTrack>
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
    <section className="section border-t border-dune bg-sand/40">
      <div className="wrap">
        <SectionHead index={index} title={`Pair it with ${pair.title}`} sub={pairReason(scent, pair) ?? undefined} />
        <div className="mt-10 grid gap-6 bg-paper p-5 md:grid-cols-[1fr_1fr_auto] md:items-center md:p-8" data-reveal>
          <MiniCard entry={a} />
          <Link href={`/products/${b.handle}`} className="group">
            <MiniCard entry={b} />
          </Link>
          <div className="flex flex-col gap-3 border-t border-dune pt-5 md:items-end md:border-t-0 md:pt-0">
            <p className="flex items-baseline justify-between gap-3 md:flex-col md:items-end md:gap-1">
              <span className="text-[13px] text-ash">Together</span>
              <span className="tnum text-[22px] font-medium">{formatMoney({ amount: parseFloat(scent.price.amount) + parseFloat(pair.price.amount), currencyCode: scent.price.currencyCode })}</span>
            </p>
            <AddPairButton a={a} b={b} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniCard({ entry }: { entry: ReturnType<typeof toIndexEntry> }) {
  return (
    <span className="flex items-center gap-4">
      <span className="relative block h-[110px] w-[88px] shrink-0 overflow-hidden" style={{ backgroundColor: entry.world.bg }}>
        {entry.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </span>
      <span className="min-w-0">
        {entry.line && <span className="block text-[12px] text-ash">{lineWithAudience(entry.line)}</span>}
        <span className="display-m block group-hover:text-sea">{entry.title}</span>
        <Price money={entry.price} className="text-[14px] text-ash" />
      </span>
    </span>
  );
}

/** A published tale only: its opening paragraph under the wide campaign still, then the way in. */
export function TaleExcerpt({ scent, index }: { scent: Scent; index: string }) {
  const tale = scent.taleSlug ? taleBySlug(scent.taleSlug) : undefined;
  if (!tale || !scent.story?.length) return null;
  const still = siteImage(`tale-${tale.slug}`);
  return (
    <section className="section border-t border-dune">
      <div className="wrap">
        {still && <Figure name={`tale-${tale.slug}`} label="" sizes="(min-width: 1440px) 1280px, 100vw" className="-mx-5 aspect-[7/3] lg:mx-0" data-reveal />}
        <div className="mt-10 max-w-[64ch]" data-reveal>
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
    <section className="section border-t border-dune">
      <div className="wrap">
        <SectionHead index={index} title="What is inside" />
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map(([title, copy], i) => (
            <li key={title} className="border-t border-dune pt-5" data-reveal style={{ ["--i" as string]: i }}>
              <p className="tnum text-[12px] font-semibold tracking-[0.08em] text-gold-text">0{i + 1}</p>
              <h3 className="display-m mt-1">{title}</h3>
              <p className="mt-2 max-w-[40ch] text-[16px] leading-relaxed text-ash">{copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
