import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import snapshot from "@/content/catalogue.snapshot.json";
import { site } from "@/content/site";
import { getCatalogue, getRelated, getScent, getScentIndex, toIndexEntry } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";
import { Gallery } from "@/components/product/Gallery";
import { BuyBox } from "@/components/product/BuyBox";
import { FaqSection, NotesPyramid, TaleExcerpt, WearIt } from "@/components/product/Sections";
import { ProductCard } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { AddPairButton } from "@/components/product/AddPairButton";
import { Eyebrow, Price, SectionHead } from "@/components/ui/Primitives";

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return snapshot.products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const scent = await getScent(handle);
  if (!scent) return {};
  const desc = scent.signature ?? scent.description ?? site.description;
  return {
    title: `${scent.title}${scent.lineLabel ? ` — ${scent.lineLabel}` : ""}`,
    description: desc.slice(0, 160),
    alternates: { canonical: `/products/${scent.handle}` },
    openGraph: { title: scent.title, description: desc.slice(0, 160), images: scent.image ? [{ url: scent.image.url }] : undefined, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const scent = await getScent(handle);
  if (!scent) notFound();
  const [related, index, { live }] = await Promise.all([getRelated(scent, 4), getScentIndex(), getCatalogue()]);
  const entry = toIndexEntry(scent);
  const pair = related.find((r) => r.line === scent.line && r.bottle) ?? related[0];
  const isSet = scent.kind === "set";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: scent.title,
    description: scent.description,
    image: scent.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "eternal" },
    offers: scent.variants.map((v) => ({
      "@type": "Offer",
      price: v.price.amount,
      priceCurrency: v.price.currencyCode,
      availability: v.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}/products/${scent.handle}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="wrap pt-6 text-[12px] text-ash">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="hover:text-night">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="hover:text-night">Shop</Link>
          </li>
          {scent.line && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/shop/${scent.line === "eterna" ? "her" : scent.line === "eterno" ? "him" : "unisex"}`} className="hover:text-night">
                  {scent.audience} — {scent.lineLabel}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-night">
            {scent.title}
          </li>
        </ol>
      </nav>

      <section className="wrap grid gap-10 pb-16 pt-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-8">
        <Gallery scent={scent} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>{scent.lineLabel ? `${scent.lineLabel} · for ${scent.audience?.toLowerCase()}` : "eternal"}</Eyebrow>
          <h1 className="display-l mt-3">{scent.title}</h1>
          {scent.signature && <p className="signature mt-4 text-ash">{scent.signature}</p>}
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Price money={scent.price} className="text-[22px] font-medium" />
            <span className="text-[13px] text-ash">{scent.bottle?.label ?? ""} · {isSet ? "sample set" : "eau de parfum"}</span>
          </div>
          {scent.inspiredBy && (
            <p className="mt-4 text-[14px]">
              Inspired by <strong>{scent.inspiredBy}</strong> <span className="ml-2 text-[11px] uppercase tracking-[0.08em] text-ash">our own composition</span>
              <span className="mt-1 block text-[12px] text-ash">Our reading of a fragrance people already love. Not affiliated with the original house.</span>
            </p>
          )}
          {!scent.inspiredBy && scent.description && <p className="mt-4 text-[15px] leading-relaxed text-ash">{scent.description}</p>}
          {scent.families.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {scent.families.map((f) => (
                <li key={f}>
                  <Link href={`/shop/${f}`} className="chip">
                    {f === "amber-spice" ? "Amber & spice" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 border-t border-dune pt-8">
            <BuyBox entry={entry} lowStock={live ? scent.lowStock : null} />
          </div>
          {!isSet && !scent.sample && (
            <p className="mt-6 text-[12px] text-ash">
              Not ready for a bottle? <Link href="/products/mystery-box" className="lnk lnk-quiet text-night">The mystery box</Link> is three {site.sampleSizeMl} ml scents chosen for you.
            </p>
          )}
        </div>
      </section>

      {!isSet && <NotesPyramid scent={scent} />}
      {!isSet && <TaleExcerpt scent={scent} />}
      {!isSet && <WearIt scent={scent} />}
      <FaqSection ids={["longevity", "originals", "cod", "returns", "wrong"]} index="05" />

      {!isSet && pair && (
        <section className="section border-t border-dune bg-sand/40">
          <div className="wrap">
            <SectionHead index="06" title="Complete the ritual" sub="Night and day, from the same line." />
            <div className="mt-10 grid gap-6 bg-paper p-6 md:grid-cols-[1fr_1fr_auto] md:items-center md:p-8" data-reveal>
              {[scent, pair].map((s) => (
                <div key={s.handle} className="flex items-center gap-4">
                  <ProductCardMini entry={toIndexEntry(s)} />
                </div>
              ))}
              <div className="flex flex-col items-start gap-2 md:items-end">
                <p className="text-[12px] text-ash">Together</p>
                <p className="tnum text-[22px] font-medium">{formatMoney({ amount: parseFloat(scent.price.amount) + parseFloat(pair.price.amount), currencyCode: scent.price.currencyCode })}</p>
                <p className="text-[11px] text-ash">[Pair discount to confirm]</p>
                <AddPairButton a={entry} b={toIndexEntry(pair)} />
              </div>
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section border-t border-dune">
          <div className="wrap">
            <SectionHead title="You may also like" action={{ label: scent.line ? `All ${scent.lineLabel}` : "All scents", href: scent.line ? `/shop/${scent.line === "eterna" ? "her" : scent.line === "eterno" ? "him" : "unisex"}` : "/shop" }} />
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {related.map((r, i) => (
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

function ProductCardMini({ entry }: { entry: ReturnType<typeof toIndexEntry> }) {
  return (
    <Link href={`/products/${entry.handle}`} className="group flex items-center gap-4">
      <span className="relative block h-[110px] w-[88px] shrink-0 overflow-hidden" style={{ backgroundColor: entry.world.bg }}>
        {entry.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </span>
      <span>
        <span className="block text-[11px] uppercase tracking-[0.14em] text-ash">{entry.lineLabel ?? ""}</span>
        <span className="display-m block group-hover:text-sea">{entry.title}</span>
        <Price money={entry.price} className="text-[13px] text-ash" />
      </span>
    </Link>
  );
}
