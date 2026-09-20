import Link from "next/link";
import { Accordion, Eyebrow, Meter, SectionHead } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";
import type { Scent } from "@/lib/catalogue";
import { faq } from "@/content/faq";

export function NotesPyramid({ scent }: { scent: Scent }) {
  return (
    <section className="section border-t border-dune">
      <div className="wrap">
        <SectionHead index="01" title="How it smells" sub="Notes as they arrive on skin." />
        {scent.notes ? (
          <div className="snap-row -mx-5 mt-12 px-5 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:px-0">
            {scent.notes.map((n, i) => (
              <div key={n.stage} className="group w-[78vw] md:w-auto" data-reveal style={{ ["--i" as string]: i * 2 }}>
                <div className="overflow-hidden">
                  <Figure name={`products/${scent.handle}-note-${i + 1}`} label={n.art} sizes="(min-width: 768px) 33vw, 78vw" className="hover-lift aspect-square w-full" />
                </div>
                <p className="tnum mt-5 text-[12px] text-gold-text">
                  0{i + 1} · {n.stage}
                </p>
                <h3 className="display-m mt-1">{n.name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ash">{n.copy}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1.2fr]" data-reveal>
            <Figure name={`products/${scent.handle}-3`} label={`Notes still — ${scent.notesShort.join(", ") || scent.title}`} sizes="(min-width: 768px) 45vw, 100vw" className="aspect-[4/3] w-full" />
            <div>
              <p className="body-l max-w-[52ch]">{scent.description || "[Notes copy to write — one sensory line per note, no jargon.]"}</p>
              {scent.notesShort.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {scent.notesShort.map((n) => (
                    <li key={n} className="chip">
                      {n}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-6 text-[12px] text-ash">[Top / heart / base pyramid with one line per note to come from the 43 note pyramids.]</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function TaleExcerpt({ scent }: { scent: Scent }) {
  if (!scent.story && !scent.signature) return null;
  const excerpt: string[] = [];
  let chars = 0;
  for (const p of scent.story ?? []) {
    if (chars > 600) break;
    excerpt.push(p);
    chars += p.length;
  }
  return (
    <section className="section border-t border-dune">
      <div className="wrap grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div data-reveal>
          <span className="tnum serif mb-3 block text-[20px] text-gold">02</span>
          <Eyebrow>The tale</Eyebrow>
          {scent.signature && <h2 className="display-l mt-3">{scent.signature}</h2>}
          {excerpt.length > 0 ? (
            <div className="reading mt-8 max-w-[60ch]">
              {excerpt.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="body-l mt-6 text-ash">[Tale to write — 250–400 words in the same voice as Scents.pdf.]</p>
          )}
          {scent.taleSlug && (
            <Link href={`/tales/${scent.taleSlug}`} className="lnk mt-8">
              Read the full tale <Icon name="arrow-right" size={16} />
            </Link>
          )}
        </div>
        <Figure
          name={scent.taleSlug ? `tale-${scent.taleSlug}` : "tale-featured"}
          label="Campaign still — fishing boat coming out of the fog"
          dark
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="aspect-[4/5] w-full lg:sticky lg:top-28"
          data-reveal
        />
      </div>
    </section>
  );
}

export function WearIt({ scent }: { scent: Scent }) {
  const hasWear = scent.wear && Object.values(scent.wear).some(Boolean);
  const hasMeters = scent.longevity !== null || scent.sillage !== null;
  if (!hasWear && !hasMeters && !scent.inspiredBy) return null;
  return (
    <section className="section border-t border-dune">
      <div className="wrap grid gap-12 lg:grid-cols-2">
        {(hasWear || hasMeters) && (
          <div data-reveal>
            <span className="tnum serif mb-3 block text-[20px] text-gold">03</span>
            <h2 className="display-l">Wear it</h2>
            {hasWear && (
              <dl className="mt-8 grid grid-cols-2 gap-6">
                {[
                  ["Time", scent.wear?.time, "clock"],
                  ["Season", scent.wear?.season, "sun"],
                  ["Occasion", scent.wear?.occasion, "star"],
                  ["Projection", scent.wear?.projection, "wave"],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v, icon]) => (
                    <div key={k as string} className="flex gap-3">
                      <Icon name={icon as "clock"} size={20} className="mt-0.5 shrink-0 text-gold" />
                      <div>
                        <dt className="eyebrow text-ash">{k}</dt>
                        <dd className="mt-1 text-[15px]">{v}</dd>
                      </div>
                    </div>
                  ))}
              </dl>
            )}
            {hasMeters && (
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {scent.longevity !== null && <Meter label="Longevity" value={scent.longevity} />}
                {scent.sillage !== null && <Meter label="Sillage" value={scent.sillage} />}
              </div>
            )}
            {!hasMeters && <p className="mt-6 text-[12px] text-ash">[Longevity and sillage scores to come from wear tests.]</p>}
          </div>
        )}
        {scent.inspiredBy && (
          <div data-reveal>
            <span className="tnum serif mb-3 block text-[20px] text-gold">04</span>
            <h2 className="display-l">If you love {scent.inspiredBy}</h2>
            <p className="body-l mt-6 max-w-[52ch]">{scent.comparison ?? "[One honest line on how ours differs — from the perfumer.]"}</p>
            <p className="mt-4 text-[12px] text-ash">Our own composition. Not affiliated with the original house. [confirm legal wording]</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function FaqSection({ ids, title = "Good to know", index }: { ids: string[]; title?: string; index?: string }) {
  const items = faq.filter((f) => ids.includes(f.id)).map((f) => ({ id: f.id, q: f.q, a: f.a }));
  return (
    <section className="section border-t border-dune">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div data-reveal>
          {index && <span className="tnum serif mb-3 block text-[20px] text-gold">{index}</span>}
          <h2 className="display-l">{title}</h2>
          <Link href="/help" className="lnk mt-6">
            All questions <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <div data-reveal>
          <Accordion items={items} />
        </div>
      </div>
    </section>
  );
}
