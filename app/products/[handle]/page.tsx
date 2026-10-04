import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import snapshot from "@/content/catalogue.snapshot.json";
import { site } from "@/content/site";
import { families, lines } from "@/content/taxonomy";
import { getRelated, getScent, getScentIndex, getCatalogue, toIndexEntry, type Scent } from "@/lib/catalogue";
import { facts } from "@/lib/facts";
import { sentenceCase } from "@/lib/format";
import { siteImage } from "@/lib/site-images";
import { Gallery } from "@/components/product/Gallery";
import { BuyBox } from "@/components/product/BuyBox";
import { BoxContents, Differs, FaqSection, NotesPyramid, Pairing, sectionReady, TaleExcerpt, WearIt } from "@/components/product/Sections";
import { ProductCard } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { lineWithAudience } from "@/components/product/line";
import { TrackView } from "@/components/analytics/TrackView";
import { Price, SectionHead } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return snapshot.products.map((p) => ({ handle: p.handle }));
}

/** The mystery box sells on what it is, so its words live here rather than in its one-line Shopify description. */
const box = {
  hook: "Three scents, chosen by the house.",
  hookSub: "A first meeting with eternal, before you choose a bottle.",
  description: `Three ${site.sampleSizeMl} ml eaux de parfum, chosen by the house: a first meeting with eternal before you choose a bottle.`,
};

const describe = (s: Scent) => (s.kind === "set" ? box.description : s.description.trim() || s.signature || site.description);
const absolute = (url: string) => new URL(url, site.url).href;

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const scent = await getScent(handle);
  if (!scent) return {};
  const description = describe(scent).slice(0, 160);
  const image = scent.image?.url ?? siteImage("og-image");
  return {
    title: scent.kind === "scent" && scent.line ? `${scent.title} — ${lineWithAudience(scent.line, ", ")}` : scent.title,
    description,
    alternates: { canonical: `/products/${scent.handle}` },
    // The page's openGraph replaces the layout's, so it always carries an image for link previews in DMs and WhatsApp.
    openGraph: { title: scent.title, description, images: image ? [{ url: image }] : undefined, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const scent = await getScent(handle);
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
      : [sectionReady.differs(scent) && "differs", hasNotes && "notes", sectionReady.wear(scent) && "wear", "faq", pair && "pair", sectionReady.tale(scent) && "tale"]
  ).filter(Boolean);
  const n = (key: string) => String(order.indexOf(key) + 1).padStart(2, "0");
  const faqIds = isSet ? ["longevity", "cod", "returns"] : [...(scent.inspiredBy ? ["originals"] : []), "longevity", "wrong", "cod", "returns", "choose"];

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    ...(line && linePage ? [{ name: lineWithAudience(line), href: linePage }] : []),
    { name: scent.title, href: `/products/${scent.handle}` },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: scent.title,
      description: describe(scent),
      image: scent.images.map((i) => absolute(i.url)),
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

  const sizeLabel = scent.bottle?.label ?? `${site.bottleSizeMl} ml`;
  const size = isSet ? `${sizeLabel.replace(/\s*x\s*/i, " × ")} · eaux de parfum` : `${sizeLabel} eau de parfum`;
  const eyebrow = line ? `${lineWithAudience(line)} · ${size}` : size;
  const chips = notes.map((note) => (
    <span key={note} className="inline-flex h-8 items-center rounded-full border border-dune bg-paper px-3 text-[12px] font-medium whitespace-nowrap">
      {sentenceCase(note)}
    </span>
  ));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
                  {c.name}
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
        data-hook={scent.inspiredBy || isSet ? "" : undefined}
        data-chips={chips.length ? "" : undefined}
        data-size={scent.sample ? "" : undefined}
      >
        <Gallery scent={scent} />
        <div className="mt-4 lg:sticky lg:top-28 lg:mt-0 lg:self-start">
          <p className="text-[13px] leading-[18px] text-ash">{eyebrow}</p>
          <div className="mt-1 flex items-baseline justify-between gap-4 lg:mt-3 lg:block">
            <h1 className="min-w-0 text-[32px] leading-[1.1] font-semibold lg:text-[clamp(36px,4vw,56px)]">{scent.title}</h1>
            <Price money={scent.price} className="shrink-0 text-[20px] font-medium lg:mt-4 lg:block lg:text-[22px]" />
          </div>
          {(scent.inspiredBy || isSet) && (
            <div className="mt-2.5">
              {isSet ? (
                <p className="text-[15px] leading-[22px]">{box.hook}</p>
              ) : (
                <p className="text-[15px] leading-[22px]">
                  Inspired by <strong className="font-semibold">{scent.inspiredBy}</strong>
                </p>
              )}
              <p className="text-[12px] leading-[18px] text-ash">{isSet ? box.hookSub : "Our own composition, not affiliated with its house."}</p>
            </div>
          )}
          {chips.length > 0 &&
            (hasNotes ? (
              <a href="#notes" className="mt-2 flex min-h-11 flex-wrap items-center gap-1.5" aria-label={`Notes: ${notes.join(", ")}. See how it smells.`}>
                {chips}
              </a>
            ) : (
              <p className="mt-2 flex min-h-11 flex-wrap items-center gap-1.5">{chips}</p>
            ))}
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
          {mysteryBox?.bottle && !scent.sample && (
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
      {order.includes("notes") && <NotesPyramid scent={scent} index={n("notes")} />}
      {order.includes("wear") && <WearIt scent={scent} index={n("wear")} />}
      <FaqSection ids={faqIds} samples={Boolean(scent.sample)} index={n("faq")} />
      {pair && <Pairing scent={scent} pair={pair} index={n("pair")} />}
      {order.includes("tale") && <TaleExcerpt scent={scent} index={n("tale")} />}

      {alsoLike.length > 0 && (
        <section className="section border-t border-dune">
          <div className="wrap">
            <SectionHead title="You may also like" action={line && linePage ? { label: `All ${lineWithAudience(line)}`, href: linePage } : { label: "All scents", href: "/shop" }} />
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
