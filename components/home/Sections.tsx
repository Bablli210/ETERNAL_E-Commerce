import Link from "next/link";
import Image from "next/image";
import { Eyebrow, ImageSlot, SectionHead } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/product/ProductCard";
import { site } from "@/content/site";
import { lines, moodOrder, moods, type LineKey } from "@/content/taxonomy";
import { tales } from "@/content/tales";
import type { Scent, ScentIndexEntry } from "@/lib/catalogue";
import { joinNotes } from "@/lib/format";

export function Hero({ featured }: { featured: Scent | null }) {
  const words = site.tagline.split(" ");
  const bg = featured?.world.dark ? featured.world.bg : "#163a4e";
  return (
    <section id="hero" className="grain relative flex min-h-[100svh] flex-col justify-end overflow-hidden text-linen" style={{ backgroundColor: bg }}>
      <div className="absolute inset-0">
        <ImageSlot label="Hero film — bottle on wet stone, Mediterranean light, 6-second loop; poster still as fallback" dark className="slot-corner h-full w-full !border-0 opacity-60" style={{ backgroundColor: bg }} />
        <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/10 to-night/30" />
      </div>
      {featured?.image && (
        <div className="pointer-events-none absolute bottom-[18%] right-[6%] hidden w-[26vw] max-w-[380px] lg:block" aria-hidden="true">
          <div className="relative aspect-[4/5]" style={{ backgroundColor: featured.world.bg }}>
            <Image src={featured.image.url} alt="" fill priority sizes="380px" className="object-cover" />
          </div>
        </div>
      )}
      <div className="wrap relative pb-16 pt-40 lg:pb-24">
        <div className="max-w-[820px]">
          {featured && (
            <Eyebrow className="!text-dune">
              Featured · {featured.lineLabel} · {featured.title}
            </Eyebrow>
          )}
          <h1 className="display-xl mt-4">
            {words.map((w, i) => (
              <span key={i} className="hero-word" style={{ ["--i" as string]: i }}>
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p className="body-l mt-6 max-w-[54ch] text-dune">{site.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-light">
              Shop the collection
            </Link>
            <Link href="/finder" className="btn btn-outline-light">
              Find your scent — 2 minutes
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-dune">
            <li>Cash on delivery</li>
            <li>Two free {site.sampleSizeMl} ml samples</li>
            <li>{site.deliveryTime} across Egypt</li>
          </ul>
        </div>
        <a href="#proof" className="absolute bottom-8 right-5 hidden items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-dune lg:right-20 lg:flex">
          Scroll <Icon name="chevron-down" size={14} />
        </a>
      </div>
    </section>
  );
}

export function ProofStrip() {
  const facts = [
    { big: "EdP", label: "Eau de parfum strength", sub: site.longevityClaim },
    { big: `${site.sampleSizeMl} ml`, label: "Try before you commit", sub: "samples and the discovery set" },
    { big: "COD", label: "Cash on delivery", sub: "pay when it arrives, anywhere in Egypt" },
    { big: site.returnsWindow, label: site.returnsPolicy, sub: "unopened bottles" },
  ];
  return (
    <section id="proof" className="border-b border-dune">
      <ul className="wrap grid grid-cols-2 divide-dune lg:grid-cols-4 lg:divide-x">
        {facts.map((f, i) => (
          <li key={f.label} className="flex flex-col gap-1 py-8 lg:px-8 lg:py-12 lg:first:pl-0 lg:last:pr-0" data-reveal style={{ ["--i" as string]: i }}>
            <span className="tnum serif text-[44px] font-semibold leading-none text-gold lg:text-[56px]">{f.big}</span>
            <span className="mt-2 text-[14px] font-semibold">{f.label}</span>
            <span className="text-[12px] text-ash">{f.sub}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LineTiles({ counts, total }: { counts: Record<LineKey, number>; total: number }) {
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead index="01" title="Three lines, one house" action={{ label: `Shop all ${total} scents`, href: "/shop" }} />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {(["eterna", "eterno", "eternal"] as const).map((k, i) => {
            const l = lines[k];
            return (
              <Link key={k} href={`/shop/${l.slug}`} className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden p-7 ${l.toneDark ? "text-linen" : "text-night"}`} style={{ backgroundColor: l.tone, ["--i" as string]: i }} data-reveal>
                <ImageSlot label={`${l.label} — person in a landscape, back to camera, 4:5`} dark={l.toneDark} className="slot-corner hover-lift absolute inset-0 !border-0 opacity-70" style={{ backgroundColor: l.tone }} />
                <div className="relative">
                  <span className="serif text-[40px] font-semibold leading-none">{l.label}</span>
                  <p className="mt-2 text-[13px] opacity-80">
                    {l.audience} · {counts[k]} scents · {l.blurb}
                  </p>
                  <span className="lnk mt-5 inline-flex">
                    Shop {l.audience.toLowerCase()} <Icon name="arrow-right" size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Bestsellers({ entries }: { entries: ScentIndexEntry[] }) {
  return (
    <section className="section border-t border-dune">
      <div className="wrap">
        <SectionHead index="02" title="Most worn this month" sub="Bestsellers across the three lines, updated from real orders." action={{ label: "See all bestsellers", href: "/shop/bestsellers" }} />
      </div>
      <div className="wrap mt-12">
        <div className="snap-row -mx-5 px-5 lg:mx-0 lg:px-0">
          {entries.map((e, i) => (
            <div key={e.handle} className="w-[72vw] sm:w-[320px]" data-reveal style={{ ["--i" as string]: Math.min(i, 4) }}>
              <ProductCard entry={e} badge={i === 0 ? "Bestseller" : undefined} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinderEntry() {
  return (
    <section className="border-t border-dune bg-linen">
      <div className="wrap grid gap-8 py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-28" data-reveal>
        <div>
          <h2 className="display-l">Not sure where to start?</h2>
          <p className="body-l mt-4 max-w-[54ch] text-ash">Answer five quick questions and we match you to three scents — then try all three as {site.sampleSizeMl} ml samples before you commit to a bottle.</p>
          <div className="mt-8 flex items-center gap-5">
            <Link href="/finder" className="btn">
              Start the scent finder
            </Link>
            <span className="text-[12px] text-ash">Takes about 2 minutes</span>
          </div>
        </div>
        <ImageSlot label="Nine bottles drifting out of focus on frosted glass — the one under the cursor sharpens" className="aspect-[4/3] w-full" />
      </div>
    </section>
  );
}

export function FeaturedTale({ scent }: { scent: Scent | null }) {
  if (!scent) return null;
  const tale = scent.taleSlug ? tales.find((t) => t.slug === scent.taleSlug) : null;
  const first = scent.story?.[0] ?? tale?.paragraphs[0];
  const bg = scent.world.dark ? scent.world.bg : "#163a4e";
  return (
    <section className="grain watermark relative overflow-hidden text-linen" style={{ backgroundColor: bg }}>
      <div className="wrap section relative grid gap-12 lg:grid-cols-2 lg:items-center">
        <ImageSlot label="Campaign still — fog on the harbour, fishing boat, morning light" dark className="aspect-[4/5] w-full" style={{ backgroundColor: bg }} data-reveal />
        <div data-reveal>
          <Eyebrow className="!text-dune">A tale from {scent.lineLabel}</Eyebrow>
          <h2 className="display-l mt-4">{tale?.title ?? scent.signature}</h2>
          {first && <p className="body-l mt-6 max-w-[56ch] text-dune">{first.length > 420 ? first.slice(0, 420).trimEnd() + "…" : first}</p>}
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-linen/20 pt-6 text-[13px]">
            <div>
              <dt className="eyebrow text-dune">The scent</dt>
              <dd className="mt-1">{scent.title}</dd>
            </div>
            <div>
              <dt className="eyebrow text-dune">Notes</dt>
              <dd className="mt-1">{joinNotes(scent.notesShort)}</dd>
            </div>
            {scent.inspiredBy && (
              <div>
                <dt className="eyebrow text-dune">Inspired by</dt>
                <dd className="mt-1">{scent.inspiredBy}</dd>
              </div>
            )}
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {scent.taleSlug && (
              <Link href={`/tales/${scent.taleSlug}`} className="btn btn-light">
                Read the tale
              </Link>
            )}
            <Link href={`/products/${scent.handle}`} className="btn btn-outline-light">
              Shop {scent.title}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MoodTiles() {
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead index="03" title="Shop by mood" sub="For when you know the feeling but not the notes." />
        <ul className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {moodOrder.map((k, i) => {
            const m = moods[k];
            const dark = k === "after-dark";
            return (
              <li key={k} data-reveal style={{ ["--i" as string]: i }}>
                <Link href={`/shop/${k}`} className={`group relative flex aspect-[4/3] flex-col justify-end overflow-hidden p-5 lg:p-7 ${dark ? "text-linen" : "text-night"}`} style={{ backgroundColor: m.wash }}>
                  <ImageSlot label={m.art} dark={dark} className="slot-corner hover-lift absolute inset-0 !border-0 opacity-80" style={{ backgroundColor: m.wash }} />
                  <span className="serif relative text-[28px] leading-none lg:text-[34px]">{m.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function RiskReducers({ mysteryBox }: { mysteryBox: ScentIndexEntry | null }) {
  return (
    <section className="section border-t border-dune bg-sand/40">
      <div className="wrap">
        <SectionHead index="04" title="Try before you commit" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col bg-paper" data-reveal>
            <ImageSlot label="Six 5 ml vials in the matte black tray" className="aspect-[16/10] w-full" />
            <div className="flex flex-1 flex-col p-7">
              <h3 className="display-m">The discovery set</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ash">Choose any [n] scents as {site.sampleSizeMl} ml samples. The full price of the set comes back as credit toward your first {site.bottleSizeMl} ml bottle. [confirm mechanic]</p>
              <div className="mt-6 flex items-center gap-4">
                <Link href="/finder" className="btn btn-secondary">
                  Build your set
                </Link>
                <span className="text-[12px] text-ash">[Discovery set product to create]</span>
              </div>
            </div>
          </article>
          <article className="flex flex-col bg-paper" data-reveal style={{ ["--i" as string]: 1 }}>
            {mysteryBox?.image ? (
              <div className="relative aspect-[16/10] w-full" style={{ backgroundColor: mysteryBox.world.bg }}>
                <Image src={mysteryBox.image} alt={mysteryBox.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
            ) : (
              <ImageSlot label="Mystery box film still — matte black box, e∞ monogram" dark className="aspect-[16/10] w-full" />
            )}
            <div className="flex flex-1 flex-col p-7">
              <h3 className="display-m">The mystery box</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ash">A matte black box, the e∞ monogram, and three {site.sampleSizeMl} ml scents we choose for you. For the curious, and for gifts.</p>
              <div className="mt-6">
                <Link href="/products/mystery-box" className="btn">
                  Order the mystery box{mysteryBox ? ` · EGP ${Math.round(parseFloat(mysteryBox.price.amount))}` : ""}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function HouseFilm() {
  return (
    <section className="grain bg-night text-linen">
      <div className="wrap section grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <Link href="/house" className="group relative block aspect-video w-full overflow-hidden" data-reveal aria-label="Watch the house film">
          <ImageSlot label="The house film — brand explainer, 1:30, poster frame [video to add]" dark className="slot-corner absolute inset-0 !border-0" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-linen/70 text-linen transition-transform duration-200 group-hover:scale-105">
            <Icon name="play" size={24} />
          </span>
        </Link>
        <div data-reveal>
          <Eyebrow className="!text-dune">The house</Eyebrow>
          <h2 className="display-l mt-4">Composed to be remembered.</h2>
          <p className="body-l mt-6 max-w-[50ch] text-dune">We start from the fragrances people already love, and compose our own reading of them — tested on skin for lasting power, bottled in Cairo, told through a tale. Inspired by, never imitated.</p>
          <Link href="/house" className="btn btn-outline-light mt-8">
            Our story
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TalesTeaser() {
  const picks = tales.slice(1, 4);
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead title="Tales" action={{ label: "All tales", href: "/tales" }} />
        <ul className="mt-12 grid gap-8 md:grid-cols-3">
          {picks.map((t, i) => (
            <li key={t.slug} data-reveal style={{ ["--i" as string]: i }}>
              <Link href={`/tales/${t.slug}`} className="group flex flex-col">
                <ImageSlot label={t.heroArt} className="aspect-[4/3] w-full" />
                <Eyebrow className="mt-5">
                  {t.line} · {t.handle.replace(/-/g, " ")}
                </Eyebrow>
                <p className="serif mt-2 text-[26px] leading-[1.15] group-hover:text-sea">{t.signature}</p>
                <span className="lnk mt-4 self-start">
                  Read the tale <Icon name="arrow-right" size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
