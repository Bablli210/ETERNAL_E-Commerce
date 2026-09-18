"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { nav, site } from "@/content/site";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Wordmark";
import { MegaMenu, type FeaturedTiles } from "./MegaMenu";
import { SearchOverlay, type TaleIndexEntry } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";

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
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [mobile, setMobile] = useState(false);
  const lastY = useRef(0);
  const closeTimer = useRef<number | null>(null);

  // D3: the bag icon ticks once when a line is added.
  const [tick, setTick] = useState(false);
  const [seenCount, setSeenCount] = useState(cart.count);
  if (seenCount !== cart.count) {
    setSeenCount(cart.count);
    if (cart.count > seenCount && cart.ready) setTick(true);
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
      setHidden(y > 400 && y > lastY.current && !menu && !search);
      lastY.current = y;
    };
    const raf = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [menu, search]);

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

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !menu && !search;
  const showAnnouncement = Boolean(site.announcement) && !scrolled;

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-[60] transition-transform duration-[240ms] ease-[var(--ease-standard)] ${hidden ? "-translate-y-full" : "translate-y-0"}`}
        onMouseLeave={scheduleClose}
      >
        {site.announcement && (
          <div
            className={`ann overflow-hidden bg-night text-linen transition-[height] duration-200 ${showAnnouncement ? "h-[var(--announce-h)]" : "h-0"}`}
            aria-hidden={!showAnnouncement}
          >
            <p className="flex h-[var(--announce-h)] items-center justify-center px-4 text-center text-[12px] tracking-[0.02em]">{site.announcement}</p>
          </div>
        )}
        <header
          className={`relative h-[var(--header-h)] border-b transition-colors duration-200 ${
            transparent ? "border-transparent bg-transparent text-linen" : "border-dune bg-linen text-night"
          }`}
        >
          <div className="wrap grid h-full grid-cols-[1fr_auto_1fr] items-center">
            <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
              {nav.map((item) => {
                const isShop = item.href === "/shop";
                const active = pathname === item.href || pathname.startsWith(item.href + "/") || (isShop && pathname.startsWith("/products"));
                return (
                  <div key={item.href} className="relative" onMouseEnter={isShop ? openMenu : undefined}>
                    <Link
                      href={item.href}
                      aria-expanded={isShop ? menu : undefined}
                      aria-haspopup={isShop ? "true" : undefined}
                      onFocus={isShop ? openMenu : undefined}
                      className={`ui inline-flex h-11 items-center gap-1 border-b ${active ? "border-current" : "border-transparent"} hover:opacity-70`}
                    >
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

            <div className="flex items-center justify-end gap-1 sm:gap-3">
              <button type="button" className="ui inline-flex h-11 items-center gap-2 px-2 hover:opacity-70" aria-label="Search" aria-expanded={search} onClick={() => setSearch((s) => !s)}>
                <Icon name="search" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button type="button" className="relative inline-flex h-11 items-center gap-2 px-2 hover:opacity-70" aria-label={`Bag, ${cart.count} items`} onClick={cart.openDrawer}>
                <Icon name="bag" className={tick ? "bag-tick" : undefined} />
                {cart.ready && cart.count > 0 && (
                  <span className="tnum absolute -right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center bg-gold px-1 text-[10px] font-bold text-linen">{cart.count}</span>
                )}
              </button>
            </div>
          </div>
          {menu && <MegaMenu featured={featured} onEnter={openMenu} onLeave={scheduleClose} />}
          {search && <SearchOverlay index={index} taleIndex={taleIndex} popular={popular} onClose={() => setSearch(false)} />}
        </header>
      </div>
      {/* Reserve the chrome height on every page but the home hero. */}
      {!isHome && <div style={{ height: site.announcement ? "calc(var(--header-h) + var(--announce-h))" : "var(--header-h)" }} aria-hidden="true" />}
      {mobile && <MobileMenu onClose={() => setMobile(false)} />}
    </>
  );
}
