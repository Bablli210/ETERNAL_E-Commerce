import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { pageMeta } from "@/lib/metadata";
import { getCatalogue, getLineCounts, getScent } from "@/lib/catalogue";
import { lines, type LineKey } from "@/content/taxonomy";
import { site } from "@/content/site";
import { facts } from "@/lib/facts";
import { formatMoney } from "@/lib/format";
import { siteImage } from "@/lib/site-images";
import { Eyebrow } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";
import { FinderBand } from "@/components/content/FinderBand";
import { WhatsAppLink } from "@/components/content/WhatsAppLink";

export const revalidate = 300;

const description =
  "eternal is an Egyptian perfume house from Cairo, composing its own eaux de parfum in three lines: eterna for her, eterno for him and eternal unisex.";

/** "About eternal" leads, so the house's name is in the title once, at the start. */
export const metadata: Metadata = pageMeta({
  title: "About eternal — an Egyptian perfume house from Cairo",
  absolute: true,
  description,
  path: "/about",
  image: siteImage("house-film-poster"),
  imageAlt: "A long wooden table of amber bottles in a dim room",
});

const LINE_ORDER: LineKey[] = ["eterna", "eterno", "eternal"];
/** Who each line is for, as the list says it. */
const FOR: Record<LineKey, string> = { eterna: "For her", eterno: "For him", eternal: "Unisex" };

