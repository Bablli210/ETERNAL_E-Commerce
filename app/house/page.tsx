import type { Metadata } from "next";
import Link from "next/link";
import { getLineCounts } from "@/lib/catalogue";
import { lines } from "@/content/taxonomy";
import { site } from "@/content/site";
import { Eyebrow, ImageSlot, SectionHead } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 300;

export const metadata: Metadata = { title: "The house", description: "eternal is a Cairo house of eaux de parfum in three lines. Inspired by, never imitated.", alternates: { canonical: "/house" } };

const steps = [
  { n: "1", title: "We start from what you love", copy: "Each scent names the fragrance that inspired it. No guessing, no code names." },
  { n: "2", title: "We compose our own reading", copy: "Same opening you know, our own heart and drydown — closer to the skin, made for Cairo heat. [Perfumer’s note]" },
  { n: "3", title: "We test it on skin", copy: "Every listing carries its own longevity and sillage score from wear tests, not a slogan. [Method]" },
];

export default async function HousePage() {
  const counts = await getLineCounts();
  return (
    <>
      <section className="wrap pt-10 lg:pt-16">
        <Eyebrow>The house</Eyebrow>
        <h1 className="display-xl mt-4 max-w-[16ch]">{site.tagline}</h1>
        <p className="body-l mt-8 max-w-[60ch]">
          eternal is a Cairo house of eaux de parfum in three lines — eterna for her, eterno for him, eternal for both. We start from the fragrances people already love, compose our own reading of each one, and test it on skin until it lasts the way a memory does.
        </p>
      </section>
      <section className="wrap py-16" data-reveal>
        <div className="grain relative aspect-video w-full bg-night text-linen">
          <ImageSlot label="The house film, full bleed — 1:30 brand explainer with voiceover, poster frame [video to add]" dark className="slot-corner absolute inset-0 !border-0" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-linen/70">
            <Icon name="play" size={24} />
          </span>
        </div>
      </section>
      <section className="section border-t border-dune">
        <div className="wrap">
          <SectionHead title="How we compose" />
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.n} data-reveal style={{ ["--i" as string]: i }}>
                <ImageSlot label={`Step ${s.n} — studio still`} className="aspect-[4/3] w-full" />
                <span className="tnum serif mt-5 block text-[28px] text-gold">{s.n}</span>
                <h3 className="display-m mt-1">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ash">{s.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section border-t border-dune">
        <div className="wrap">
          <SectionHead title="Three lines, one house" action={{ label: "Shop all scents", href: "/shop" }} />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {(["eterna", "eterno", "eternal"] as const).map((k) => {
              const l = lines[k];
              return (
                <Link key={k} href={`/shop/${l.slug}`} className={`flex aspect-[4/5] flex-col justify-end p-7 ${l.toneDark ? "text-linen" : "text-night"}`} style={{ backgroundColor: l.tone }} data-reveal>
                  <span className="serif text-[40px] font-semibold leading-none">{l.label}</span>
                  <p className="mt-2 text-[13px] opacity-80">
                    {l.audience} · {counts[k]} scents
                  </p>
                  <span className="lnk mt-5 self-start">
                    Shop {l.audience.toLowerCase()} <Icon name="arrow-right" size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="grain bg-night text-linen">
        <div className="wrap section grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-center">
          <ImageSlot label="Founder portrait — same light as the packshots" dark className="aspect-[4/5] w-full max-w-[320px]" />
          <div>
            <Eyebrow className="!text-dune">A note from the founder</Eyebrow>
            <p className="signature mt-4 max-w-[46ch] text-dune">[Two or three sentences in the founder’s voice — why the house exists, what “never meant to fade” means to you.]</p>
            <Link href="/finder" className="btn btn-light mt-8">
              Find your scent
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
