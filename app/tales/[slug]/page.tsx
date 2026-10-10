import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { taleBySlug, tales } from "@/content/tales";
import { site } from "@/content/site";
import { getScent, toIndexEntry, type ScentIndexEntry } from "@/lib/catalogue";
import { formatMoney, joinNotes, sentenceCase } from "@/lib/format";
import { siteImage } from "@/lib/site-images";
import { AddToBagButton, type BagProduct } from "@/components/cart/AddToBagButton";
import { ProductImage } from "@/components/product/ProductImage";
import { lineWithAudience } from "@/components/product/line";
import { InspiredBy } from "@/components/product/InspiredBy";
import { LineLabel } from "@/components/product/LineLabel";
import { ReadingProgress } from "@/components/motion/ReadingProgress";
import { FinderBand } from "@/components/content/FinderBand";
import { TaleBar } from "@/components/content/TaleBar";
import { TaleStill } from "@/components/content/TaleStill";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return tales.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tale = taleBySlug(slug);
  if (!tale) return {};
  const scent = await getScent(tale.handle);
  const description = scent ? `${tale.signature} A tale of ${scent.title}, ${lineWithAudience(tale.line, ", ")}.` : tale.signature;
  return pageMeta({ title: tale.title, description, path: `/tales/${tale.slug}`, image: siteImage([`tale-${tale.slug}-card`, `tale-${tale.slug}`]), imageAlt: describe(tale.heroArt) });
}

/** "Campaign still, full bleed — fishing boat…" → "Fishing boat…": the art direction minus the production note. */
const describe = (heroArt: string) => sentenceCase(heroArt.split(" — ").pop() ?? heroArt);