/** An owner's line as one sentence, whether or not it was written with a full stop. */
const sentence = (s: string) => `${s.replace(/[.\s]+$/, "")}.`;
/** "Made in Egypt" as it reads mid-sentence. */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
/** "cash on delivery or InstaPay". */
const orList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} or ${items.at(-1)}` : (items[0] ?? ""));

/** The house's Instagram as "@handle", once site.instagram names a real profile. */
const instagramHandle = (() => {
  const m = site.instagram.match(/instagram\.com\/([^/?#]+)/);
  return m ? `@${m[1]}` : null;
})();

/** A text link with a 44 px tap area, as on /help. */
function Way({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-night">
      <span className="lnk">{children}</span> <Icon name="arrow-right" size={14} />
    </Link>
  );
}

type Step = { id: string; image: string; label: string; alt: string; title: string; body: string };

/**
 * Who the house is, for people and for search: the page Google reads to call
 * eternal an Egyptian perfume house. Text first and quiet, in /help's reading
 * column, since the owner keeps the home page to the products. Every line is a
 * fact the shop already states or reads from the catalogue; the founder's
 * section, and "since …", appear only once the owner confirms them in
 * content/site.ts (lib/facts.ts), and /launch-checklist lists them until then.
 */
export default async function AboutPage() {
  const [{ scents }, counts, box] = await Promise.all([getCatalogue(), getLineCounts(), getScent("mystery-box")]);
  const inspired = scents.filter((s) => s.inspiredBy).length;
  const originals = scents.filter((s) => s.isOriginal).length;
  const founderPhoto = siteImage("house-founder");
  const founder = facts.founderNote && facts.founderName && founderPhoto ? { note: facts.founderNote, name: facts.founderName, photo: founderPhoto } : null;
  const methods = facts.paymentMethods.map((m) => (/cash/i.test(m) ? `${m.toLowerCase()}${facts.codFee ? ` (${lowerFirst(facts.codFee)})` : ""}` : m));

  const tryIt = [
    facts.freeSamples && `Every bottle comes with a free ${site.sampleSizeMl} ml of another scent.`,
    box?.bottle?.availableForSale && `Not ready for a bottle? The mystery box holds three ${site.sampleSizeMl} ml scents chosen by the house, for ${formatMoney(box.bottle.price)}.`,
  ].filter((v): v is string => Boolean(v));

  const steps: Step[] = [
    {
      id: "known",
      image: "house-step-1",
      label: "Small glass bottles of perfume oil on a sunlit wooden table",
      alt: "Small glass bottles of perfume oil on a sunlit wooden table",
      title: "It starts with a scent you love.",
      body: `${inspired} of our ${scents.length} scents start from a fragrance you may already know. Each one’s page names the original, so you know what to expect before you smell it.`,
    },
    {
      id: "composed",
      image: "house-step-2",
      label: "Pipettes resting in small beakers of perfume in window light",
      alt: "Pipettes resting in small beakers of perfume in window light",
      title: "Then we compose our own.",
      body: "Every eternal scent is our own composition, in our own bottle. We are not affiliated with the houses behind the originals. Inspired by, never imitated.",
    },
    ...(tryIt.length
      ? [
          {
            id: "skin",
            image: "house-step-3",
            label: "A paper blotter strip held against a wrist",
            alt: "A paper blotter strip held against a wrist",
            title: "You wear it before you choose.",
            body: tryIt.join(" "),
          },
        ]
      : []),
  ];

  const ordering: { term: string; detail: string }[] = [
    { term: "The bottle", detail: `Eau de parfum, ${site.bottleSizeMl} ml${facts.origin ? `, ${lowerFirst(facts.origin)}` : ""}.` },
    ...(methods.length ? [{ term: "Paying", detail: sentence(`By ${orList(methods)}`) }] : []),
    ...(facts.deliveryTime || facts.freeDeliveryOver
      ? [
          {
            term: "Delivery",
            detail: [facts.deliveryTime && sentence(`Across Egypt, ${facts.deliveryTime}`), facts.deliveryIncluded !== true && facts.freeDeliveryOver && `Free on orders over ${facts.freeDeliveryOver}.`].filter(Boolean).join(" "),
          },
        ]
      : []),
    ...(facts.returnsPolicy ? [{ term: "Returns", detail: sentence(facts.returnsWindow ? `${facts.returnsPolicy}, within ${facts.returnsWindow}` : facts.returnsPolicy) }] : []),
  ];

  const home = site.url.replace(/\/$/, "");
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${home}/about#page`,
        url: `${home}/about`,
        name: "About eternal",
        description,
        about: { "@id": `${home}/#house` },
        isPartOf: { "@id": `${home}/#site` },
        breadcrumb: { "@id": `${home}/about#breadcrumb` },
      },
      // The same house as the home page's (one @id), with what this page adds: where it was founded, and when and by whom once confirmed.
      {
        "@type": "Organization",
        "@id": `${home}/#house`,
        name: site.name,
        url: `${home}/`,
        description: site.description,
        foundingLocation: { "@type": "Place", name: "Cairo, Egypt" },
        ...(facts.founded ? { foundingDate: facts.founded } : {}),
        ...(founder ? { founder: { "@type": "Person", name: founder.name } } : {}),
        ...(instagramHandle ? { sameAs: [site.instagram] } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${home}/about#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${home}/` },
          { "@type": "ListItem", position: 2, name: "About eternal", item: `${home}/about` },
        ],
      },
    ],
  };

  return (
    <>
      {/* "<" escaped, so no string in the data can close the tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      <section className="wrap pt-8 text-center lg:pt-16">
        <Eyebrow>About eternal</Eyebrow>
        <h1 className="display-l mt-3 text-balance">An Egyptian perfume house, from Cairo.</h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-[16px] leading-relaxed text-ash lg:text-[17px]">
          eternal is a perfume house from Cairo{facts.founded ? `, since ${facts.founded}` : ""}. We make {scents.length} eaux de parfum in three lines: eterna for her, eterno for him and eternal
          unisex{facts.origin ? `, every one ${lowerFirst(facts.origin.replace(/\.$/, ""))}` : ""}.
        </p>
      </section>

      <div className="wrap mt-8 lg:mt-12">
        <Figure
          name="house-film-poster"
          label="The atelier: a long wooden table of amber bottles in a dim room"
          alt="A long wooden table of amber bottles in a dim room"
          priority
          sizes="(min-width: 1280px) 1240px, 100vw"
          className="aspect-[4/3] w-full bg-night sm:aspect-[16/9] lg:aspect-[21/9]"
        />
      </div>

      <section aria-labelledby="how-title" className="wrap py-12 lg:py-20">
        <h2 id="how-title" className="display-l text-center">
          How a scent comes to be
        </h2>
        <ol className={`mt-8 grid gap-10 lg:mt-12 lg:gap-8 ${steps.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {steps.map((s, i) => (
            <li key={s.id} className="flex flex-col gap-4" data-reveal>
              <Figure name={s.image} label={s.label} alt={s.alt} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[3/2] w-full bg-sand md:aspect-[4/5]" />
              <div>
                <span className="tnum serif block text-[20px] text-gold-text">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="display-m mt-1">{s.title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-night">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="wrap pb-14 lg:pb-20">
        <div className="mx-auto max-w-[680px]">
          <div className="divide-y divide-dune border-y border-dune">
            {originals > 0 && (
              <section aria-labelledby="originals-title" className="py-8 lg:py-10">
                <h2 id="originals-title" className="display-m">
                  Eternal Originals
                </h2>
                <p className="mt-3 text-[16px] leading-relaxed text-night">
                  {originals === 1 ? "One scent is" : `${originals} scents are`} ours alone, composed with no original behind {originals === 1 ? "it" : "them"}. You will only find {originals === 1 ? "it" : "them"} at eternal.
                </p>
                <Way href="/shop/originals">Shop the Eternal Originals</Way>
              </section>
            )}

            <section aria-labelledby="lines-title" className="py-8 lg:py-10">
              <h2 id="lines-title" className="display-m">
                Three lines, one house
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-night">The line names differ by one letter, so each one travels with who it is for.</p>
              <ul className="mt-4 divide-y divide-dune border-t border-dune">
                {LINE_ORDER.map((k) => (
                  <li key={k}>
                    <Link href={`/shop/${lines[k].slug}`} className="group flex min-h-16 items-center justify-between gap-4 py-3">
                      <span>
                        <span className="serif block text-[24px] leading-tight">{lines[k].label}</span>
                        <span className="block text-[14px] text-ash">
                          {FOR[k]} · {counts[k]} scents · {lines[k].blurb}
                        </span>
                      </span>
                      <Icon name="arrow-right" size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {ordering.length > 0 && (
              <section aria-labelledby="ordering-title" className="py-8 lg:py-10">
                <h2 id="ordering-title" className="display-m">
                  From Cairo, across Egypt
                </h2>
                <dl className="mt-4 grid gap-x-6 gap-y-3 text-[16px] leading-relaxed sm:grid-cols-[9rem_1fr]">
                  {ordering.map((o) => (
                    <div key={o.term} className="contents">
                      <dt className="eyebrow pt-1 text-ash">{o.term}</dt>
                      <dd className="text-night">{o.detail}</dd>
                    </div>
                  ))}
                </dl>
                <Way href="/help">Delivery, payment and returns</Way>
              </section>
            )}

            {founder && (
              <section aria-labelledby="founder-title" className="grid gap-6 py-8 sm:grid-cols-[180px_1fr] sm:items-start lg:py-10">
                <Figure name="house-founder" label={founder.name} alt={founder.name} sizes="180px" className="aspect-[4/5] w-full max-w-[220px] bg-sand" />
                <div>
                  <h2 id="founder-title" className="display-m">
                    From the founder
                  </h2>
                  <blockquote className="serif mt-3 text-[20px] leading-snug text-night">{founder.note}</blockquote>
                  <p className="mt-3 text-[14px] text-ash">{founder.name}</p>
                </div>
              </section>
            )}

            {(instagramHandle || facts.whatsapp) && (
              <section aria-labelledby="talk-title" className="py-8 lg:py-10">
                <h2 id="talk-title" className="display-m">
                  Talk to the house
                </h2>
                <div className="mt-3 flex flex-col gap-2.5 text-[16px] leading-relaxed text-night">
                  {instagramHandle && (
                    <p>
                      New scents and the tales behind them are on Instagram,{" "}
                      <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="lnk font-semibold">
                        {instagramHandle}
                      </a>
                      .
                    </p>
                  )}
                  {facts.whatsapp && (
                    <>
                      <p>Questions about a scent or an order: message us on WhatsApp.{facts.whatsappHours ? ` ${sentence(`We answer ${lowerFirst(facts.whatsappHours)}`)}` : ""}</p>
                      <WhatsAppLink number={facts.whatsapp} text="Hello eternal, I have a question." from="about" className="btn btn-secondary mt-1 w-full sm:w-auto sm:self-start">
                        <Icon name="whatsapp" size={18} /> Message us on WhatsApp
                      </WhatsAppLink>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
          <FinderBand title="Find the one that stays." className="mt-14" />
        </div>
      </div>
    </>
  );
}
