import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogue, getScent } from "@/lib/catalogue";
import { lines, type LineKey } from "@/content/taxonomy";
import { site } from "@/content/site";
import { facts } from "@/lib/facts";
import { formatMoney } from "@/lib/format";
import { NotFoundSearch } from "@/components/content/NotFoundSearch";
import { WhatsAppLink } from "@/components/content/WhatsAppLink";
import { Mark } from "@/components/ui/Wordmark";
import { LineName } from "@/components/ui/LineName";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Page not found" };

/** Audience first: the three line names differ by one letter. */
const LINES: { key: LineKey; label: string }[] = [
  { key: "eterna", label: "For her" },
  { key: "eterno", label: "For him" },
  { key: "eternal", label: "Unisex" },
];

const ROW = "flex min-h-12 items-center gap-3 py-3 text-[15px] hover:text-sea";
const chevron = <Icon name="chevron-right" size={16} className="shrink-0 text-ash" />;

/**
 * Most visitors who land here followed an ad or a shared link, so the way
 * back is the shortest one: the original they know, the line they came for,
 * the mystery box, the finder, or a person on WhatsApp.
 */
export default async function NotFound() {
  const [{ scents }, box] = await Promise.all([getCatalogue(), getScent("mystery-box")]);
  const originals = scents.flatMap((s) => (s.inspiredBy ? [s.inspiredBy] : []));
  return (
    <section className="wrap py-10 lg:py-20">
      <div className="mx-auto max-w-[520px]">
        <Mark size={72} className="text-night" />
        <h1 className="display-l mt-5">This page has faded.</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ash">The scents have not. Search by name, or by the original you love.</p>
        <div className="mt-6">
          <NotFoundSearch />
        </div>
        {originals.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2">
            <span className="text-[12px] text-ash">For example</span>
            {originals.map((o) => (
              <Link key={o} href={`/shop?q=${encodeURIComponent(o)}`} className="flex h-11 items-center">
                <span className="chip">{o}</span>
              </Link>
            ))}
          </div>
        )}

        <ul className="mt-8 divide-y divide-dune border-y border-dune">
          {LINES.map((l) => (
            <li key={l.key}>
              <Link href={`/shop/${lines[l.key].slug}`} className={ROW}>
                <span className="min-w-0 flex-1 font-semibold">
                  {l.label} <span aria-hidden="true">·</span> <LineName line={l.key} size="1.15em" />
                </span>
                {chevron}
              </Link>
            </li>
          ))}
          {box?.bottle && (
            <li>
              <Link href={`/products/${box.handle}`} className={ROW}>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">The mystery box</span>
                  <span className="text-ash">
                    {" "}
                    · three {site.sampleSizeMl} ml scents chosen by the house, {formatMoney(box.bottle.price)}
                  </span>
                </span>
                {chevron}
              </Link>
            </li>
          )}
          <li>
            <Link href="/finder" className={ROW}>
              <span className="min-w-0 flex-1">
                <span className="font-semibold">Not sure?</span> <span className="text-ash">Five questions, three matches.</span>
              </span>
              {chevron}
            </Link>
          </li>
          {facts.whatsapp && (
            <li>
              <WhatsAppLink number={facts.whatsapp} text="Hello eternal, a link I followed did not open." from="not_found" className={ROW}>
                <span className="inline-flex min-w-0 flex-1 items-center gap-2 font-semibold">
                  <Icon name="whatsapp" size={16} /> Ask us on WhatsApp
                </span>
                {chevron}
              </WhatsAppLink>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
