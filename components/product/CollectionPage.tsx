import Link from "next/link";
import { CollectionGrid, type EditorialTile } from "@/components/product/CollectionGrid";
import { FaqSection } from "@/components/product/Sections";
import { ImageSlot } from "@/components/ui/Primitives";
import { site } from "@/content/site";
import { tales } from "@/content/tales";
import { toIndexEntry, type Scent } from "@/lib/catalogue";
import type { CollectionDef } from "@/content/taxonomy";

export function CollectionPage({ def, scents, query }: { def: CollectionDef; scents: Scent[]; query?: string }) {
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
          <ImageSlot label="Discovery set — six vials in the tray" className="aspect-[16/10] w-full" />
          <div>
            <p className="eyebrow text-ash">The discovery set</p>
            <h2 className="display-l mt-3">Try six for the price of [price]</h2>
            <p className="body-l mt-4 max-w-[50ch] text-ash">Pick any six {def.kind === "line" ? def.title : ""} scents as {site.sampleSizeMl} ml samples. The set price comes back as credit on your first bottle. [confirm]</p>
            <Link href="/finder" className="btn mt-8">
              Build your set
            </Link>
          </div>
        </div>
      </section>
      <FaqSection ids={["longevity", "originals", "cod"]} title="Before you choose" />
    </>
  );
}
