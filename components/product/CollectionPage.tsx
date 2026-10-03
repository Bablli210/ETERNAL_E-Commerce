import Link from "next/link";
import { CollectionGrid, type EditorialTile } from "@/components/product/CollectionGrid";
import { FaqSection } from "@/components/product/Sections";
import { Figure } from "@/components/ui/Figure";
import { site } from "@/content/site";
import { tales } from "@/content/tales";
import { getScent, toIndexEntry, type Scent } from "@/lib/catalogue";
import { formatMoney } from "@/lib/format";
import type { CollectionDef } from "@/content/taxonomy";

export async function CollectionPage({ def, scents, query }: { def: CollectionDef; scents: Scent[]; query?: string }) {
  const box = await getScent("mystery-box");
  const lineTale = def.kind === "line" ? tales.find((t) => t.line === def.key) : null;
  const editorial: EditorialTile = lineTale
    ? { eyebrow: `A tale from ${def.title}`, quote: lineTale.signature, cta: `Read ${lineTale.handle.replace(/-/g, " ")}’s tale`, href: `/tales/${lineTale.slug}`, dark: def.key === "eterno" }
    : { eyebrow: "Still deciding?", quote: "Five questions, three matches, samples of all three.", cta: "Take the scent finder", href: "/finder" };
  const crumbs = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, ...(def.slug !== "all" ? [{ label: def.title, href: `/shop/${def.slug}` }] : [])];

  return (
    <>
      <section className="wrap pb-8 pt-8 lg:pt-12">
        <nav aria-label="Breadcrumb" className="text-[12px] text-ash">
          <ol className="flex flex-wrap gap-1">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex gap-1">
                {i > 0 && <span aria-hidden="true">/</span>}
                {i === crumbs.length - 1 ? <span aria-current="page">{c.label}</span> : <Link href={c.href} className="hover:text-night">{c.label}</Link>}
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="display-l">{query ? `Results for “${query}”` : def.title}</h1>
            <p className="body-l mt-3 max-w-[56ch] text-ash">{def.descriptor}</p>
          </div>
          <p className="tnum text-[13px] text-ash">{scents.length} scents</p>
        </div>
      </section>
      <section className="wrap pb-20">
        <CollectionGrid entries={scents.map(toIndexEntry)} initialQuery={query ?? ""} showLineFilter={def.kind !== "line"} editorial={editorial} />
      </section>
      <section className="border-t border-dune bg-sand/40">
        <div className="wrap grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24" data-reveal>
          <Figure name="mystery-box" label="The mystery box — matte black box, e∞ monogram" dark sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[16/10] w-full" />
          <div>
            <p className="eyebrow text-ash">Not ready for a bottle?</p>
            <h2 className="display-l mt-3">Three scents to try{box ? `, ${formatMoney(box.price)}` : ""}</h2>
            <p className="body-l mt-4 max-w-[50ch] text-ash">The mystery box: three {site.sampleSizeMl} ml eaux de parfum we choose for you, in the matte black box. Wear them for a week, then choose your bottle.</p>
            <Link href="/products/mystery-box" className="btn mt-8">
              See the mystery box
            </Link>
          </div>
        </div>
      </section>
      <FaqSection ids={["longevity", "originals", "cod"]} title="Before you choose" />
    </>
  );
}
