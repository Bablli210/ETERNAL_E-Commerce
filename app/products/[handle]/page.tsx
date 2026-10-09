import { scents as scentContent } from "@/content/scents";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import snapshot from "@/content/catalogue.snapshot.json";
import { site } from "@/content/site";
import { families, lines, type LineKey } from "@/content/taxonomy";
import { getRelated, getScent, getScentIndex, getCatalogue, toIndexEntry, type Scent } from "@/lib/catalogue";
import { facts } from "@/lib/facts";
import { joinNotes, sentenceCase, sizeLabel } from "@/lib/format";
import { Gallery } from "@/components/product/Gallery";
import { BuyBox } from "@/components/product/BuyBox";
import { BoxContents, Differs, FaqSection, notesAnswer, Pairing, sectionReady, TaleExcerpt, WearIt } from "@/components/product/Sections";
import { ProductCard } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { lineWithAudience } from "@/components/product/line";
import { LineLabel } from "@/components/product/LineLabel";
import { EternalOriginal, InspiredBy } from "@/components/product/InspiredBy";
import { TrackView } from "@/components/analytics/TrackView";
import { Price, SectionHead } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 300;
export const dynamicParams = true;

/**
 * Longest original that fits on its own line under "INSPIRED BY" on a 360 px phone, in The Seasons at 20 px
 * (measured: "Creed Aventus (Smokey Edition)" fits, "Lorenzo Pazzaglia Summer Hammer" wraps). A longer one
 * wraps, and the page marks it (data-hook-long) so the gallery frame gives that line back.
 */
const ORIGINAL_ONE_LINE = 30;

export function generateStaticParams() {
  return snapshot.products.filter((p) => !scentContent[p.handle]?.inactive).map((p) => ({ handle: p.handle }));
}

/** The mystery box sells on what it is, so its words live here rather than in its one-line Shopify description. */
const box = {
  hook: "Three scents for him or for her, chosen by the house.",
  hookSub: "A first meeting with eternal, before you choose a bottle.",
  description: `Three ${site.sampleSizeMl} ml eaux de parfum for him or for her, chosen by the house: a first meeting with eternal before you choose a bottle.`,
};

/** The product's own words; one without a Shopify description yet still says what it is, rather than the house's line. */
const describe = (s: Scent) => {
  if (s.kind === "set") return box.description;
  if (s.description.trim()) return s.description.trim();
  const what = s.line ? `${s.title}, an eau de parfum from ${lineWithAudience(s.line, ", ")}.` : `${s.title}, an eau de parfum from ${site.name}.`;
  return [what, s.inspiredBy && `Inspired by ${s.inspiredBy}.`, s.isOriginal && "An Eternal Original: our own composition, not inspired by another fragrance.", s.notesShort.length && `Notes of ${joinNotes(s.notesShort.slice(0, 3)).toLowerCase()}.`, s.signature].filter(Boolean).join(" ");
};
const absolute = (url: string) => new URL(url, site.url).href;

