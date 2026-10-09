"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { nav } from "@/content/site";
import type { LineKey } from "@/content/taxonomy";
import { facts } from "@/lib/facts";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import { Mark, Wordmark } from "@/components/ui/Wordmark";
import { MegaMenu, type FeaturedTiles } from "./MegaMenu";
import { SearchOverlay, type TaleIndexEntry } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";

const ORIGINALS = "/shop/originals";

/** The bag button's name says what is in it; before the stored bag is read it is just "Bag". */
const bagLabel = (ready: boolean, n: number) => (ready ? `Bag, ${n} ${n === 1 ? "item" : "items"}` : "Bag");

export function Header({
  index,
  featured,
  taleIndex,
  popular,
}: {
  index: ScentIndexEntry[];
  featured: FeaturedTiles;
  taleIndex: TaleIndexEntry[];
  popular: ScentIndexEntry[];
}) {
  const pathname = usePathname();
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // D3: the bag icon ticks once when a line is added. Reading the stored bag on a page load is not an add, so a
  // higher count ticks only when the bag had already been read before it.
  const [tick, setTick] = useState(false);
  const [seen, setSeen] = useState({ count: cart.count, ready: cart.ready });
  if (seen.count !== cart.count || seen.ready !== cart.ready) {
    setSeen({ count: cart.count, ready: cart.ready });
    if (seen.ready && cart.ready && cart.count > seen.count) setTick(true);
  }
  useEffect(() => {
    if (!tick) return;
    const t = window.setTimeout(() => setTick(false), 400);
    return () => window.clearTimeout(t);
  }, [tick]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 120);
    };
    const raf = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Route change closes every panel (state adjusted during render, per React's guidance).
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setMenu(false);
    setSearch(false);
    setMobile(false);
  }

  useEffect(() => {
    if (!search && !mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearch(false);
        setMobile(false);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search, mobile]);

  const openMenu = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setMenu(true);
  }, []);
  const scheduleClose = useCallback(() => {
    closeTimer.current = window.setTimeout(() => setMenu(false), 120);
  }, []);
  const closeSearch = useCallback(() => setSearch(false), []);
  const closeMobile = useCallback(() => setMobile(false), []);
  // While search is open the bar behind it is inert (useModal), so a tap on it lands here: it closes the search, as the backdrop does.
  const closeSearchOutside = (e: MouseEvent) => {
    if (!(e.target instanceof Element && e.target.closest('[role="dialog"]'))) setSearch(false);
  };

  // What the phone menu says about each line and the box, from the catalogue itself.
  const counts = useMemo(() => {
    const n = (line: LineKey) => index.filter((e) => e.kind === "scent" && e.line === line).length;
    return { eterna: n("eterna"), eterno: n("eterno"), eternal: n("eternal") };
  }, [index]);
  const box = useMemo(() => index.find((e) => e.kind === "set" && e.handle === "mystery-box") ?? null, [index]);
  // The Eternal Originals for her, for him, then unisex (lib/catalogue.ts getOriginals).
  const originals = useMemo(() => {
    const rank = (e: ScentIndexEntry) => (e.line ? ["eterna", "eterno", "eternal"].indexOf(e.line) : 3);
    return index.filter((e) => e.kind === "scent" && e.isOriginal).sort((a, b) => rank(a) - rank(b));
  }, [index]);

  // "/" is served from /home/<hero> (proxy.ts), so the prerendered header must read that path as home too.
  const isHome = pathname === "/" || pathname.startsWith("/home/");
  const transparent = isHome && !scrolled && !menu && !search;
  const showAnnouncement = Boolean(facts.announcement) && !scrolled;
  // How far down the header ends right now, for the search panel's height.
  const chromeH = showAnnouncement ? "calc(var(--header-h) + var(--announce-h))" : "var(--header-h)";

  return (
    <>
      {/* data-modal-keep: the backdrop sits outside the search panel, and must stay live while the rest of the page goes inert. */}
      {search && <button type="button" tabIndex={-1} aria-hidden="true" data-modal-keep onClick={closeSearch} className="fade-enter fixed inset-0 z-[55] bg-night/40" />}
      <div
        className="fixed inset-x-0 top-0 z-[60]"
        style={{ ["--chrome-h" as string]: chromeH }}
        onMouseLeave={scheduleClose}
        onClick={search ? closeSearchOutside : undefined}
      >
        {facts.announcement && (
          <div
            className={`ann overflow-hidden bg-night text-linen transition-[height] duration-200 ${showAnnouncement ? "h-[var(--announce-h)]" : "h-0"}`}
            aria-hidden={!showAnnouncement}
          >
            <p className="truncate px-4 text-center text-[12px] leading-[var(--announce-h)] tracking-[0.02em]">{facts.announcement}</p>
          </div>
        )}
        <header
          className={`relative h-[var(--header-h)] border-b transition-colors duration-200 ${
            transparent ? "border-transparent bg-transparent text-linen" : "border-dune bg-linen text-night"
          }`}
        >
          <div className="wrap grid h-full grid-cols-[1fr_auto_1fr] items-center max-lg:px-2">
            {/* The links run the header's full height, so the active and hover line sits on its bottom edge. */}
            <nav aria-label="Primary" className="hidden gap-7 self-stretch lg:flex">
              {nav.map((item) => {
                const isShop = item.href === "/shop";
                const isOriginals = item.href === ORIGINALS;
                // The Eternal Originals have their own link, so Shop is not lit on their page.
                const active = isShop
                  ? (pathname === "/shop" || pathname.startsWith("/shop/") || pathname.startsWith("/products")) && pathname !== ORIGINALS
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  // Four links fit beside the wordmark from 1280 px; below that Tales waits in the footer and the phone menu.
                  <div key={item.href} className={`relative flex ${item.href === "/tales" ? "max-xl:hidden" : ""}`} onMouseEnter={isShop ? openMenu : undefined}>
                    <Link
                      href={item.href}
                      aria-expanded={isShop ? menu : undefined}
                      aria-haspopup={isShop ? "true" : undefined}
                      onFocus={isShop ? openMenu : undefined}
                      className={`ui nav-link inline-flex h-[calc(100%+1px)] items-center whitespace-nowrap border-b ${isOriginals ? "gap-2" : "gap-1"} ${active ? "border-current" : "border-transparent"}`}
                    >
                      {/* The house's mark names its own compositions, apart from the scents inspired by another. */}
                      {isOriginals && <Mark size={20} className={`shrink-0 ${transparent ? "" : "text-gold-text"}`} />}
                      {item.label}
                      {isShop && <Icon name="chevron-down" size={14} />}
                    </Link>
                  </div>
                );
              })}
            </nav>
            <button type="button" className="flex h-11 w-11 items-center justify-center lg:hidden" aria-label="Open menu" aria-expanded={mobile} onClick={() => setMobile(true)}>
              <Icon name="menu" size={22} />
            </button>

            <Wordmark inverted={transparent} className="justify-self-center" />

            <div className="flex items-center justify-end sm:gap-3">
              <button
                type="button"
                className="ui inline-flex h-11 w-11 items-center justify-center gap-2 hover:opacity-70 sm:w-auto sm:px-2"
                aria-label="Search"
                aria-expanded={search}
                onClick={() => setSearch((s) => !s)}
              >
                <Icon name="search" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                type="button"
                data-bag-button
                className="relative inline-flex h-11 w-11 items-center justify-center hover:opacity-70"
                aria-label={bagLabel(cart.ready, cart.count)}
                onClick={() => {
                  setSearch(false);
                  cart.openDrawer();
                }}
              >
                <Icon name="bag" className={tick ? "bag-tick" : undefined} />
                {cart.ready && cart.count > 0 && (
                  <span aria-hidden="true" className="tnum absolute right-0 top-1 flex h-[18px] min-w-[18px] items-center justify-center bg-gold-text px-1 text-[11px] font-bold text-linen">
                    {cart.count}
                  </span>
                )}
              </button>
            </div>
          </div>
          {menu && <MegaMenu featured={featured} originals={originals} onEnter={openMenu} onLeave={scheduleClose} />}
          {search && <SearchOverlay index={index} taleIndex={taleIndex} popular={popular} onClose={closeSearch} />}
        </header>
      </div>
      {/* Reserve the chrome's height on every page but the home hero, which runs under it. */}
      {!isHome && <div aria-hidden="true" className={facts.announcement ? "h-[calc(var(--header-h)+var(--announce-h))]" : "h-[var(--header-h)]"} />}
      {mobile && <MobileMenu onClose={closeMobile} counts={counts} box={box} originals={originals} />}
    </>
  );
}
