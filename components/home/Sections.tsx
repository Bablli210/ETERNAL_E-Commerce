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
import { lines, moodOrder, moods, type LineKey } from "@/content/taxonomy";
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

/**
 * A compact section head: the title (and one line under it), and one 44 px action.
 * `stacked` puts the action under the title, for a title cell (DESIGN.md §4).
 */
function HomeHead({ title, sub, action, stacked = false, className = "" }: { title: ReactNode; sub?: ReactNode; action?: { label: string; href: string }; stacked?: boolean; className?: string }) {
  return (
    <div className={`flex gap-4 ${stacked ? "flex-col items-start" : "items-end justify-between"} ${className}`}>
      <div className="max-w-[640px]">
        <h2 className="display-l">{title}</h2>
        {sub && <p className="mt-2 text-[15px] leading-snug text-ash lg:mt-4 lg:text-[17px]">{sub}</p>}
      </div>
      {action && (
        <Link href={action.href} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] font-semibold ${stacked ? "" : "-mb-3"}`}>
          <span className="lnk">{action.label}</span>
          <Icon name="arrow-right" size={16} />
        </Link>
      )}
    </div>
  );
}

/** The confirmed reasons to order, one per line. An unconfirmed fact is simply not there; nothing waits in brackets. */
function trustLines(): string[] {
  return [
    `Eau de parfum, ${ml(site.bottleSizeMl)}`,
    facts.paymentMethods.includes("Cash on delivery") && "Cash on delivery",
    facts.deliveryIncluded === true ? "Delivery included" : facts.freeDeliveryOver && `Free delivery over ${facts.freeDeliveryOver}`,
    facts.deliveryTime && `Delivery ${facts.deliveryTime}`,
    facts.returnsPolicy,
    facts.longevityClaim,
  ].filter((v): v is string => Boolean(v));
}

/**
 * The first screen (playbook 3.4), in cells (DESIGN.md §4): the campaign still
 * as an image row that runs to the frame's rules, then two text cells. Left:
 * the scent on screen, one tap away, the headline, the house in one line, the
 * price floor and the two ways in. Right: the confirmed reasons to order.
 * Which still shows is chosen per visit (content/heroes.ts).
 */
export function Hero({ hero, scent, fromPrice, samplePrice }: { hero: HeroDef; scent: ScentIndexEntry | null; fromPrice: Money | null; samplePrice: Money | null }) {
  const words = site.tagline.split(" ");
  // Only figures the catalogue or the owner has confirmed; nothing here is a placeholder.
  const offer = [
    fromPrice && `${ml(site.bottleSizeMl)} from ${formatMoney(fromPrice)}`,
    samplePrice && `${ml(site.sampleSizeMl)} from ${formatMoney(samplePrice)}`,
    facts.freeSamples,
  ].filter(Boolean);
  const trust = trustLines();
  return (
    <ParallaxSection id="hero">
      {/* The image row. On a phone a little taller than wide, and never more than 46 % of a short in-app screen, so the
          headline and both ways in stay on the first screen. */}
      <div className="relative h-[min(calc(100vw*360/390),46svh)] overflow-hidden lg:h-[clamp(360px,min(56.25vw,calc(100svh-150px)),820px)]">
        <div data-hero={hero.handle} className="hero-film absolute inset-0">
          <HeroStill hero={hero} className="absolute inset-0" />
        </div>
      </div>
      <div className="row cells lg:grid-cols-2">
        <div className="cell">
          {scent && (
            <SelectList list="home_hero" items={[listItem(scent)]}>
              <Link href={`/products/${scent.handle}`} data-card={scent.handle} className="inline-flex min-h-11 flex-wrap items-center gap-x-2 text-[13px] tracking-[0.02em] text-ash">
                <span className="font-semibold text-night">{scent.title}</span>
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
                <Icon name="arrow-right" size={14} className="text-night" />
              </Link>
            </SelectList>
          )}
          <h1 className="display-xl mt-1 max-sm:text-[min(44px,11.2vw)] lg:text-[clamp(52px,4.6vw,76px)]">
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
          {/* A short phone (Instagram's browser, small Androids) drops this line so both ways in stay on the first screen. */}
          <p className="mt-3 max-w-[46ch] text-[15px] leading-normal text-ash max-lg:[@media(max-height:760px)]:hidden lg:mt-5 lg:text-[17px]">
            Eaux de parfum from Cairo, in three lines: eterna for her, eterno for him, eternal unisex.
          </p>
          {offer.length > 0 && <p className="tnum mt-2 text-[13px] font-semibold tracking-[0.02em]">{offer.join(" · ")}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 lg:mt-8">
            <Link href="/shop" className="btn">
              Shop the scents
            </Link>
            <Link href="/finder" className="inline-flex min-h-11 items-center text-[13px] font-semibold">
              <span className="lnk">Find yours in 60 seconds</span>
            </Link>
          </div>
        </div>
        {trust.length > 0 && (
          <div id="proof" className="cell cell-text">
            <p className="eyebrow text-[12px] text-ash">Why order from eternal</p>
            <ul aria-label="Why order from eternal" className="border-t border-dune text-[14px] font-medium">
              {trust.map((t) => (
                <li key={t} className="flex min-h-11 items-center border-b border-dune py-2">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ParallaxSection>
  );
}

/**
 * The three lines: their names in cells on the left, one high-noon still in
 * the cell on the right that turns to whichever line is hovered
 * (LineShowcase). On a phone the section carries no visible heading, so the
 * names sit straight under the hero and each is one tap from its line.
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
    tone: lines[k].tone,
  }));
  return (
    <section className="row">
      <h2 className="sr-only lg:hidden">The three lines</h2>
      <LineShowcase items={items} head={<HomeHead title="Three lines" action={{ label: `Shop all ${total}`, href: "/shop" }} stacked />} />
    </section>
  );
}

/** The house's own picks, one from each line first, as a product row: the title cell, then a cell per scent. Not a bestseller list, so no bestseller badges. */
export function WhereToStart({ entries, total }: { entries: ScentIndexEntry[]; total: number }) {
  if (!entries.length) return null;
  return (
    <section className="row">
      <SelectList list="home_where_to_start" items={entries.map(listItem)} className="cells grid-cols-2 lg:grid-cols-5">
        <div className="cell col-span-2 lg:col-span-1">
          <HomeHead title="Where to start" sub="The house’s picks for a first bottle." action={{ label: `See all ${total} scents`, href: "/shop" }} className="lg:flex-col lg:items-start" />
        </div>
        {entries.map((e) => (
          <ProductCard key={e.handle} entry={e} badge={e.isNew ? "New" : false} sizes="(min-width: 1024px) 20vw, 50vw" />
        ))}
      </SelectList>
    </section>
  );
}

/**
 * Two ways to lower the risk of a first order, in cells: the mystery box,
 * added to the bag right here, and the finder. The finder only promises a
 * 5 ml trio when every scent really has a 5 ml to add.
 */
export function TryBeforeYouCommit({ mysteryBox: box, everySampled }: { mysteryBox: ScentIndexEntry | null; everySampled: boolean }) {
  return (
    <section className="row">
      <div className="cells grid-cols-[38%_1fr] lg:grid-cols-[1fr_1fr_1fr_1.2fr]">
        <div className="cell col-span-2 lg:col-span-1">
          <HomeHead title="Try before you commit" stacked />
        </div>
        {box?.bottle && (
          <>
            {/* The picture repeats the "What’s inside" link for a thumb, not for a screen reader or the tab order. It runs to the rules. */}
            <Link href={`/products/${box.handle}`} className="relative block min-h-[160px] overflow-hidden" aria-hidden="true" tabIndex={-1}>
              {box.image ? (
                <Image src={box.image} alt="" fill sizes="(min-width: 1024px) 22vw, 38vw" className="object-cover" />
              ) : (
                <Figure name="mystery-box" label="Mystery box — matte black box with the eternal mark" dark sizes="(min-width: 1024px) 22vw, 38vw" className="absolute inset-0" />
              )}
            </Link>
            <article className="cell cell-text">
              <div>
                <h3 className="display-m">The mystery box</h3>
                <p className="mt-2 text-[14px] leading-snug text-ash lg:text-[15px]">
                  Three {ml(site.sampleSizeMl)} scents chosen by the house, in a matte black box. For the curious, and for gifts.
                </p>
                <Price money={box.price} className="mt-3 block text-[16px] font-semibold" />
              </div>
              <div className="flex flex-col">
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
          </>
        )}
        <article className="watermark cell cell-text relative col-span-2 overflow-hidden bg-night text-linen lg:col-span-1">
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
    </section>
  );
}

/** The six moods as cells beside a title cell, and a last cell for those who would rather see everything. */
export function MoodTiles() {
  return (
    <section className="row">
      <ul className="cells grid-cols-2 lg:grid-cols-4">
        <li className="cell col-span-2 lg:col-span-1">
          <HomeHead title="Shop by mood" sub="For when you know the feeling but not the notes." stacked />
        </li>
        {moodOrder.map((k, i) => {
          const m = moods[k];
          const dark = k === "after-dark";
          return (
            <li key={k} data-reveal style={{ ["--i" as string]: i }}>
              <Link href={`/shop/${k}`} className="group block">
                <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: m.wash }}>
                  <Figure
                    name={`mood-${k}`}
                    label={m.art}
                    dark={dark}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="absolute inset-0"
                    imageClassName="hover-lift"
                    placeholderClassName="slot-corner !border-0 opacity-80"
                    style={{ backgroundColor: m.wash }}
                  />
                  <span className="wash absolute inset-0" style={{ backgroundColor: dark ? "#F3EFE7" : m.wash === "#E9E4D3" ? "#9E9382" : m.wash }} aria-hidden="true" />
                </div>
                <span className="flex min-h-12 items-center justify-between gap-2 border-t border-dune px-[var(--cell-pad)] py-3">
                  <span className="u-draw serif text-[19px] leading-tight lg:text-[26px]">{m.label}</span>
                  <Icon name="arrow-right" size={16} className="shrink-0" />
                </span>
              </Link>
            </li>
          );
        })}
        <li className="cell cell-text col-span-2 lg:col-span-1">
          <p className="display-m">Or every scent at once.</p>
          <Link href="/shop" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-semibold">
            <span className="lnk">Shop all scents</span>
            <Icon name="arrow-right" size={16} />
          </Link>
        </li>
      </ul>
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

/** Only for a scent whose tale is published: an unwritten tale never reaches the home page. A still cell beside a text cell. */
export function FeaturedTale({ scent }: { scent: Scent | null }) {
  const tale = scent?.taleSlug ? tales.find((t) => t.slug === scent.taleSlug) : null;
  if (!scent || !tale) return null;
  // H5: the excerpt's sentences fade in one after another, the signature line last.
  const sentences = excerptOf(scent.story?.[0] ?? tale.paragraphs[0]);
  const bg = scent.world.dark ? scent.world.bg : "#163a4e";
  return (
    <section className="row">
      <div className="cells lg:grid-cols-2">
        <Figure
          name={[`tale-${tale.slug}-card`, "tale-featured", `tale-${tale.slug}`]}
          label={`${scent.title} in its tale — the bottle in the scene, 4:3`}
          dark
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/3] w-full lg:aspect-auto lg:min-h-[520px]"
          data-reveal
        />
        <div className="grain watermark cell relative overflow-hidden text-linen" style={{ backgroundColor: bg, ["--stagger" as string]: "80ms" }}>
          {scent.line && (
            <p className="text-[13px] tracking-[0.02em] text-dune" data-reveal>
              A tale from {lines[scent.line].label}, {FOR[scent.line]}
            </p>
          )}
          <h2 className="display-l mt-3" data-reveal style={{ ["--i" as string]: 1 }}>
            {tale.title}
          </h2>
          {sentences.length > 0 && (
            <p className="mt-5 max-w-[56ch] text-[16px] leading-relaxed text-dune lg:text-[17px]">
              {sentences.map((line, i) => (
                <span key={i} className="inline" data-reveal style={{ ["--i" as string]: i + 2 }}>
                  {line}
                </span>
              ))}
            </p>
          )}
          {scent.signature && (
            <p className="signature mt-5 text-linen" data-reveal style={{ ["--i" as string]: sentences.length + 2 }}>
              “{scent.signature}”
            </p>
          )}
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-linen/20 pt-5 text-[14px] lg:grid-cols-3" data-reveal style={{ ["--i" as string]: sentences.length + 3 }}>
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
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-1" data-reveal style={{ ["--i" as string]: sentences.length + 4 }}>
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

/** The house film loads only on tap; ad landings drop it (ad-drop, see home.css). A film cell beside a text cell. */
export function HouseFilm() {
  // Where the bottles are filled is the owner's to confirm (playbook 4.7); until then the line leaves it out.
  const origin = confirmed(site.origin);
  return (
    <section className="ad-drop row">
      <div className="cells lg:grid-cols-[1.3fr_1fr]">
        <HouseFilmPlayer
          sources={siteVideo("house-film")}
          className="relative block aspect-video w-full overflow-hidden lg:aspect-auto lg:min-h-[420px]"
          poster={<Figure name="house-film-poster" label="The house film — brand explainer, 1:30, poster frame" dark sizes="(min-width: 1024px) 60vw, 100vw" className="kenburns absolute inset-0" placeholderClassName="slot-corner !border-0" />}
        />
        <div className="grain cell flex flex-col justify-center bg-night text-linen" data-reveal>
          <Eyebrow className="text-[12px] !text-dune">The house</Eyebrow>
          <h2 className="display-l mt-3">Composed to be remembered.</h2>
          <p className="mt-5 max-w-[50ch] text-[16px] leading-relaxed text-dune lg:text-[17px]">
            We start from the fragrances people already love and compose our own reading of each one, {origin ? `${lowerFirst(origin)} and ` : ""}told through a tale. Inspired by, never imitated.
          </p>
          <Link href="/house" className="btn btn-outline-light mt-7 self-start">
            Our story
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Published tales other than the featured one, as cells beside a title cell; nothing at all while none is written. Ad landings drop it. */
export function TalesTeaser({ exclude }: { exclude: string | null }) {
  const picks = tales.filter((t) => t.slug !== exclude).slice(0, 3);
  if (!picks.length) return null;
  return (
    <section className="ad-drop row">
      <ul className="cells md:grid-cols-2 lg:grid-cols-4">
        <li className="cell md:col-span-2 lg:col-span-1">
          <HomeHead title="Tales" action={{ label: "All tales", href: "/tales" }} className="lg:flex-col lg:items-start" />
        </li>
        {picks.map((t, i) => (
          <li key={t.slug} data-reveal style={{ ["--i" as string]: i }}>
            <Link href={`/tales/${t.slug}`} className="group flex h-full flex-col">
              <Figure name={[`tale-${t.slug}-card`, `tale-${t.slug}`]} label={t.heroArt} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className="t3-img aspect-[4/3] w-full" />
              <span className="cell flex flex-1 flex-col border-t border-dune">
                <span className="text-[13px] tracking-[0.02em] text-ash">
                  {lines[t.line].label}, {FOR[t.line]}
                </span>
                <span className="serif mt-1 text-[24px] leading-[1.15] group-hover:text-sea">{t.signature}</span>
                <span className="mt-auto inline-flex min-h-11 items-center self-start pt-3 text-[13px] font-semibold">
                  <span className="lnk">Read the tale</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
