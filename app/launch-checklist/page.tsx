import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { pendingFacts } from "@/lib/facts";
import { siteImage } from "@/lib/site-images";
import { allTales } from "@/content/tales";
import { Eyebrow } from "@/components/ui/Primitives";

export const revalidate = 300;

export const metadata: Metadata = { title: "Launch checklist", robots: { index: false, follow: false } };

/** Site-wide image slots that should hold a real file before launch. */
const SITE_IMAGES = ["home-hero", "home-hero-mobile", "line-eterna", "line-eterno", "line-eternal", "finder-band", "mystery-box", "house-film-poster", "house-founder", "house-step-1", "house-step-2", "house-step-3", "og-image"];

/**
 * Everything the site is still waiting for, in one place for the owner. Not
 * linked from the site and not indexed. Each item hides itself on the site
 * until it is supplied, so nothing here is visible to customers.
 */
export default async function LaunchChecklist() {
  const { all } = await getCatalogue();
  const facts = pendingFacts();
  const tales = allTales.filter((t) => !t.complete);
  const products = all
    .map((s) => ({
      s,
      missing: [
        !s.images.length && "packshot",
        s.images.length < 2 && "second frame",
        s.kind === "scent" && !s.inspiredBy && "inspired-by",
        s.kind === "scent" && !s.notes && "notes pyramid",
        s.kind === "scent" && !s.comparison && "how ours differs",
        s.kind === "scent" && !s.signature && "signature line",
        s.kind === "scent" && s.longevity === null && "longevity and sillage",
        s.kind === "scent" && !s.sample && "5 ml variant",
      ].filter(Boolean) as string[],
    }))
    .filter((x) => x.missing.length);
  const images = SITE_IMAGES.filter((n) => !siteImage(n));

  return (
    <div className="wrap max-w-[860px] py-12">
      <Eyebrow>Before launch</Eyebrow>
      <h1 className="display-l mt-3">Launch checklist</h1>
      <p className="mt-4 text-ash">Each item below is hidden on the site until it exists, so customers never see a placeholder. Supply it and it switches on by itself.</p>

      <Section title={`Facts to confirm (${facts.length})`} note="In content/site.ts. Replace the bracketed text with the confirmed wording.">
        {facts.map((f) => (
          <li key={f.key + f.value}>
            <code className="text-[13px]">{f.key}</code> — <span className="text-ash">{f.value}</span>
            {f.note && <span className="block text-[13px] text-ash">{f.note}</span>}
          </li>
        ))}
      </Section>

      <Section title={`Tales to write (${tales.length})`} note="In content/tales.ts. A tale appears on the site once complete is true.">
        {tales.map((t) => (
          <li key={t.slug}>
            {t.handle.replace(/-/g, " ")} — <span className="text-ash">“{t.signature}”</span>
          </li>
        ))}
      </Section>

      <Section title={`Site images missing (${images.length})`} note="In public/images/, by base name. See public/images/README.md.">
        {images.map((n) => (
          <li key={n}>
            <code className="text-[13px]">{n}</code>
          </li>
        ))}
      </Section>

      <Section title={`Products with gaps (${products.length})`} note="Shopify product data and metafields, or content/scents.ts.">
        {products.map(({ s, missing }) => (
          <li key={s.handle}>
            <Link href={`/products/${s.handle}`} className="lnk lnk-quiet">
              {s.title}
            </Link>{" "}
            — <span className="text-ash">{missing.join(", ")}</span>
          </li>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-dune pt-8">
      <h2 className="display-m">{title}</h2>
      <p className="mt-1 text-[13px] text-ash">{note}</p>
      <ul className="mt-5 flex flex-col gap-3 text-[15px]">{children}</ul>
    </section>
  );
}
