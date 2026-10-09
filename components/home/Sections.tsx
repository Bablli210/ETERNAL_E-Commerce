import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { Figure } from "@/components/ui/Figure";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/product/ProductCard";
import { site } from "@/content/site";
import { confirmed, facts } from "@/lib/facts";
import { families, familyOrder, familyStills, lines, ORIGINALS_DESCRIPTOR, type LineKey } from "@/content/taxonomy";
import { occasionOrder, occasions, type OccasionKey } from "@/content/occasions";
import { tales } from "@/content/tales";
import type { Scent, ScentIndexEntry } from "@/lib/catalogue";
import type { Money } from "@/lib/shopify/types";
import { formatMoney, joinNotes, sentenceCase } from "@/lib/format";
import { siteVideo } from "@/lib/site-videos";
import { ParallaxSection } from "@/components/motion/Parallax";
import { HouseFilmPlayer } from "./HouseFilmPlayer";
import { HeroFilm, HeroStill } from "./HeroStill";
import type { Hero as HeroDef } from "@/content/heroes";
import { SelectList, type ListItem } from "./SelectList";
import { LineShowcase, type LineShowcaseItem } from "./LineShowcase";
import { siteImage } from "@/lib/site-images";
import { InspiredBy } from "@/components/product/InspiredBy";
import { LineLabel } from "@/components/product/LineLabel";

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
function HomeHead({ title, sub, action, aside, className = "" }: { title: ReactNode; sub?: ReactNode; action?: { label: string; href: string }; aside?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className={aside ? "min-w-0 flex-1" : "max-w-[640px]"}>
        {/* `aside` (a button) sits at the end of the title's own line. */}
        {aside ? (
          <div className="flex items-center justify-between gap-6">
            <h2 className="display-l">{title}</h2>
            {aside}
          </div>
        ) : (
          <h2 className="display-l">{title}</h2>
        )}
        {sub && <p className="mt-2 max-w-[640px] text-[15px] leading-snug text-ash lg:mt-4 lg:text-[17px]">{sub}</p>}
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
 * The first screen (playbook 3.4): the hero film or a campaign still, its
 * scent named and one tap away, the house in one line, the price floor, one
 * primary action and the finder as a quiet second. Which one shows is chosen
 * per visit (content/heroes.ts). On a phone the picture sits above the copy,
 * so the bottle is never under the headline.
 */
export function Hero({ hero, scent, fromPrice, samplePrice }: { hero: HeroDef; scent: ScentIndexEntry | null; fromPrice: Money | null; samplePrice: Money | null }) {
  // The headline keeps the tagline's three lines; its size (below) lets the longest fit the column.
  const lines = site.taglineLines.map((l) => l.split(" "));
  const bg = hero.bg;
  // Every shade is Night, neutral, so it darkens the picture without tinting it (the film's band is Night too).
  const shade = "23, 22, 20";
  // Desktop. A still keeps its bottle right of centre, so the copy holds the left half on a shade of its own. The film
  // fills the hero too, set 12% right (HeroFilm) so Divina stands right of centre, and shows untouched, at the owner's
  // request: no shade over it, so the copy (and the header over it) carry a soft text shadow instead.
  // The bottle's left edge sits at about 43.7% of the screen (39% of the film, set 12% wider); the copy stops 32 px short.
  const desktopShade = hero.film ? null : `linear-gradient(to right, rgba(${shade}, 0.78) 0%, rgba(${shade}, 0.5) 30%, transparent 52%), linear-gradient(to bottom, rgba(${shade}, 0.35), transparent 20%)`;
  // Over the film the softer Dune would not read at all; Linen, with the shadow, as well as the film allows.
  const soft = hero.film ? "text-dune lg:text-linen" : "text-dune";
  // Below lg the picture fades into the band. On a phone, or any landscape screen, the film's sky and cloud are bright
  // to its foot and the copy starts high, so it fades in sooner, keeping the scent's name and its original at 4.5:1; a
  // portrait tablet's box keeps the bottle's label above the light fade, and its copy clear of the film.
  const filmPhoneFade = `linear-gradient(to top, ${bg} 24%, rgba(${shade}, 0.9) 34%, rgba(${shade}, 0.5) 46%, transparent 62%)`;
  const topShade = `linear-gradient(to bottom, rgba(${shade}, 0.45), transparent 22%)`;
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
        {hero.film ? <HeroFilm hero={hero} film={hero.film} /> : <HeroStill hero={hero} className="absolute inset-0" />}
        {/* Below lg the picture fades into the band the copy sits on. Desktop: a still's shade (desktopShade); the film has none. */}
        <div aria-hidden="true" className={`absolute inset-0 lg:hidden ${hero.film ? "hidden sm:portrait:block" : ""}`} style={{ backgroundImage: `linear-gradient(to top, ${bg} 6%, transparent 42%), ${topShade}` }} />
        {hero.film && <div aria-hidden="true" className="absolute inset-0 sm:portrait:hidden lg:hidden" style={{ backgroundImage: `${filmPhoneFade}, ${topShade}` }} />}
        {desktopShade && <div aria-hidden="true" className="absolute inset-0 hidden lg:block" style={{ backgroundImage: desktopShade }} />}
      </div>
      {/* On a short desktop screen the copy is taller than the hero: it keeps clear of the header and the hero grows. */}
      <div className={`wrap relative col-start-1 row-start-2 pb-6 max-lg:isolate lg:mt-[calc(var(--header-h)+var(--announce-h)+16px)] lg:pb-24 ${hero.film ? "lg:[text-shadow:0_1px_3px_rgba(23,22,20,0.8),0_0_16px_rgba(23,22,20,0.65),0_0_40px_rgba(23,22,20,0.5)] lg:[&_.btn]:[text-shadow:none]" : ""}`}>
        {/* Below lg the copy sits at the picture's foot and grows with the three-line headline, so the picture's own
            fade cannot know where it starts: this shade rises with the copy and puts its first line on the band. */}
        <div aria-hidden="true" className="absolute inset-x-0 -top-28 bottom-0 -z-10 lg:hidden" style={{ backgroundImage: `linear-gradient(to bottom, transparent, color-mix(in srgb, ${bg} 85%, transparent) 64px, ${bg} 112px)` }} />
        {/* Over the film the copy ends 32 px short of Divina's bottle, at 43.7% of the screen. */}
        <div className={`max-w-[820px] ${hero.film ? "lg:max-w-[min(520px,32vw,calc(43.7vw_-_32px_-_max(80px,50vw_-_640px)))]" : "lg:max-w-[min(540px,40vw)]"}`}>
          {scent && (
            <SelectList list="home_hero" items={[listItem(scent)]}>
              <Link href={`/products/${scent.handle}`} data-card={scent.handle} className={`inline-flex min-h-11 items-center gap-x-2 text-[13px] tracking-[0.02em] ${soft}`}>
                <span className="font-semibold text-linen">{scent.title}</span>
                {scent.line && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      <LineLabel line={scent.line} sep=", " />
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="tnum whitespace-nowrap">{formatMoney(scent.price)}</span>
                <Icon name="arrow-right" size={14} className="text-linen" />
              </Link>
              {scent.inspiredBy && (
                <InspiredBy name={scent.inspiredBy} className={`mb-3 mt-2 border-t border-linen/25 pt-3 text-[13px] leading-snug tracking-[0.02em] ${soft} max-lg:[@media(max-height:760px)]:mb-2 max-lg:[@media(max-height:760px)]:mt-1 max-lg:[@media(max-height:760px)]:pt-2 lg:mb-4 lg:mt-3`} tone="text-linen" nameClassName="mt-0.5 text-[17px]" />
              )}
            </SelectList>
          )}
          {/* Three lines: "Some things are" is the longest, about 7.1 em, so on a wide screen the size follows the
              copy column (its width, as set just above) to keep it on one line. */}
          <h1 className={`display-xl mt-1 max-sm:text-[min(44px,11.2vw)] max-lg:[@media(max-height:760px)]:text-[min(36px,9.6vw)] ${hero.film ? "lg:text-[min(84px,calc(min(520px,32vw,43.7vw_-_32px_-_max(80px,50vw_-_640px))/7.3))]" : "lg:text-[min(84px,calc(min(540px,40vw)/7.3))]"}`}>
            {/* The space sits between the spans, not inside them: a non-breaking space
                kept the headline on one unbreakable line whenever the words were plain
                inline (reduced motion), so it overflowed instead of wrapping. */}
            {lines.map((line, l) => (
              <Fragment key={l}>
                {l > 0 && <br />}
                {line.map((w, i) => {
                  const n = lines.slice(0, l).reduce((sum, ws) => sum + ws.length, 0) + i;
                  return (
                    <Fragment key={i}>
                      <span className="hero-word" style={{ ["--i" as string]: n }}>
                        {w}
                      </span>
                      {i < line.length - 1 ? " " : null}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </h1>
          {/* A short phone (Instagram's browser, small Androids) drops this line so the bottle stays clear of the copy. */}
          <p className={`mt-3 max-w-[46ch] text-[15px] leading-normal ${soft} max-lg:[@media(max-height:760px)]:hidden lg:mt-6 lg:text-[17px]`}>
            eau de parfum from Cairo, in three lines: eterna for her, eterno for him, eternal unisex.
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
        <a href="#proof" className={`absolute bottom-8 right-5 hidden items-center gap-2 text-[11px] uppercase tracking-[0.14em] lg:right-20 lg:flex ${hero.film ? "rounded-full bg-night/70 px-3 py-1.5 text-linen" : "text-dune"}`}>
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
    <section className="pb-10 pt-7 lg:py-24">
      <div className="wrap">
        {/* On a wide screen the way to every scent sits on the title's line; on a phone it follows the cards. */}
        <HomeHead
          title="Where to start"
          sub="The house’s picks for a first bottle."
          aside={
            <Link href="/shop" className="btn btn-secondary shrink-0 max-lg:hidden">
              See all {total} scents
            </Link>
          }
        />
        <SelectList list="home_where_to_start" items={entries.map(listItem)} className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 lg:mt-12 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
          {entries.map((e) => {
            // The scent among its notes leads; the bottle comes in on hover.
            const notes = siteImage(`products/${e.handle}-3`);
            const card = notes && notes !== e.image ? { ...e, image: notes, hoverImage: e.image } : e;
            return <ProductCard key={e.handle} entry={card} badge={e.isOriginal ? "Eternal Original" : e.isNew ? "New" : false} />;
          })}
        </SelectList>
        <Link href="/shop" className="btn btn-secondary btn-block mt-8 lg:hidden">
          See all {total} scents
        </Link>
      </div>
    </section>
  );
}

/**
 * The Eternal Originals: the five scents the house composed with no original
 * behind them, on a band of their own so they stand apart from the rest of
 * the page: the originals on driftwood (originals-band), or Night without it.
 * Each card is a linen panel with its picture to the edges; on a phone the
 * first leads full width and the other four follow two by two.
 */
export function EternalOriginals({ entries }: { entries: ScentIndexEntry[] }) {
  if (!entries.length) return null;
  const photo = siteImage("originals-band");
  return (
    <section aria-labelledby="originals-title" className={`relative overflow-hidden bg-night py-12 text-linen lg:py-28 ${photo ? "" : "watermark grain"}`}>
      {photo && (
        <>
          {/* On a phone the band is far taller than the photograph, so the photograph covers it. From lg it shows whole
              (7:3, full width up to 2100 px, about the band's height) at the band's foot, and above it the wall goes on:
              the photograph's top edge drawn out to the band's top and softened, so no part of it is cropped away. Wider
              than 2100 px both fade at their sides into Night. All three are one file. */}
          <Image src={photo} alt="" fill sizes="100vw" className="object-cover object-[25%_50%] lg:hidden" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-full overflow-hidden lg:block min-[2100px]:inset-x-[calc(50%-1050px)] min-[2100px]:[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
            <Image src={photo} alt="" fill sizes="100vw" className="origin-top scale-y-[14] object-fill blur-xl" />
          </div>
          <div className="absolute bottom-0 left-1/2 hidden aspect-[7/3] w-full max-w-[2100px] -translate-x-1/2 [mask-image:linear-gradient(to_bottom,transparent,#000_16%)] lg:block min-[2100px]:[mask-composite:intersect] min-[2100px]:[mask-image:linear-gradient(to_bottom,transparent,#000_16%),linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
            <Image src={photo} alt="" fill sizes="100vw" className="object-cover" />
          </div>
          {/* Only a whisper of Night over the photograph; the heading brings its own soft shade (below). */}
          <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to bottom, rgba(23, 22, 20, 0.3) 0%, rgba(23, 22, 20, 0.12) clamp(260px, 52%, 520px), rgba(23, 22, 20, 0.1) 75%, rgba(23, 22, 20, 0.25) 100%)" }} />
        </>
      )}
      <div className="wrap relative">
        <div className="flex items-end justify-between gap-4">
          <div className="relative max-w-[640px]">
            {/* A soft cloud of Night behind the words alone, so they read over the bottles and the bright wall. */}
            {photo && <div aria-hidden="true" className="absolute -inset-x-16 -inset-y-14 rounded-[48px] bg-night/70 blur-xl" />}
            {/* Gold needs near black to read; over the photograph the eyebrow takes Dune, like the line under the title. */}
            <p className={`eyebrow relative text-[12px] ${photo ? "text-dune" : "text-gold"}`}>Only at eternal</p>
            <h2 id="originals-title" className="display-l relative mt-2">
              Eternal Originals
            </h2>
            <p className="relative mt-2 text-[15px] leading-snug text-dune lg:mt-4 lg:text-[17px]">
              {ORIGINALS_DESCRIPTOR} {entries.length === 5 ? "Five" : entries.length} scents that are ours alone.
            </p>
          </div>
          <Link href="/shop/originals" className="-mb-3 inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] font-semibold text-linen">
            <span className="lnk">Shop all {entries.length}</span>
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <SelectList list="home_originals" items={entries.map(listItem)} className="mt-8 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-5 lg:gap-5">
          {entries.map((e, i) => {
            // As in Where to start: the scent among its notes leads; the bottle comes in on hover.
            const notes = siteImage(`products/${e.handle}-3`);
            const card = notes && notes !== e.image ? { ...e, image: notes, hoverImage: e.image } : e;
            return (
              // The picture runs to the panel's edges, so a card's focus ring falls outside it, on the dark band: Linen there.
              // With a mouse, Add to bag hangs flush from the panel's foot at its full width, over the photograph, so its
              // focus ring is drawn inside it, in Linen.
              <div key={e.handle} className={`bg-linen text-night [--card-actions-gap:0px] [&_.card-link:focus-visible]:after:outline-linen [&_.card-actions_.btn:not(.card-try):focus-visible]:outline-linen [&_.card-actions_.btn:not(.card-try):focus-visible]:-outline-offset-4 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}>
                <ProductCard entry={card} badge={false} sizes={i === 0 ? "(min-width: 1024px) 20vw, 100vw" : "(min-width: 1024px) 20vw, 50vw"} bodyClassName="px-2.5 pb-3 lg:px-4 lg:pb-4" />
              </div>
            );
          })}
        </SelectList>
      </div>
    </section>
  );
}

/**
 * Shop by occasion: five occasions, each a collection of hand-picked scents
 * (content/occasions.ts), laid out like Shop by scent.
 */
export function OccasionTiles({ counts }: { counts: Record<OccasionKey, number> }) {
  return (
    <section className="py-10 lg:py-24">
      <div className="wrap">
        <HomeHead title="Shop by occasion" sub="Start from where you are going." />
        <ul className="mt-6 grid grid-cols-2 gap-x-2 gap-y-5 lg:mt-12 lg:grid-cols-5 lg:gap-x-6">
          {occasionOrder.map((k, i) => {
            const o = occasions[k];
            return (
              <li key={k} className={i === 0 ? "col-span-2 lg:col-span-1" : undefined}>
                <Link href={`/shop/${k}`} className="group block">
                  <div className={`relative overflow-hidden ${i === 0 ? "aspect-[2/1] lg:aspect-[3/4]" : "aspect-square lg:aspect-[3/4]"}`} style={{ backgroundColor: o.world.bg }}>
                    <Figure
                      name={o.still}
                      label={`${o.label} — still`}
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="absolute inset-0"
                      imageClassName="hover-lift"
                      placeholderClassName="slot-corner !border-0 opacity-80"
                      style={{ backgroundColor: o.world.bg }}
                    />
                  </div>
                  <span className="u-draw serif mt-2 inline-block text-[19px] leading-tight lg:mt-3 lg:text-[28px]">{o.label}</span>
                  {counts[k] > 0 && <span className="mt-0.5 block text-[12px] text-ash">{counts[k]} scents</span>}
                </Link>
              </li>
            );
          })}
        </ul>
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
                  Three {ml(site.sampleSizeMl)} scents for him or for her, chosen by the house, in a matte black box. For the curious, and for gifts.
                </p>
                {box.bottle.availableForSale ? (
                  <Price money={box.price} className="mt-auto pt-3 text-[16px] font-semibold" />
                ) : (
                  <p className="mt-auto pt-3 text-[14px] text-ash">For him and for her: out of stock for now.</p>
                )}
              </div>
              <div className="col-span-2 mt-3 flex flex-col lg:mt-6">
                {/* The box comes for him or for her: the choice is made on its page, so the button goes there. */}
                <Link href={`/products/${box.handle}`} className="btn btn-block">
                  {box.bottle.availableForSale ? `Choose your box · ${formatMoney(box.price)}` : "See the box"}
                </Link>
              </div>
            </article>
          )}
          {/* Its top and foot match the box's, so on a wide screen the two headings, and the two 52 px buttons, sit on one line. */}
          <article className="watermark relative flex flex-col justify-between gap-6 overflow-hidden bg-night p-6 text-linen lg:px-10 lg:pb-6 lg:pt-7">
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
 * Shop by scent: the six families, each with the owner's ingredient still
 * (family-<key>; content/taxonomy.ts familyStills names a stand-in should one go missing).
 */
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
                      name={familyStills[k]}
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
  // The tale's own banner (its page opens on it) behind the band, in its own colours: only a neutral Night shade over
  // it, deepest behind the words (on a phone they run the full width, so the shade is even there). Without the banner,
  // the scent's colour world, or Sea for a light one.
  const banner = siteImage(`tale-${tale.slug}`);
  const bg = banner ? "#171614" : scent.world.dark ? scent.world.bg : "#163a4e";
  return (
    <section className={`relative overflow-hidden text-linen ${banner ? "" : "grain watermark"}`} style={{ backgroundColor: bg }}>
      {banner && (
        <>
          <Image src={banner} alt="" fill sizes="100vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-night/65 lg:bg-transparent lg:bg-[linear-gradient(to_left,rgba(23,22,20,0.78)_0%,rgba(23,22,20,0.74)_55%,rgba(23,22,20,0.3)_100%)]" />
        </>
      )}
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
              A tale from <LineLabel line={scent.line} sep=", " />
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
                <dd className="serif mt-1 text-[18px] leading-tight">{scent.inspiredBy}</dd>
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
                  <LineLabel line={t.line} sep=", " />
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
