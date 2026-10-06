import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/product/ProductCard";
import { AddToBagButton } from "@/components/cart/AddToBagButton";
import { site } from "@/content/site";
import { confirmed, facts } from "@/lib/facts";
import { families, familyOrder, lines, type FamilyKey, type LineKey } from "@/content/taxonomy";
import { tales } from "@/content/tales";
import type { Scent, ScentIndexEntry } from "@/lib/catalogue";
import type { Money } from "@/lib/shopify/types";
import { formatMoney, joinNotes, sentenceCase } from "@/lib/format";
import { siteVideo } from "@/lib/site-videos";
import { ParallaxSection } from "@/components/motion/Parallax";
import { HouseFilmPlayer } from "./HouseFilmPlayer";
import { HeroStill } from "./HeroStill";
import type { Hero as HeroDef } from "@/content/heroes";
import { SelectList, type ListItem } from "./SelectList";
import { LineShowcase, type LineShowcaseItem } from "./LineShowcase";
import { siteImage } from "@/lib/site-images";

const LINE_ORDER: LineKey[] = ["eterna", "eterno", "eternal"];

/** The three line names differ by one letter, so the audience always travels with them. */
const FOR: Record<LineKey, string> = { eterna: "for her", eterno: "for him", eternal: "unisex" };

/** "55 ml" that never breaks between the number and the unit. */
const ml = (n: number) => `${n} ml`;

const listItem = (e: ScentIndexEntry): ListItem => ({
  handle: e.handle,
  item: { productId: e.productId, variantId: e.bottle?.numericId ?? e.productId, name: e.title, price: parseFloat(e.price.amount), variant: e.bottle?.label, category: e.lineLabel },
});

/** A compact section head: the title (and one line under it) on the left, one 44 px action on the right. */
function HomeHead({ title, sub, action, className = "" }: { title: ReactNode; sub?: ReactNode; action?: { label: string; href: string }; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="max-w-[640px]">
        <h2 className="display-l">{title}</h2>
        {sub && <p className="mt-2 text-[15px] leading-snug text-ash lg:mt-4 lg:text-[17px]">{sub}</p>}
      </div>
      {action && (
        <Link href={action.href} className="-mb-3 inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] font-semibold">
          <span className="lnk">{action.label}</span>
          <Icon name="arrow-right" size={16} />
        </Link>
      )}
    </div>
  );
}

/**
 * The first screen (playbook 3.4): one campaign still, its scent named and
 * one tap away, the house in one line, the price floor, one primary action
 * and the finder as a quiet second. Which still shows is chosen per visit
 * (content/heroes.ts). On a phone the still sits above the copy, so the
 * bottle is never under the headline.
 */
