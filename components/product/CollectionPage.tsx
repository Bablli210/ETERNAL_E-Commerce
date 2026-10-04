import Image from "next/image";
import Link from "next/link";
import { CollectionGrid } from "@/components/product/CollectionGrid";
import { FaqSection } from "@/components/product/Sections";
import { lines, type CollectionDef, type LineKey } from "@/content/taxonomy";
import { getLineCounts, getScent, toIndexEntry, type Scent } from "@/lib/catalogue";
import { siteImage } from "@/lib/site-images";
import type { GridState } from "./grid-state";

/** Who each line is for, above its name on its own page. */
const FOR: Record<LineKey, string> = { eterna: "For her", eterno: "For him", eternal: "For both" };

/**
 * A collection page for a phone that arrives from an ad. The three line pages
 * open on the line's own still (collection-<slug>, Direction B) as a short
 * band that carries the title and the search, so the band costs no more
 * height than a text head. The mystery box sits inside the grid as the
 * low-risk first order; the FAQ answers what stops a first purchase.
 */
export async function CollectionPage({ def, scents, initial }: { def: CollectionDef; scents: Scent[]; initial?: GridState }) {
  const [box, lineCounts] = await Promise.all([getScent("mystery-box"), getLineCounts()]);
  const line = def.kind === "line" ? (def.key as LineKey) : null;
  const still = line ? siteImage(`collection-${def.slug}`) : null;
  const crumbs = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, ...(def.slug !== "all" ? [{ label: line ? `${FOR[line]} · ${lines[line].label}` : def.title, href: `/shop/${def.slug}` }] : [])];

  return (
    <>
      <section className="wrap pb-16 lg:pb-24">
        {/* On a phone the header's way back is enough; the band or the title starts right under it. */}
        <nav aria-label="Breadcrumb" className="hidden pb-6 pt-8 text-[12px] text-ash lg:block">
          <ol className="flex flex-wrap gap-1">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex gap-1">
                {i > 0 && <span aria-hidden="true">/</span>}
                {i === crumbs.length - 1 ? <span aria-current="page">{c.label}</span> : <Link href={c.href} className="hover:text-night">{c.label}</Link>}
              </li>
            ))}
          </ol>
        </nav>
        <CollectionGrid
          entries={scents.map(toIndexEntry)}
          list={def.slug}
          title={def.title}
          descriptor={def.descriptor}
          eyebrow={line ? FOR[line] : undefined}
          banner={still ? <Image src={still} alt="" fill sizes="(min-width: 1440px) 1280px, 100vw" preload fetchPriority="high" className="object-cover object-[72%_50%]" /> : undefined}
          initial={initial}
          promo={box?.bottle?.availableForSale ? toIndexEntry(box) : null}
          lineCounts={lineCounts}
          badges={def.kind !== "new"}
        />
      </section>
      <FaqSection ids={["longevity", "originals", "cod"]} title="Before you choose" />
    </>
  );
}