/** A mis-cased link from a bio or an ad (/products/WAYNE) lands on the product, not a 404. */
async function findScent(handle: string): Promise<Scent | null> {
  const scent = await getScent(handle);
  if (scent) return scent;
  const lower = handle.toLowerCase();
  if (lower !== handle && (await getScent(lower))) permanentRedirect(`/products/${lower}`);
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const scent = await findScent(handle);
  if (!scent) return {};
  const description = describe(scent).replace(/\s+/g, " ").slice(0, 160);
  // The unisex line is called eternal, like the house, so its products leave the house's name off the end rather than say it twice.
  const named = scent.kind === "scent" && scent.line ? `${scent.title} — ${lineWithAudience(scent.line, ", ")}` : scent.title;
  return pageMeta({
    title: named,
    absolute: scent.line === "eternal",
    description,
    path: `/products/${scent.handle}`,
    // The packshot previews the product in DMs and WhatsApp.
    image: scent.image?.url ?? null,
    imageAlt: scent.title,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const scent = await findScent(handle);
  if (!scent) notFound();
  const isSet = scent.kind === "set";
  const [related, index, { live }, mysteryBox] = await Promise.all([getRelated(scent, 5), getScentIndex(), getCatalogue(), isSet ? null : getScent("mystery-box")]);
  const entry = toIndexEntry(scent);
  const pair = isSet ? undefined : related.find((r) => r.bottle?.availableForSale);
  const alsoLike = related.filter((r) => r !== pair).slice(0, 4);
  const line = isSet ? null : scent.line;
  const linePage = line ? `/shop/${lines[line].slug}` : null;
  const notes = isSet ? [] : scent.notesShort.slice(0, 3);
  const hasNotes = !isSet && sectionReady.notes(scent);

  // Sections below the first screen, in the playbook's order; only those with content render, numbered as they appear.
  const order = (
    isSet
      ? ["box", "faq"]
      : [sectionReady.differs(scent) && "differs", sectionReady.wear(scent) && "wear", "faq", pair && "pair", sectionReady.tale(scent) && "tale"]
  ).filter(Boolean);
  const n = (key: string) => String(order.indexOf(key) + 1).padStart(2, "0");
  const faqIds = isSet ? ["longevity", "cod", "returns"] : [...(scent.inspiredBy ? ["originals"] : []), "longevity", "wrong", "cod", "returns", "choose"];
  // What it smells like opens "Good to know"; the page has no notes section of its own.
  const faqLead = hasNotes ? [{ id: "notes", q: "What does it smell like?", a: notesAnswer(scent) }] : [];
  // The box sells vials, not a bottle: its returns question says so.
  const faqQuestions = isSet ? { returns: "Can I return the box?" } : undefined;

  const crumbs: { name: string; href: string; line?: LineKey }[] = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    ...(line && linePage ? [{ name: lineWithAudience(line), href: linePage, line }] : []),
    { name: scent.title, href: `/products/${scent.handle}` },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: scent.title,
      description: describe(scent),
      // An empty image list reads as a missing image to merchant listings; leave it out until the product has one.
      ...(scent.images.length ? { image: scent.images.map((i) => absolute(i.url)) } : {}),
      url: absolute(`/products/${scent.handle}`),
      brand: { "@type": "Brand", name: "eternal" },
      offers: scent.variants.map((v) => ({
        "@type": "Offer",
        ...(v.sku ? { sku: v.sku } : {}),
        price: v.price.amount,
        priceCurrency: v.price.currencyCode,
        itemCondition: "https://schema.org/NewCondition",
        availability: v.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: absolute(`/products/${scent.handle}`),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absolute(c.href) })),
    },
  ];

  const bottleLabel = scent.bottle?.label ?? `${site.bottleSizeMl} ml`;
  const size = isSet ? `${sizeLabel(bottleLabel)} · eaux de parfum` : `${bottleLabel} eau de parfum`;
  const eyebrow = line ? (
    <>
      <LineLabel line={line} /> · {size}
    </>
  ) : (
    size
  );
  const chips = notes.map((note) => (
    <span key={note} className="inline-flex h-8 items-center rounded-full border border-dune bg-paper px-3 text-[12px] font-medium whitespace-nowrap">
      {sentenceCase(note)}
    </span>
  ));

  return (
    <>
      {/* "<" escaped, so a "</script>" inside a Shopify description cannot close the tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {scent.bottle && (
        <TrackView item={{ productId: entry.productId, variantId: scent.bottle.numericId, name: scent.title, price: parseFloat(scent.bottle.price.amount), variant: scent.bottle.label, category: scent.lineLabel }} />
      )}
      <nav aria-label="Breadcrumb" className="wrap hidden pt-6 text-[12px] text-ash md:block">
        <ol className="flex flex-wrap gap-1">
          {crumbs.map((c, i) => (
            <li key={c.href} className="flex gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-night">
                  {c.line ? <LineLabel line={c.line} /> : c.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-night">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <section
        className="pdp-hero wrap grid grid-cols-[minmax(0,1fr)] pt-3 pb-14 md:pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 lg:pt-8"
        data-announce={facts.announcement ? "" : undefined}
        data-hook={scent.inspiredBy || scent.isOriginal || isSet ? "" : undefined}
        data-hook-long={!isSet && (scent.inspiredBy?.length ?? 0) > ORIGINAL_ONE_LINE ? "" : undefined}
        data-chips={chips.length ? "" : undefined}
        data-size={scent.sample ? "" : undefined}
        data-long={scent.title.length > 14 ? "" : undefined}
      >
        <Gallery scent={scent} />
        <div className="mt-4 lg:sticky lg:top-28 lg:mt-0 lg:self-start">
          <p className="text-[13px] leading-[18px] text-ash">{eyebrow}</p>
          <div className="mt-1 flex items-baseline justify-between gap-4 lg:mt-3 lg:block">
            <h1 className="min-w-0 text-[28px] leading-[1.1] font-semibold lg:text-[clamp(36px,4vw,56px)]">{scent.title}</h1>
            <Price money={scent.price} className="shrink-0 text-[20px] font-medium lg:mt-4 lg:block lg:text-[22px]" />
          </div>
          {(scent.inspiredBy || scent.isOriginal || isSet) && (
            <div className="mt-2.5">
              {isSet ? (
                <p className="text-[15px] leading-[22px]">{box.hook}</p>
              ) : scent.isOriginal ? (
                <EternalOriginal className="text-[14px] leading-6 text-ash" />
              ) : (
                <InspiredBy name={scent.inspiredBy ?? ""} className="text-[14px] leading-6 text-ash" nameClassName="text-[20px]" />
              )}
              <p className="text-[12px] leading-[18px] text-ash">
                {isSet ? box.hookSub : scent.isOriginal ? "Our own composition, not inspired by another fragrance." : "Our own composition, not affiliated with its house."}
              </p>
            </div>
          )}
          {chips.length > 0 && <p className="mt-2 flex min-h-11 flex-wrap items-center gap-1.5">{chips}</p>}
          <div className="mt-3">
            <BuyBox entry={entry} lowStock={live ? scent.lowStock : null} />
          </div>

          {scent.signature && <p className="signature mt-8 text-ash">{scent.signature}</p>}
          {scent.families.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-2">
              {scent.families.map((f) => (
                <li key={f}>
                  <Link href={`/shop/${f}`} className="flex h-11 items-center" aria-label={`More ${families[f].label.toLowerCase()} scents`}>
                    <span className="chip">{families[f].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {mysteryBox?.bottle?.availableForSale && !scent.sample && (
            <Link href="/products/mystery-box" className="mt-6 flex items-center gap-3 bg-paper px-4 py-3.5 text-[14px] hover:text-sea">
              <span className="min-w-0 flex-1">
                Not ready for a bottle?{" "}
                <span className="text-ash">
                  The mystery box: three {site.sampleSizeMl} ml scents chosen by the house, <Price money={mysteryBox.bottle.price} className="whitespace-nowrap" />.
                </span>
              </span>
              <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />
            </Link>
          )}
        </div>
      </section>

      {isSet && <BoxContents index={n("box")} sampleMl={site.sampleSizeMl} bottleMl={site.bottleSizeMl} />}
      {order.includes("differs") && <Differs scent={scent} index={n("differs")} />}
      {order.includes("wear") && <WearIt scent={scent} index={n("wear")} />}
      <FaqSection ids={faqIds} questions={faqQuestions} lead={faqLead} samples={Boolean(scent.sample)} index={n("faq")} current={`/products/${scent.handle}`} />
      {pair && <Pairing scent={scent} pair={pair} index={n("pair")} />}
      {order.includes("tale") && <TaleExcerpt scent={scent} index={n("tale")} />}

      {alsoLike.length > 0 && (
        <section className="section border-t border-dune">
          <div className="wrap">
            <SectionHead title="You may also like" action={
                line && linePage
                  ? {
                      label: (
                        <>
                          All <LineLabel line={line} />
                        </>
                      ),
                      href: linePage,
                    }
                  : { label: "All scents", href: "/shop" }
              } />
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {alsoLike.map((r, i) => (
                <div key={r.handle} data-reveal style={{ ["--i" as string]: i }}>
                  <ProductCard entry={toIndexEntry(r)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed current={scent.handle} index={index} />
    </>
  );
}