export default async function TalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tale = taleBySlug(slug);
  if (!tale) notFound();
  const [scent, box] = await Promise.all([getScent(tale.handle), getScent("mystery-box")]);
  const entry = scent ? toIndexEntry(scent) : null;
  const boxEntry = box ? toIndexEntry(box) : null;
  const others = tales.filter((t) => t.slug !== tale.slug).slice(0, 2);
  // The scent's own name, as the shop writes it; the handle stands in only if the product is missing.
  const name = scent?.title ?? sentenceCase(tale.handle.replace(/-/g, " "));
  const product: BagProduct | null = entry ? { productId: entry.productId, handle: entry.handle, title: entry.title, image: entry.image, lineLabel: entry.lineLabel, world: entry.world } : null;

  return (
    <>
      {/* T1: a hairline progress bar tracks the read. */}
      <ReadingProgress targetId="tale-body" />
      {/* The wide still at its own 7:3, so the whole scene and its subject stay in frame on a phone, with the scent's name across it. */}
      {siteImage(`tale-${tale.slug}`) && (
        <div className="relative">
          <Figure name={`tale-${tale.slug}`} label="" alt={describe(tale.heroArt)} priority sizes="100vw" className="aspect-[7/3] w-full bg-night" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgb(23_22_20/0.42),rgb(23_22_20/0.12)_60%,transparent_85%)] px-5">
            <p className="tale-name serif whitespace-nowrap text-center leading-none font-medium text-linen [text-shadow:0_2px_24px_rgb(23_22_20/0.45)]" style={{ fontSize: `clamp(34px, ${Math.min(12, 150 / name.length).toFixed(1)}vw, 168px)` }}>
              {name}
            </p>
          </div>
        </div>
      )}

      <article className="wrap grid gap-10 pb-14 pt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20 lg:py-20">
        <div id="tale-body" className="mx-auto w-full max-w-[640px] lg:mx-0">
          <p className="text-[12px] tracking-[0.02em] text-ash">
            A tale from <LineLabel line={tale.line} /> · {tale.readTime}
          </p>
          <h1 id="tale-title" className="display-l mt-3">
            {tale.title}
          </h1>
          {entry && (
            <Link href={`/products/${entry.handle}`} className="mt-5 flex min-h-12 items-center justify-between gap-3 border-y border-dune py-2 text-[14px] hover:text-sea">
              <span className="min-w-0">
                The scent: <span className="font-semibold">{entry.title}</span>
                <span className="text-ash">
                  {" "}
                  · {entry.bottle?.label ?? `${site.bottleSizeMl} ml`} · <Price money={entry.price} />
                </span>
              </span>
              <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />
            </Link>
          )}
          <div className="reading mt-8">
            {tale.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <blockquote className="signature mt-10 border-l border-gold pl-6 text-ash">“{tale.signature}”</blockquote>
          <Link href="/tales" className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold">
            <Icon name="arrow-left" size={14} /> <span className="lnk lnk-quiet">All tales</span>
          </Link>
        </div>

        {entry && product && (
          <aside id="tale-buy" className="lg:sticky lg:top-28 lg:self-start" aria-label="The scent in this tale">
            <BuyCard entry={entry} product={product} box={boxEntry} />
          </aside>
        )}
      </article>

      {entry?.bottle && product && <TaleBar titleId="tale-title" cardId="tale-buy" variant={entry.bottle} product={product} note={`${entry.bottle.label} · ${formatMoney(entry.bottle.price)}`} />}

      <section className="border-t border-dune">
        {/* Desktop: the finder band sits in the tales' row, its top level with the stills and its foot with the last line. */}
        <div className={`wrap grid gap-y-6 py-14 lg:gap-x-10 lg:py-24 ${others.length ? "lg:grid-cols-[2fr_1fr] lg:grid-rows-[auto_1fr]" : ""}`}>
          {others.length > 0 && (
            <>
              <Eyebrow className="lg:col-start-1 lg:row-start-1">Next tale</Eyebrow>
              <ul className="grid gap-8 md:grid-cols-2 lg:col-start-1 lg:row-start-2">
                {others.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/tales/${t.slug}`} className="group flex flex-col">
                      <TaleStill slug={t.slug} label={t.heroArt} sizes="(min-width: 768px) 33vw, 100vw" />
                      <p className="mt-4 text-[12px] text-ash">
                        <LineLabel line={t.line} />
                      </p>
                      <p className="serif mt-1 text-[24px] leading-[1.15] group-hover:text-sea">{t.signature}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <FinderBand className={others.length ? "max-lg:mt-4 lg:col-start-2 lg:row-start-2 lg:justify-between" : ""} />
        </div>
      </section>
    </>
  );
}

/** The end of every tale: the scent itself, with its price on the button. Until 5 ml variants exist, the mystery box is the smaller step. */
function BuyCard({ entry, product, box }: { entry: ScentIndexEntry; product: BagProduct; box: ScentIndexEntry | null }) {
  return (
    <div className="border border-dune bg-paper p-5">
      <Eyebrow>The scent in this tale</Eyebrow>
      <Link href={`/products/${entry.handle}`} className="group mt-4 grid grid-cols-[96px_minmax(0,1fr)] gap-4 lg:block">
        <ProductImage src={entry.image} alt="" world={entry.world} sizes="(min-width: 1024px) 320px, 96px" className="aspect-square w-full" />
        <div className="min-w-0 lg:mt-4">
          {entry.line && (
            <p className="text-[12px] text-ash">
              <LineLabel line={entry.line} />
            </p>
          )}
          <p className="font-serif text-[26px] font-semibold leading-[1.1] group-hover:text-sea">{entry.title}</p>
          {entry.inspiredBy && (
            <p className="mt-1 text-[14px] leading-snug">
              <InspiredBy as="span" name={entry.inspiredBy} className="text-ash" />
              <span className="text-ash"> · our own composition</span>
            </p>
          )}
          {entry.notesShort.length > 0 && <p className="mt-1 text-[14px] leading-snug text-ash">{joinNotes(entry.notesShort)}</p>}
        </div>
      </Link>
      <div className="mt-5 flex flex-col gap-2">
        {entry.bottle && <AddToBagButton variant={entry.bottle} product={product} source="tale" block label={`Add ${entry.bottle.label} · ${formatMoney(entry.bottle.price)}`} />}
        {entry.sample ? (
          <AddToBagButton variant={entry.sample} product={product} source="tale" kind="sample" look="secondary" block label={`Try ${entry.sample.label} · ${formatMoney(entry.sample.price)}`} />
        ) : (
          box?.bottle?.availableForSale && (
            <Link href={`/products/${box.handle}`} className="flex min-h-12 items-center gap-3 bg-linen px-4 py-3 text-[14px] hover:text-sea">
              <span className="min-w-0 flex-1">
                Not ready for a bottle? <span className="text-ash">The mystery box: three {site.sampleSizeMl} ml scents chosen by the house, {formatMoney(box.bottle.price)}.</span>
              </span>
              <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />
            </Link>
          )
        )}
        <Link href={`/products/${entry.handle}`} className="mx-auto inline-flex min-h-11 items-center text-[13px] font-semibold">
          <span className="lnk">See the full product page</span>
        </Link>
      </div>
    </div>
  );
}