export function Hero({ hero, scent, fromPrice, samplePrice }: { hero: HeroDef; scent: ScentIndexEntry | null; fromPrice: Money | null; samplePrice: Money | null }) {
  const words = site.tagline.split(" ");
  const bg = hero.bg;
  // Only figures the catalogue or the owner has confirmed; nothing here is a placeholder.
  const offer = [
    fromPrice && `${ml(site.bottleSizeMl)} from ${formatMoney(fromPrice)}`,
    samplePrice && `${ml(site.sampleSizeMl)} from ${formatMoney(samplePrice)}`,
    facts.freeSamples,
  ].filter(Boolean);
  // Phone: the hero and the proof marquee under it (48 px and its hairline) fill the first screen exactly; nothing of the next section shows.
  return (
    <ParallaxSection id="hero" className="grain relative grid min-h-[calc(100svh-49px)] grid-rows-[1fr_auto] overflow-hidden text-linen lg:min-h-[92svh]" style={{ backgroundColor: bg }}>
      {/* Phone: the still's box hangs off the section, not off the copy's grid row, so it keeps its size while the fonts
          arrive and the copy reflows. */}
      <div data-hero={hero.handle} className="hero-film max-lg:absolute max-lg:inset-x-0 max-lg:top-0 max-lg:h-[66%] lg:relative lg:col-start-1 lg:row-start-1 lg:row-end-3">
        <HeroStill hero={hero} className="absolute inset-0" />
        {/* Phone: the still fades into the band the copy sits on. Desktop: the copy sits on the still. */}
        <div aria-hidden="true" className="absolute inset-0 lg:hidden" style={{ backgroundImage: `linear-gradient(to top, ${bg} 6%, transparent 42%), linear-gradient(to bottom, rgba(23, 22, 20, 0.45), transparent 22%)` }} />
        {/* Desktop: every still keeps its bottle right of centre, so the copy holds the left half on a shade of its own. */}
        <div aria-hidden="true" className="absolute inset-0 hidden lg:block" style={{ backgroundImage: "linear-gradient(to right, rgba(23, 22, 20, 0.78) 0%, rgba(23, 22, 20, 0.5) 30%, transparent 52%), linear-gradient(to bottom, rgba(23, 22, 20, 0.35), transparent 20%)" }} />
      </div>
      <div className="wrap relative col-start-1 row-start-2 pb-6 lg:pb-24">
        <div className="hero-drift max-w-[820px] lg:max-w-[min(540px,40vw)]">
          {scent && (
            <SelectList list="home_hero" items={[listItem(scent)]}>
              <Link href={`/products/${scent.handle}`} data-card={scent.handle} className="inline-flex min-h-11 items-center gap-x-2 text-[13px] tracking-[0.02em] text-dune">
                <span className="font-semibold text-linen">{scent.title}</span>
                {scent.line && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {lines[scent.line].label}, {FOR[scent.line]}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="tnum whitespace-nowrap">{formatMoney(scent.price)}</span>
                <Icon name="arrow-right" size={14} className="text-linen" />
              </Link>
            </SelectList>
          )}
          <h1 className="display-xl mt-1 max-sm:text-[min(44px,11.2vw)] lg:text-[clamp(56px,5.2vw,84px)]">
            {/* The space sits between the spans, not inside them: a non-breaking space
                kept the headline on one unbreakable line whenever the words were plain
                inline (reduced motion), so it overflowed instead of wrapping. */}
            {words.map((w, i) => (
              <Fragment key={i}>
                <span className="hero-word" style={{ ["--i" as string]: i }}>
                  {w}
                </span>
                {i < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>
          {/* A short phone (Instagram's browser, small Androids) drops this line so the bottle stays clear of the copy. */}
          <p className="mt-3 max-w-[46ch] text-[15px] leading-normal text-dune max-lg:[@media(max-height:760px)]:hidden lg:mt-6 lg:text-[17px]">
            eaux de parfum from Cairo, in three lines: eterna for her, eterno for him, eternal unisex.
          </p>
          {offer.length > 0 && <p className="tnum mt-2 text-[13px] font-semibold tracking-[0.02em] text-linen">{offer.join(" · ")}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 lg:mt-8">
            <Link href="/shop" className="btn btn-light">
              Shop the scents
            </Link>
            <Link href="/finder" className="inline-flex min-h-11 items-center text-[13px] font-semibold">
              <span className="lnk">Find yours in 60 seconds</span>
            </Link>
          </div>
        </div>
        <a href="#proof" className="absolute bottom-8 right-5 hidden items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-dune lg:right-20 lg:flex">
          Scroll <Icon name="chevron-down" size={14} />
        </a>
      </div>
    </ParallaxSection>
  );
}

/**
 * The confirmed facts as a marquee along the foot of the first screen. Each
 * unconfirmed fact simply is not there; nothing waits in brackets. The row is
 * written twice and slides by one copy's width, so the loop has no seam; the
 * copy is hidden from screen readers. It stands still for reduced motion
 * (then it scrolls by hand) and on desktop, where the one row fits.
 */
export function ProofStrip() {
  const items = [
    `Eau de parfum, ${ml(site.bottleSizeMl)}`,
    facts.paymentMethods.includes("Cash on delivery") && "Cash on delivery",
    facts.deliveryIncluded === true ? "Delivery included" : facts.freeDeliveryOver && `Free delivery over ${facts.freeDeliveryOver}`,
    facts.deliveryTime && `Delivery ${facts.deliveryTime}`,
    facts.returnsPolicy,
    facts.longevityClaim,
  ].filter((v): v is string => Boolean(v));
  const row = (copy: boolean) => (
    <ul className="proof-set flex shrink-0 items-center" aria-hidden={copy || undefined}>
      {items.map((f) => (
        <li key={f} className="flex h-12 items-center whitespace-nowrap">
          {f}
          <span aria-hidden="true" className="proof-dot px-4 text-stone">
            ·
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <section id="proof" aria-label="Why order from eternal" className="proof no-scrollbar overflow-hidden border-b border-dune bg-paper text-[13px] font-medium">
      <div className="proof-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

/**
 * The three lines: their names on the left, one high-noon still on the right
 * that turns to whichever line is hovered (LineShowcase). On a phone the
 * section carries no visible heading, so the names sit straight under the
 * proof marquee and each is one tap from its line.
 */
export function LineTiles({ counts, total }: { counts: Record<LineKey, number>; total: number }) {
  const items: LineShowcaseItem[] = LINE_ORDER.map((k) => ({
    key: k,
    label: lines[k].label,
    audience: sentenceCase(FOR[k]),
    count: counts[k],
    blurb: lines[k].blurb,
    href: `/shop/${lines[k].slug}`,
    src: siteImage(`line-${k}`),
    // The line's own logotype (public/images/logo-<line>.svg or .png); the name is set in type until it exists.
    logo: siteImage(`logo-${k}`),
    tone: lines[k].tone,
  }));
  return (
    <section className="py-8 lg:py-24">
      <div className="wrap">
        <h2 className="sr-only lg:hidden">The three lines</h2>
        <HomeHead title="Three lines" action={{ label: `Shop all ${total}`, href: "/shop" }} className="max-lg:hidden" />
        <div className="lg:mt-12">
          <LineShowcase items={items} />
        </div>
      </div>
    </section>
  );
}

/** The house's own picks, one from each line first. Not a bestseller list, so no bestseller badges. */
export function WhereToStart({ entries, total }: { entries: ScentIndexEntry[]; total: number }) {
  if (!entries.length) return null;
  return (
    <section className="border-t border-dune pb-10 pt-7 lg:py-24">
      <div className="wrap">
        <HomeHead title="Where to start" sub="The house’s picks for a first bottle." />
        <SelectList list="home_where_to_start" items={entries.map(listItem)} className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 lg:mt-12 lg:grid-cols-4 lg:gap-x-6">
          {entries.map((e) => {
            // The scent among its notes leads; the bottle comes in on hover.
            const notes = siteImage(`products/${e.handle}-3`);
            const card = notes && notes !== e.image ? { ...e, image: notes, hoverImage: e.image } : e;
            return <ProductCard key={e.handle} entry={card} badge={e.isNew ? "New" : false} />;
          })}
        </SelectList>
        <Link href="/shop" className="btn btn-secondary btn-block mt-8 lg:mt-12 lg:w-auto">
          See all {total} scents
        </Link>
      </div>
    </section>
  );
}

/**
 * Two ways to lower the risk of a first order: the mystery box, added to the
 * bag right here, and the finder. The finder only promises a 5 ml trio when
 * every scent really has a 5 ml to add.
 */
export function TryBeforeYouCommit({ mysteryBox: box, everySampled }: { mysteryBox: ScentIndexEntry | null; everySampled: boolean }) {
  return (
    <section className="border-t border-dune bg-sand/40 py-10 lg:py-24">
      <div className="wrap">
        <HomeHead title="Try before you commit" />
        <div className="mt-6 grid gap-4 lg:mt-12 lg:grid-cols-2 lg:gap-6">
          {box?.bottle && (
            <article className="grid grid-cols-[38%_1fr] gap-x-4 bg-paper p-3 lg:grid-cols-[42%_1fr] lg:gap-x-8 lg:p-6">
              {/* The picture repeats the "What’s inside" link for a thumb, not for a screen reader or the tab order. */}
              <Link href={`/products/${box.handle}`} className="relative block aspect-square overflow-hidden" style={box.image ? undefined : { backgroundColor: box.world.bg }} aria-hidden="true" tabIndex={-1}>
                {box.image ? (
                  <Image src={box.image} alt="" fill sizes="(min-width: 1024px) 20vw, 38vw" className="object-cover" />
                ) : (
                  <Figure name="mystery-box" label="Mystery box — matte black box with the eternal mark" dark sizes="(min-width: 1024px) 20vw, 38vw" className="absolute inset-0" />
                )}
              </Link>
              <div className="flex flex-col py-1">
                <h3 className="display-m">The mystery box</h3>
                <p className="mt-2 text-[14px] leading-snug text-ash lg:text-[15px]">
                  Three {ml(site.sampleSizeMl)} scents chosen by the house, in a matte black box. For the curious, and for gifts.
                </p>
                <Price money={box.price} className="mt-auto pt-3 text-[16px] font-semibold" />
              </div>
              <div className="col-span-2 mt-3 flex flex-col lg:mt-6">
                <AddToBagButton
                  source="home"
                  variant={box.bottle}
                  product={{ productId: box.productId, handle: box.handle, title: box.title, image: box.image, lineLabel: box.lineLabel, world: box.world }}
                  kind="set"
                  block
                  label={`Add the mystery box · ${formatMoney(box.price)}`}
                />
                <Link href={`/products/${box.handle}`} className="mt-1 inline-flex min-h-11 items-center justify-center text-[13px] font-semibold">
                  <span className="lnk">What’s inside</span>
                </Link>
              </div>
            </article>
          )}
          <article className="watermark relative flex flex-col justify-between gap-6 overflow-hidden bg-night p-6 text-linen lg:p-10">
            <div className="relative">
              <h3 className="display-m">Not sure which is yours?</h3>
              <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-dune">
                Five quick questions, and the finder matches you to three scents from across the house
                {everySampled ? `, then lets you try all three as ${ml(site.sampleSizeMl)} before you choose a bottle.` : "."}
              </p>
            </div>
            <Link href="/finder" className="btn btn-light relative self-start">
              Find yours in 60 seconds
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

/**
 * Shop by scent: the six families, each with an ingredient still. A
 * family-<key> image wins once it exists; until then each borrows the closest
 * ingredient still the house has (woody, which has none, the notes still of a
 * woody scent).
 */
const FAMILY_STILL: Record<FamilyKey, string[]> = {
  fresh: ["family-fresh", "mood-golden-hour"],
  woody: ["family-woody", "products/raw-seduction-3"],
  "amber-spice": ["family-amber-spice", "mood-after-dark"],
  floral: ["family-floral", "mood-wild-garden"],
  gourmand: ["family-gourmand", "mood-warm-skin"],
  aquatic: ["family-aquatic", "mood-sea-air"],
};

export function ScentTiles() {
  return (
    <section className="py-10 lg:py-24">
      <div className="wrap">
        <HomeHead title="Shop by scent" sub="Start from the notes you already love." />
        <ul className="mt-6 grid grid-cols-3 gap-x-2 gap-y-5 lg:mt-12 lg:gap-x-6 lg:gap-y-10">
          {familyOrder.map((k) => {
            const f = families[k];
            return (
              <li key={k}>
                <Link href={`/shop/${k}`} className="group block">
                  <div className="relative aspect-square overflow-hidden lg:aspect-[4/3]" style={{ backgroundColor: f.world.bg }}>
                    <Figure
                      name={FAMILY_STILL[k]}
                      label={`${f.label} — ingredient still`}
                      sizes="33vw"
                      className="absolute inset-0"
                      imageClassName="hover-lift"
                      placeholderClassName="slot-corner !border-0 opacity-80"
                      style={{ backgroundColor: f.world.bg }}
                    />
                  </div>
                  <span className="u-draw serif mt-2 inline-block text-[19px] leading-tight lg:mt-3 lg:text-[28px]">{f.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** The opening of the first sentences of a tale, up to about `max` characters, cut at a sentence. */
function excerptOf(text: string, max = 240): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+["’”]?\s*|[^.!?…]+$/g) ?? [text];
  const out: string[] = [];
  let length = 0;
  for (const s of sentences) {
    if (out.length && length + s.length > max) break;
    out.push(s);
    length += s.length;
  }
  return out;
}

/** Only for a scent whose tale is published: an unwritten tale never reaches the home page. */
export function FeaturedTale({ scent }: { scent: Scent | null }) {
  const tale = scent?.taleSlug ? tales.find((t) => t.slug === scent.taleSlug) : null;
  if (!scent || !tale) return null;
  const sentences = excerptOf(scent.story?.[0] ?? tale.paragraphs[0]);
  const bg = scent.world.dark ? scent.world.bg : "#163a4e";
  return (
    <section className="grain watermark relative overflow-hidden text-linen" style={{ backgroundColor: bg }}>
      {/* Desktop: the still fills its half of the row, so it starts at the text's first line and ends at its last. Nothing fades in. */}
      <div className="wrap relative grid gap-8 py-12 lg:grid-cols-2 lg:gap-12 lg:py-24">
        <Figure
          name={[`tale-${tale.slug}-card`, "tale-featured", `tale-${tale.slug}`]}
          label={`${scent.title} in its tale — the bottle in the scene, 4:3`}
          dark
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/3] w-full lg:aspect-auto lg:h-full"
          style={{ backgroundColor: bg }}
        />
        <div>
          {scent.line && (
            <p className="text-[13px] tracking-[0.02em] text-dune">
              A tale from {lines[scent.line].label}, {FOR[scent.line]}
            </p>
          )}
          <h2 className="display-l mt-3">
            {tale.title}
          </h2>
          {sentences.length > 0 && (
            <p className="mt-5 max-w-[56ch] text-[16px] leading-relaxed text-dune lg:text-[17px]">
              {sentences.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </p>
          )}
          {scent.signature && (
            <p className="signature mt-5 text-linen">
              “{scent.signature}”
            </p>
          )}
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-linen/20 pt-5 text-[14px] lg:grid-cols-3">
            <div className="max-lg:hidden">
              <dt className="eyebrow text-[12px] text-dune">The scent</dt>
              <dd className="mt-1">{scent.title}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[12px] text-dune">Notes</dt>
              <dd className="mt-1">{joinNotes(scent.notesShort)}</dd>
            </div>
            {scent.inspiredBy && (
              <div>
                <dt className="eyebrow text-[12px] text-dune">Inspired by</dt>
                <dd className="mt-1">{scent.inspiredBy}</dd>
              </div>
            )}
          </dl>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-1">
            <Link href={`/products/${scent.handle}`} className="btn btn-light">
              Shop {scent.title} · {formatMoney(scent.price)}
            </Link>
            <Link href={`/tales/${tale.slug}`} className="inline-flex min-h-11 items-center text-[13px] font-semibold">
              <span className="lnk">Read the tale</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Made in Egypt" as it reads mid-sentence. */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The house film loads only on tap; ad landings drop it (ad-drop, see home.css). */
export function HouseFilm() {
  // Where the bottles are filled is the owner's to confirm (playbook 4.7); until then the line leaves it out.
  const origin = confirmed(site.origin);
  return (
    <section className="ad-drop grain bg-night text-linen">
      <div className="wrap grid gap-8 py-12 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-12 lg:py-24">
        <HouseFilmPlayer
          sources={siteVideo("house-film")}
          className="relative block aspect-video w-full overflow-hidden"
          poster={<Figure name="house-film-poster" label="The house film — brand explainer, 1:30, poster frame" dark sizes="(min-width: 1024px) 60vw, 100vw" className="kenburns absolute inset-0" placeholderClassName="slot-corner !border-0" />}
        />
        <div data-reveal>
          <Eyebrow className="text-[12px] !text-dune">The house</Eyebrow>
          <h2 className="display-l mt-3">Composed to be remembered.</h2>
          <p className="mt-5 max-w-[50ch] text-[16px] leading-relaxed text-dune lg:text-[17px]">
            We start from the fragrances people already love and compose our own reading of each one, {origin ? `${lowerFirst(origin)} and ` : ""}told through a tale. Inspired by, never imitated.
          </p>
          <Link href="/tales" className="btn btn-outline-light mt-7">
            Read the tales
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Published tales other than the featured one; nothing at all while none is written. Ad landings drop it. */
export function TalesTeaser({ exclude }: { exclude: string | null }) {
  const picks = tales.filter((t) => t.slug !== exclude).slice(0, 3);
  if (!picks.length) return null;
  return (
    <section className="ad-drop py-10 lg:py-24">
      <div className="wrap">
        <HomeHead title="Tales" action={{ label: "All tales", href: "/tales" }} />
        <ul className="mt-6 grid gap-8 md:grid-cols-3 lg:mt-12">
          {picks.map((t) => (
            <li key={t.slug}>
              <Link href={`/tales/${t.slug}`} className="group flex flex-col">
                <Figure name={[`tale-${t.slug}-card`, `tale-${t.slug}`]} label={t.heroArt} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[4/3] w-full" />
                <span className="mt-4 text-[13px] tracking-[0.02em] text-ash">
                  {lines[t.line].label}, {FOR[t.line]}
                </span>
                <p className="serif mt-1 text-[26px] leading-[1.15] group-hover:text-sea">{t.signature}</p>
                <span className="mt-3 inline-flex min-h-11 items-center self-start text-[13px] font-semibold">
                  <span className="lnk">Read the tale</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
