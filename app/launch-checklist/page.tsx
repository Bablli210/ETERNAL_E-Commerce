import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogue } from "@/lib/catalogue";
import { isConfirmed, pendingFacts } from "@/lib/facts";
import { house } from "@/content/house";
import { siteImage } from "@/lib/site-images";
import { allTales } from "@/content/tales";
import { heroes } from "@/content/heroes";
import { Eyebrow } from "@/components/ui/Primitives";
import { checkoutDomain, shopifyConfigured } from "@/lib/shopify/client";

export const revalidate = 300;

export const metadata: Metadata = { title: "Launch checklist", robots: { index: false, follow: false } };

/** Site-wide image slots that should hold a real file before launch. */
const SITE_IMAGES = [...heroes.flatMap((h) => [`hero-${h.handle}`, `hero-${h.handle}-mobile`]), "line-eterna", "line-eterno", "line-eternal", "finder-band", "mystery-box", "house-film-poster", "house-founder", "house-step-1", "house-step-2", "house-step-3", "og-image"];

/**
 * The environment the ads depend on, read on the server: whether each key is
 * set, never its value. NEXT_PUBLIC_* keys are fixed when the site is built,
 * so this reflects the deployed build.
 */
function storeSetup() {
  const onMyshopify = checkoutDomain.endsWith(".myshopify.com");
  return [
    { key: "NEXT_PUBLIC_META_PIXEL_ID", ok: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID), cost: "No Meta pixel: the ads can’t optimise on, or attribute, a view, an add or a checkout." },
    { key: "NEXT_PUBLIC_GA4_ID", ok: Boolean(process.env.NEXT_PUBLIC_GA4_ID), cost: "No GA4: no funnel from ad landing to checkout." },
    { key: "SHOPIFY_STOREFRONT_ACCESS_TOKEN", ok: shopifyConfigured, cost: "The site runs on the committed catalogue snapshot: prices, stock and new scents only change when it is re-exported." },
    { key: "SHOPIFY_CHECKOUT_DOMAIN", ok: Boolean(process.env.SHOPIFY_CHECKOUT_DOMAIN), cost: "Not set: checkout links, the bag’s checkout warm-up and the newsletter form use the store domain (SHOPIFY_STORE_DOMAIN)." },
    { key: "Checkout off myshopify.com", ok: !onMyshopify, cost: "Checkout still runs on a myshopify.com address: the shopper sees a second domain, and the ad-click cookie (_fbc) never reaches checkout, so Meta can’t tie a Purchase to its click." },
    { key: "COOKIE_DOMAIN", ok: Boolean(process.env.COOKIE_DOMAIN), cost: "The click cookies stay on the storefront host. Set it to the root domain once checkout runs on a subdomain of it." },
  ];
}

/** Tags that each put a scent in a line; a scent tagged into two lines is filed under the first. */
const LINE_TAGS: Record<string, string> = { eterna: "eterna", "for her": "eterna", eterno: "eterno", "for him": "eterno", eternal: "eternal", unisex: "eternal" };
const lineConflict = (tags: string[]) => {
  const hits = tags.filter((t) => t.toLowerCase() in LINE_TAGS);
  return new Set(hits.map((t) => LINE_TAGS[t.toLowerCase()])).size > 1 ? hits.join(" and ") : null;
};

/**
 * Everything the site is still waiting for, in one place for the owner. Not
 * linked from the site and not indexed. Each item hides itself on the site
 * until it is supplied, so nothing here is visible to customers.
 */
export default async function LaunchChecklist() {
  const { all } = await getCatalogue();
  const facts = [
    ...pendingFacts(),
    ...Object.entries(house)
      .filter(([, v]) => !isConfirmed(v))
      .map(([key, value]) => ({ key: `house.${key}`, value, note: "In content/house.ts. The founder section on /house shows once both lines are real and house-founder is a photograph of the founder." })),
  ];
  // Unwritten, or written but still without the wide still that opens the page. Archived tales are off the site on purpose.
  const tales = allTales.filter((t) => !t.archived && (!t.complete || !siteImage(`tale-${t.slug}`)));
  const archived = allTales.filter((t) => t.archived);
  const products = all
    .map((s) => ({
      s,
      missing: [
        s.kind === "scent" && !s.line && "line (tag eterna, eterno or eternal)",
        s.kind === "scent" && lineConflict(s.tags) && `one line, not two (tagged ${lineConflict(s.tags)})`,
        s.kind === "scent" && !s.families.length && !s.moods.length && "scent tags (the finder can’t match it)",
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
  const setup = storeSetup();
  const lineless = products.filter(({ s }) => s.kind === "scent" && !s.line).length;

  return (
    <div className="wrap max-w-[860px] py-12">
      <Eyebrow>Before launch</Eyebrow>
      <h1 className="display-l mt-3">Launch checklist</h1>
      <p className="mt-4 text-ash">Each item below is hidden on the site until it exists, so customers never see a placeholder. Supply it and it switches on by itself.</p>

      <Section title={`Store setup (${setup.filter((x) => !x.ok).length} to do)`} note="Vercel environment variables and Shopify domains. Values are never shown here, only whether each is set; redeploy after a change.">
        {setup.map((x) => (
          <li key={x.key}>
            <code className="text-[13px]">{x.key}</code> — <span className={x.ok ? "text-ash" : "font-semibold"}>{x.ok ? "Done" : "To do"}</span>
            {!x.ok && <span className="block text-[13px] text-ash">{x.cost}</span>}
          </li>
        ))}
      </Section>

      <Section title={`Facts to confirm (${facts.length})`} note="In content/site.ts (and content/house.ts). Replace the bracketed text with the confirmed wording.">
        {facts.map((f) => (
          <li key={f.key + f.value}>
            <code className="text-[13px]">{f.key}</code> — <span className="text-ash">{f.value}</span>
            {f.note && <span className="block text-[13px] text-ash">{f.note}</span>}
          </li>
        ))}
      </Section>

      <Section title={`Tales not yet published (${tales.length})`} note="In content/tales.ts. A tale appears on the site once complete is true and its wide still, public/images/tale-<slug>, exists.">
        {tales.map((t) => (
          <li key={t.slug}>
            {t.handle.replace(/-/g, " ")} — <span className="text-ash">{t.complete ? `written; waiting for tale-${t.slug} (7:3) and tale-${t.slug}-card (4:3)` : `“${t.signature}”`}</span>
          </li>
        ))}
      </Section>

      {archived.length > 0 && (
        <Section title={`Tales archived (${archived.length})`} note="Taken off the site by the owner. In content/tales.ts: delete archived: true to publish one again.">
          {archived.map((t) => (
            <li key={t.slug}>{t.handle.replace(/-/g, " ")}</li>
          ))}
        </Section>
      )}

      <Section title={`Site images missing (${images.length})`} note="In public/images/, by base name. See public/images/README.md.">
        {images.map((n) => (
          <li key={n}>
            <code className="text-[13px]">{n}</code>
          </li>
        ))}
      </Section>

      <Section
        title={`Products with gaps (${products.length})`}
        note={`Shopify product data and metafields, or content/scents.ts.${lineless ? ` ${lineless === 1 ? "One scent has" : `${lineless} scents have`} no line, so For her, For him, Unisex and the finder never show ${lineless === 1 ? "it" : "them"}: tag each eterna, eterno or eternal first.` : ""}`}
      >
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
