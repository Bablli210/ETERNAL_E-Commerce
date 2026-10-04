import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogue, getLineCounts, getScent } from "@/lib/catalogue";
import { lines, type LineKey } from "@/content/taxonomy";
import { house } from "@/content/house";
import { site } from "@/content/site";
import { confirmed } from "@/lib/facts";
import { formatMoney } from "@/lib/format";
import { siteImage } from "@/lib/site-images";
import { siteVideo } from "@/lib/site-videos";
import { HouseFilmPlayer } from "@/components/home/HouseFilmPlayer";
import { lineWithAudience } from "@/components/product/line";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The house",
  description: "eternal is a perfume house from Cairo: eaux de parfum in three lines, eterna for her, eterno for him and eternal for both.",
  alternates: { canonical: "/house" },
};

const LINE_ORDER: LineKey[] = ["eterna", "eterno", "eternal"];

/** A text link with a 44 px tap area and an arrow. */
function Way({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold">
      <span className="lnk">{children}</span> <Icon name="arrow-right" size={14} />
    </Link>
  );
}

/**
 * The house in what can be said today: who the lines are for, what "inspired
 * by" means, and the ways in. Nothing here waits on an unconfirmed fact; the
 * founder section appears only once the owner's words and portrait exist.
 * Every section ends with a way to the scents or to the finder.
 */
export default async function HousePage() {
  const [counts, { scents }, box] = await Promise.all([getLineCounts(), getCatalogue(), getScent("mystery-box")]);
  const inspired = scents.filter((s) => s.inspiredBy);
  const film = siteVideo("house-film");
  const founderNote = confirmed(house.founderNote);
  const founderName = confirmed(house.founderName);
  const founderPhoto = siteImage("house-founder");
  const poster = <Figure name="house-film-poster" label="" sizes="(min-width: 1440px) 1280px, 100vw" className="absolute inset-0" />;

  return (
    <>
      <section className="wrap pt-6 lg:pt-16">
        <Eyebrow>The house</Eyebrow>
        <h1 className="display-xl mt-3 max-w-[16ch]">{site.tagline}</h1>
        <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed lg:mt-8 lg:text-[19px]">
          eternal is a perfume house from Cairo. Our eaux de parfum come in three lines: eterna for her, eterno for him and eternal for both.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/shop" className="btn">
            Shop the scents
          </Link>
          <Link href="/finder" className="btn btn-secondary">
            Take the scent finder
          </Link>
        </div>
        {/* The film plays here once it exists; until then the poster is a still, with nothing to press. */}
        {film ? (
          <HouseFilmPlayer sources={film} poster={poster} className="relative mt-10 block aspect-video w-full overflow-hidden bg-night lg:mt-16" />
        ) : (
          siteImage("house-film-poster") && <div className="relative mt-10 aspect-video w-full overflow-hidden bg-sand lg:mt-16">{poster}</div>
        )}
      </section>

      <section className="section">
        <div className="wrap grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="display-l">What “inspired by” means</h2>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-ash lg:text-[17px]">
              Some of our scents start from a fragrance you may already know. Where one does, its page names the original, so you know what to expect before you smell it. Each is our own composition, and we are not affiliated with the houses
              behind the originals.
            </p>
          </div>
          <div className="lg:pt-2">
            {inspired.length > 0 && (
              <ul className="divide-y divide-dune border-y border-dune">
                {inspired.map((s) => (
                  <li key={s.handle}>
                    <Link href={`/products/${s.handle}`} className="flex min-h-14 items-center gap-3 py-3 hover:text-sea">
                      <span className="min-w-0 flex-1">
                        <span className="font-serif text-[22px] font-semibold leading-tight">{s.title}</span>
                        <span className="block text-[14px] text-ash">
                          Inspired by {s.inspiredBy}
                          {s.line ? ` · ${lineWithAudience(s.line)}` : ""}
                        </span>
                      </span>
                      <Price money={s.price} className="shrink-0 text-[14px]" />
                      <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Way href="/shop">See every scent</Way>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-t border-dune">
        <div className="wrap">
          <h2 className="display-l">Three lines, one house</h2>
          <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-ash lg:text-[17px]">Each line is made for someone, and eternal is for sharing.</p>
          <ul className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6 lg:mt-12">
            {LINE_ORDER.map((k, i) => {
              const l = lines[k];
              return (
                <li key={k} data-reveal style={{ ["--i" as string]: i }}>
                  <Link href={`/shop/${l.slug}`} className="group block">
                    {/* The collection banners are 7:3 stills: shown whole, never cropped into a taller box. */}
                    <Figure name={`collection-${l.slug}`} label="" sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[7/3] w-full" style={{ backgroundColor: l.tone }} />
                    <span className="mt-3 flex items-baseline justify-between gap-3">
                      <span className="font-serif text-[28px] font-semibold leading-none group-hover:text-sea">{lineWithAudience(k)}</span>
                      <span className="shrink-0 text-[13px] text-ash">{counts[k]} scents</span>
                    </span>
                    <span className="mt-1 block text-[14px] text-ash">{l.blurb}</span>
                    <span className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold">
                      <span className="lnk">Shop {l.audience === "Unisex" ? "unisex" : `for ${l.audience.toLowerCase()}`}</span> <Icon name="arrow-right" size={14} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {founderNote && founderName && founderPhoto && (
        <section className="grain bg-night text-linen">
          <div className="wrap section grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-center">
            <Figure name="house-founder" label="" alt={founderName} sizes="(min-width: 1024px) 320px, 100vw" className="aspect-[4/5] w-full max-w-[320px]" />
            <div>
              <Eyebrow className="!text-dune">A note from the founder</Eyebrow>
              <p className="signature mt-4 max-w-[46ch] text-dune">{founderNote}</p>
              <p className="mt-4 text-[14px] text-dune">{founderName}</p>
              <Link href="/finder" className="btn btn-light mt-8">
                Take the scent finder
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section border-t border-dune">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-20">
          <Figure name="house-step-3" label="" sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/3] w-full" />
          <div>
            <h2 className="display-l">Where to start</h2>
            <ol className="mt-6 divide-y divide-dune border-y border-dune">
              <li className="py-4">
                <p className="text-[16px] font-semibold">You know a fragrance you love</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ash">Search for it by name. If one of ours was inspired by it, it shows first.</p>
                <Way href="/shop">Search the scents</Way>
              </li>
              <li className="py-4">
                <p className="text-[16px] font-semibold">You are not sure yet</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ash">Five questions, three matches from across the house.</p>
                <Way href="/finder">Take the scent finder</Way>
              </li>
              {box?.bottle && (
                <li className="py-4">
                  <p className="text-[16px] font-semibold">You would rather wear a few first</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ash">
                    The mystery box: three {site.sampleSizeMl} ml scents chosen by the house, {formatMoney(box.bottle.price)}.
                  </p>
                  <Way href={`/products/${box.handle}`}>See the mystery box</Way>
                </li>
              )}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
