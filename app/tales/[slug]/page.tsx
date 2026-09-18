import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { taleBySlug, tales } from "@/content/tales";
import { getScent, toIndexEntry } from "@/lib/catalogue";
import { AddToBagButton } from "@/components/cart/AddToBagButton";
import { ProductImage } from "@/components/product/ProductImage";
import { Parallax } from "@/components/motion/Parallax";
import { ReadingProgress } from "@/components/motion/ReadingProgress";
import { Eyebrow, ImageSlot, Price } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";
import { joinNotes } from "@/lib/format";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return tales.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tale = taleBySlug(slug);
  if (!tale) return {};
  return { title: tale.title, description: tale.signature, alternates: { canonical: `/tales/${tale.slug}` } };
}

export default async function TalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tale = taleBySlug(slug);
  if (!tale) notFound();
  const scent = await getScent(tale.handle);
  const entry = scent ? toIndexEntry(scent) : null;
  const others = tales.filter((t) => t.slug !== tale.slug).slice(0, 2);
  const product = entry ? { handle: entry.handle, title: entry.title, image: entry.image, lineLabel: entry.lineLabel, world: entry.world } : null;

  return (
    <>
      {/* T1: the still moves at 0.2× on desktop; a hairline progress bar tracks the read. */}
      <ReadingProgress targetId="tale-body" />
      <Parallax factor={0.2} className="relative h-[56vh] min-h-[360px] w-full overflow-hidden">
        <div className="parallax-y absolute -inset-y-[12%] inset-x-0">
          <ImageSlot label={tale.heroArt} dark className="h-full w-full" />
        </div>
      </Parallax>
      <article className="wrap grid gap-12 py-12 lg:grid-cols-[1fr_360px] lg:gap-20 lg:py-20">
        <div id="tale-body" className="mx-auto w-full max-w-[640px] lg:mx-0">
          <Eyebrow>
            A tale from {tale.line} · {scent?.title ?? tale.handle} · {tale.readTime}
          </Eyebrow>
          <h1 className="display-l mt-4">{tale.title}</h1>
          <div className="reading mt-10" data-reveal>
            {tale.paragraphs.map((p, i) => (
              <p key={i} className={tale.complete ? "" : "text-ash"}>
                {p}
              </p>
            ))}
          </div>
          <blockquote className="signature mt-12 border-l border-gold pl-6 text-ash" data-reveal>
            “{tale.signature}”
          </blockquote>
          <div className="mt-8 flex items-center gap-6 text-[13px]">
            <Link href="/tales" className="lnk lnk-quiet">
              <Icon name="arrow-left" size={14} /> All tales
            </Link>
          </div>
        </div>

        {entry && scent && product && (
          <>
            {/* T2: the card slides in beside the text at 40 % read (desktop). */}
            <aside data-t2 className="t2 hidden lg:sticky lg:top-28 lg:block lg:self-start" aria-label="The scent in this tale">
              <div className="border border-dune bg-paper p-5">
                <Eyebrow>The scent in this tale</Eyebrow>
                <Link href={`/products/${entry.handle}`} className="group mt-4 block">
                  <ProductImage src={entry.image} alt={entry.title} world={entry.world} sizes="360px" className="aspect-[4/5] w-full" />
                  <p className="display-m mt-4 group-hover:text-sea">{entry.title}</p>
                </Link>
                <p className="mt-1 text-[12px] text-ash">
                  {entry.lineLabel}
                  {entry.inspiredBy ? ` · Inspired by ${entry.inspiredBy}` : ""}
                </p>
                {scent.notesShort.length > 0 && <p className="mt-1 text-[12px] text-ash">{joinNotes(scent.notesShort)}</p>}
                <div className="mt-4 flex items-baseline justify-between">
                  <Price money={entry.price} className="text-[16px] font-medium" />
                  <span className="text-[12px] text-ash">{entry.bottle?.label}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {entry.bottle && <AddToBagButton variant={entry.bottle} product={product} label="Add to bag" block />}
                  {entry.sample && <AddToBagButton variant={entry.sample} product={product} kind="sample" look="secondary" label={`Try ${entry.sample.label}`} block />}
                  <Link href={`/products/${entry.handle}`} className="lnk lnk-quiet mx-auto mt-2 text-[12px]">
                    See the full product page
                  </Link>
                </div>
              </div>
            </aside>
            {/* T2 on mobile: the card rises from the bottom at 30 % read. */}
            <div data-t2 className="t2-bar float-shadow fixed inset-x-0 bottom-0 z-[40] border-t border-dune bg-paper lg:hidden">
              <div className="wrap flex h-[68px] items-center justify-between gap-4">
                <Link href={`/products/${entry.handle}`} className="min-w-0">
                  <p className="display-m truncate !text-[18px]">{entry.title}</p>
                  <p className="text-[12px] text-ash">
                    {entry.bottle?.label} · <Price money={entry.price} />
                  </p>
                </Link>
                {entry.bottle && <AddToBagButton variant={entry.bottle} product={product} size="sm" label="Add to bag" />}
              </div>
            </div>
          </>
        )}
      </article>

      <section className="border-t border-dune">
        <div className="wrap grid gap-10 py-16 lg:grid-cols-[2fr_1fr] lg:py-24">
          <div>
            <Eyebrow>Next tale</Eyebrow>
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {others.map((t, i) => (
                <li key={t.slug} data-reveal style={{ ["--i" as string]: i }}>
                  {/* T3: the image reveals behind the title on hover. */}
                  <Link href={`/tales/${t.slug}`} className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden bg-sand p-6">
                    <ImageSlot label={t.heroArt} className="t3-img absolute inset-0 !border-0" />
                    <p className="relative text-[12px] text-ash">
                      {t.handle.replace(/-/g, " ")} · {t.line}
                    </p>
                    <p className="serif relative mt-1 text-[24px] leading-[1.15] group-hover:text-sea">{t.signature}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-end bg-sand/60 p-8" data-reveal>
            <p className="display-m">Still choosing?</p>
            <p className="mt-2 text-ash">Five questions, three matches, samples of all three.</p>
            <Link href="/finder" className="btn mt-6 self-start">
              Take the scent finder
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
