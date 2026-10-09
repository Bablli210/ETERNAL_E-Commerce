"use client";

import Link from "next/link";
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { families, familyOrder, lines, moods, moodOrder, type FamilyKey, type LineKey, type MoodKey } from "@/content/taxonomy";
import { site } from "@/content/site";
import { reportSearch, searchIndex } from "@/lib/search";
import { track } from "@/lib/client/analytics";
import { easing, motionAllowed } from "@/lib/motion";
import { formatMoney } from "@/lib/format";
import { AddToBagButton } from "@/components/cart/AddToBagButton";
import { Icon } from "@/components/ui/Icon";
import { analyticsItem } from "./analytics-item";
import { FilterSheet, type FilterGroup, type FilterOption } from "./FilterSheet";
import { defaultGridState, gridQuery, mergeGridQuery, parseGridState, sorts, type GridState, type Sort } from "./grid-state";
import { LineLabel } from "./LineLabel";
import { LineName } from "@/components/ui/LineName";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";

/** Cards before "Show all": two columns, twelve rows. */
const PAGE = 24;
const LINE_ORDER: LineKey[] = ["eterna", "eterno", "eternal"];
/** Chips say who a line is for; the cards and the sheet carry the line names beside it. */
const LINE_CHIP: Record<LineKey, string> = { eterna: "For her", eterno: "For him", eternal: "Unisex" };
/** Two columns with a 20 px gutter and a 12 px gap on a phone, four on a desktop. */
const CARD_SIZES = "(min-width: 1024px) 25vw, calc(50vw - 26px)";

const price = (e: ScentIndexEntry) => parseFloat(e.price.amount);
/** The house's order: real sellers, then its picks; products still without a picture go last. */
const rank = (e: ScentIndexEntry) => (e.isBestseller ? 4 : 0) + (e.isPick ? 2 : 0) + (e.image ? 1 : 0);

/** A carousel ad's scents, in its order; handles that no longer exist are skipped. */
const pickHandles = (entries: ScentIndexEntry[], h: string[]) => h.map((x) => entries.find((e) => e.handle === x)).filter((e): e is ScentIndexEntry => Boolean(e));

function applyFilters(entries: ScentIndexEntry[], s: GridState, query: string): ScentIndexEntry[] {
  if (s.h.length) {
    const picked = pickHandles(entries, s.h);
    // A carousel link whose scents are all gone (renamed, unpublished) lands on the whole grid, never an empty page.
    if (picked.length) return picked;
  }
  const { line, family, mood } = s;
  const searching = query.trim().length >= 2;
  let list = searching ? searchIndex(entries, query, 100).map((r) => r.entry) : entries;
  if (line) list = list.filter((e) => e.line === line);
  if (family) list = list.filter((e) => e.families.includes(family));
  if (mood) list = list.filter((e) => e.moods.includes(mood));
  switch (s.sort) {
    case "price-asc":
      return [...list].sort((a, b) => price(a) - price(b));
    case "price-desc":
      return [...list].sort((a, b) => price(b) - price(a));
    case "az":
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    case "new":
      return [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew) || Number(Boolean(b.image)) - Number(Boolean(a.image)));
    default:
      // A search keeps its relevance order.
      return searching ? list : [...list].sort((a, b) => rank(b) - rank(a));
  }
}

/*
 * The URL is the grid's memory. Filters, sort, search and "show all" are
 * written into it with replaceState, so Back from a product rebuilds the same
 * grid at the same height and the browser lands on the card that was tapped.
 * Next's own history state is passed along, which keeps the router from
 * refetching the page for a change only this component reads.
 */
const URL_EVENT = "eternal:grid-url";
const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_EVENT, onChange);
  };
};
const readUrl = () => gridQuery(parseGridState(new URLSearchParams(window.location.search)));
function writeUrl(next: GridState) {
  const { pathname, search, hash } = window.location;
  const nextSearch = mergeGridQuery(search, next);
  if (nextSearch === search) return;
  window.history.replaceState(window.history.state, "", `${pathname}${nextSearch}${hash}`);
  window.dispatchEvent(new Event(URL_EVENT));
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

function SearchField({ value, onChange, onSubmit, dark = false }: { value: string; onChange: (v: string) => void; onSubmit: () => void; dark?: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        input.current?.blur();
        onSubmit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search by name, note or the original you love
      </label>
      <input
        ref={input}
        id={id}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by the original"
        className={`field h-11 pl-10 text-[16px] [&::-webkit-search-cancel-button]:appearance-none ${value ? "pr-11" : "pr-3"} ${dark ? "field-dark bg-night/55 backdrop-blur-sm" : ""}`}
      />
      <Icon name="search" size={18} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-linen/80" : "text-ash"}`} />
      {value && (
        <button type="button" aria-label="Clear the search" onClick={() => onChange("")} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center">
          <Icon name="close" size={16} />
        </button>
      )}
    </form>
  );
}

/** The mystery box inside the grid: the low-risk first order, one tap from the scents around it. */
function BoxTile({ box }: { box: ScentIndexEntry }) {
  if (!box.bottle) return null;
  const product = { productId: box.productId, handle: box.handle, title: box.title, image: box.image, lineLabel: box.lineLabel, world: box.world };
  return (
    <aside aria-label="The mystery box" className="col-span-2 grid grid-cols-[40%_1fr] gap-x-4 bg-paper p-3 lg:grid-cols-[42%_1fr] lg:gap-x-8 lg:p-6">
      {/* The picture repeats the "What’s inside" link for a thumb, not for a screen reader or the tab order. */}
      <Link href={`/products/${box.handle}`} aria-hidden="true" tabIndex={-1} className="block min-h-[176px]">
        <ProductImage src={box.image} alt="" world={box.world} sizes="(min-width: 1024px) 20vw, 40vw" className="h-full w-full" />
      </Link>
      <div className="flex flex-col py-1">
        <p className="eyebrow text-[12px] text-ash">Not sure yet?</p>
        <p className="serif mt-2 text-[22px] font-semibold leading-[1.1] lg:text-[32px]">
          Three scents to try{box.bottle.availableForSale ? <>, <span className="whitespace-nowrap">{formatMoney(box.price)}</span></> : ", out of stock for now"}
        </p>
        <p className="mt-2 text-[14px] leading-snug text-ash">
          Three {site.sampleSizeMl} ml eau de parfum samples{box.choices ? " for him or for her" : ""}, chosen by the house. Wear them, then choose your bottle.
        </p>
        <div className="mt-auto flex flex-col pt-4 lg:max-w-[280px]">
          {/* For him or for her is chosen on the box's page. */}
          {box.choices ? (
            <Link href={`/products/${box.handle}`} className="btn btn-sm btn-block">
              Choose your box
            </Link>
          ) : (
            <AddToBagButton variant={box.bottle} product={product} source="grid_box" kind="set" size="sm" block label="Add the box" />
          )}
          <Link href={`/products/${box.handle}`} className="mt-1 flex min-h-11 items-center self-start">
            <span className="lnk">What’s inside</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

/** A search that finds nothing still leads somewhere: the three lines and the finder. */
function NoMatch({ query, lineCounts }: { query: string; lineCounts: Record<LineKey, number> }) {
  return (
    <div className="mt-6 max-w-[560px]">
      <p className="serif text-[26px] leading-tight">Nothing matches “{query}” yet.</p>
      <p className="mt-2 text-[15px] text-ash">Not every scent lists its original yet. Start from a line, or let the finder choose for you.</p>
      <ul className="mt-6 border-t border-dune">
        {LINE_ORDER.map((k) => (
          <li key={k} className="border-b border-dune">
            <Link href={`/shop/${lines[k].slug}`} className="flex min-h-14 items-center justify-between gap-4 py-2 hover:text-sea">
              <span className="serif text-[22px]">
                <LineLabel line={k} />
              </span>
              <span className="flex items-center gap-1 text-[13px] text-ash">
                <span className="tnum">{lineCounts[k]} scents</span>
                <Icon name="chevron-right" size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/finder" className="btn btn-block mt-6 lg:w-auto">
        Take the scent finder
      </Link>
    </div>
  );
}

/**
 * Playbook 4.3. A compact head (on a line page, the line's own still as a
 * short band) keeps the first card's picture, name and price on a 390 × 664
 * in-app screen. Under it: the search by the original, then one row with the
 * Filter button and the chips (line, then family, with counts), where applied
 * filters lead as removable chips. Once that row scrolls away a Filter button
 * floats above the thumb. Two columns, 24 cards, then "Show all".
 */
export function CollectionGrid({
  entries,
  house,
  list,
  title,
  line = null,
  scope = title,
  descriptor,
  eyebrow,
  banner,
  bannerSide = "left",
  initial = defaultGridState,
  promo,
  lineCounts,
  badges = true,
}: {
  entries: ScentIndexEntry[];
  /** The whole catalogue, so a search on a line, family or mood page also finds the scents outside it. */
  house?: ScentIndexEntry[];
  /** The list name analytics reports: the collection's slug. */
  list: string;
  title: string;
  /** On a line page, its line: the title is drawn as the line's logotype. */
  line?: LineKey | null;
  /** What this page holds, as a search result names it: "eterna · for her", "Woody". */
  scope?: string;
  descriptor: string;
  /** On a line page, who the line is for, above its name. */
  eyebrow?: string;
  /** On a line page, its still, shown behind the title as a short band. */
  banner?: ReactNode;
  /** Where the band's words sit from lg: left of a still whose subject stands right, or right of one whose subject stands left. */
  bannerSide?: "left" | "right";
  /** The state the server rendered from the URL; every collection page renders per request. */
  initial?: GridState;
  /** The mystery box, offered inside the grid as the low-risk first order. */
  promo?: ScentIndexEntry | null;
  /** Scents per line, for the no-match suggestions. */
  lineCounts: Record<LineKey, number>;
  /** False where every card would wear the same badge (New arrivals). */
  badges?: boolean;
}) {
  const serverUrl = gridQuery(initial);
  const search = useSyncExternalStore(subscribe, readUrl, () => serverUrl);
  const url = useMemo(() => parseGridState(new URLSearchParams(search)), [search]);
  // The search box types ahead of the URL, which follows a moment later.
  const [query, setQuery] = useState(url.q);
  const written = useRef(url.q);
  const [sheet, setSheet] = useState(false);
  const [floating, setFloating] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLButtonElement>(null);
  const positions = useRef<Map<string, DOMRect> | null>(null);
  const sentList = useRef("");
  /** The grid's query when the sheet opened, so closing it re-anchors the results only if they changed. */
  const sheetFrom = useRef("");

  const filtered = useMemo(() => applyFilters(entries, url, query), [entries, url, query]);
  const selection = useMemo(() => pickHandles(entries, url.h).length > 0, [entries, url.h]);
  const shown = useMemo(() => (url.all || selection ? filtered : filtered.slice(0, PAGE)), [filtered, url.all, selection]);
  const searching = query.trim().length >= 2;
  const listName = selection ? "ad_selection" : searching ? "search" : list;

  // A search never stops at the page's edge: the matches outside this page or its filters, from the whole house.
  const elsewhere = useMemo(() => {
    if (!searching || selection || !house) return [];
    const here = new Set(filtered.map((e) => e.handle));
    return searchIndex(house.filter((e) => e.kind === "scent" && !here.has(e.handle)), query, 100).map((r) => r.entry);
  }, [house, searching, selection, filtered, query]);
  const houseSearch = `/shop?q=${encodeURIComponent(query.trim())}`;

  const apply = (patch: Partial<GridState>) => {
    // A carousel link with no live scents is dropped from the URL at the first change.
    const next = { ...url, q: query.trim(), ...(selection ? {} : { h: [] }), ...patch };
    written.current = next.q;
    writeUrl(next);
  };

  // A link to this same page (or Back across it) changes the URL without remounting: take its search too.
  useLayoutEffect(() => {
    const onUrl = () => {
      const q = parseGridState(new URLSearchParams(window.location.search)).q;
      if (q === written.current) return;
      written.current = q;
      setQuery(q);
    };
    window.addEventListener(URL_EVENT, onUrl);
    window.addEventListener("popstate", onUrl);
    return () => {
      window.removeEventListener(URL_EVENT, onUrl);
      window.removeEventListener("popstate", onUrl);
    };
  }, []);

  // Next writes the address bar while committing a navigation, after this render read it; look again once committed.
  useLayoutEffect(() => {
    if (readUrl() !== search) window.dispatchEvent(new Event(URL_EVENT));
  });

  // The typed search follows into the URL a moment later...
  useEffect(() => {
    const term = query.trim();
    if (term === url.q) return;
    const t = window.setTimeout(() => {
      written.current = term;
      writeUrl({ ...url, q: term });
    }, 400);
    return () => window.clearTimeout(t);
  }, [query, url]);

  // ...and is counted once the visitor pauses, with how many scents it found in the whole house.
  const results = filtered.length + elsewhere.length;
  useEffect(() => {
    const term = query.trim();
    if (!term || term === initial.q) return;
    const t = window.setTimeout(() => reportSearch(term, results), 900);
    return () => window.clearTimeout(t);
  }, [query, results, initial.q]);

  // view_item_list once per distinct list of cards on screen.
  useEffect(() => {
    const key = `${listName}:${shown.map((e) => e.handle).join(",")}`;
    const t = window.setTimeout(() => {
      if (sentList.current === key || !shown.length) return;
      sentList.current = key;
      track({ name: "view_item_list", list: listName, items: shown.map(analyticsItem) });
    }, 600);
    return () => window.clearTimeout(t);
  }, [listName, shown]);

  /**
   * P1 / P3 · FLIP: cards that stay glide to their new place (320 ms); cards
   * that arrive fade up with a 40 ms stagger. The first layout is left alone
   * so the LCP image never animates.
   */
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      positions.current = null;
      return;
    }
    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-card]"));
    const next = new Map<string, DOMRect>();
    cards.forEach((c) => next.set(c.dataset.card!, c.getBoundingClientRect()));
    const prev = positions.current;
    positions.current = next;
    if (!prev || !motionAllowed()) return;
    let arrivals = 0;
    cards.forEach((c) => {
      const key = c.dataset.card!;
      const was = prev.get(key);
      const now = next.get(key)!;
      if (was) {
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 320, easing: easing.standard });
      } else {
        c.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: Math.min(arrivals++ * 40, 480), easing: easing.standard, fill: "backwards" });
      }
    });
  }, [shown]);

  // An ad's own selection, or a search that found nothing, has nothing to filter.
  const hasRow = !selection && !(searching && filtered.length === 0);
  const hasGrid = shown.length > 0;

  // The floating Filter button shows while the chip row is scrolled away and cards are on screen.
  useEffect(() => {
    const row = rowRef.current;
    const grid = gridRef.current;
    if (!row || !grid) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    let rowGone = false;
    let gridIn = false;
    const io = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          if (r.target === row) rowGone = !r.isIntersecting && r.boundingClientRect.top < header;
          else gridIn = r.isIntersecting;
        }
        setFloating(rowGone && gridIn);
      },
      { rootMargin: `-${header}px 0px 0px 0px` },
    );
    io.observe(row);
    io.observe(grid);
    return () => io.disconnect();
  }, [hasRow, hasGrid]);

  // Sticky-bar contract: --sticky-bar-h holds the floating button's footprint while it shows.
  const showFloat = floating && hasRow && hasGrid && !sheet;
  useEffect(() => {
    const el = floatRef.current;
    if (!showFloat || !el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--sticky-bar-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [showFloat]);

  /* Chips: line, then scent family (with counts). Moods are no longer offered;
     one arriving in an old link still shows as an applied chip to clear. A chip that
     would empty the grid or change nothing (every scent shown already
     matches it, like Floral on the floral page) is not offered; an applied
     one always is. */
  const countWith = (patch: Partial<GridState>) => applyFilters(entries, { ...url, ...patch }, query).length;
  const offer = (dimSet: boolean, active: boolean, patch: Partial<GridState>, clear: Partial<GridState>, key: string, label: ReactNode, withCount: boolean): FilterOption | null => {
    const count = countWith(patch);
    if (!active && (count === 0 || (!dimSet && count === filtered.length))) return null;
    return { key, label, count: withCount ? count : undefined, active, onToggle: () => apply(active ? clear : patch) };
  };
  const isOption = (o: FilterOption | null): o is FilterOption => o !== null;
  const lineOptions = (label: (k: LineKey) => ReactNode) => LINE_ORDER.map((k) => offer(Boolean(url.line), url.line === k, { line: k }, { line: null }, k, label(k), false)).filter(isOption);
  const familyOptions = familyOrder.map((k: FamilyKey) => offer(Boolean(url.family), url.family === k, { family: k }, { family: null }, k, families[k].label, true)).filter(isOption);
  const moodOptions = moodOrder.filter((k) => k === url.mood).map((k: MoodKey) => offer(true, true, { mood: k }, { mood: null }, k, moods[k].label, false)).filter(isOption);
  const quickLines = lineOptions((k) => LINE_CHIP[k]);
  const applied = [...quickLines, ...familyOptions, ...moodOptions].filter((o) => o.active);
  const quick = [...applied, ...quickLines.filter((o) => !o.active), ...familyOptions.filter((o) => !o.active)];
  const activeCount = applied.length;

  const groups: FilterGroup[] = [
    { title: "Sort", options: sorts.map((s) => ({ key: s.key, label: s.label, active: url.sort === s.key, onToggle: () => apply({ sort: s.key }) })) },
    { title: "Line", options: lineOptions((k) => <LineLabel line={k} />) },
    { title: "Scent", options: familyOptions },
  ];

  const reportFilters = (s: GridState) => track({ name: "ui", action: "filter_apply", label: `${s.line ?? ""}|${s.family ?? ""}|${s.mood ?? ""}|${s.sort}` });
  const toggleChip = (o: FilterOption) => {
    o.onToggle();
    // The URL already holds the new state.
    reportFilters(parseGridState(new URLSearchParams(window.location.search)));
    chipsRef.current?.scrollTo({ left: 0 });
  };
  const openSheet = () => {
    sheetFrom.current = search;
    setSheet(true);
  };
  const showResults = () => {
    setSheet(false);
    reportFilters(url);
    // Results start at the chip row; bring it back if the sheet was opened further down.
    const row = rowRef.current;
    if (!row) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    const top = row.getBoundingClientRect().top + window.scrollY - header - 8;
    if (window.scrollY <= top) return;
    window.scrollTo({ top });
    // The floating button that opened the sheet leaves with the scroll: focus moves to the row's Filter button, not the page.
    window.requestAnimationFrame(() => filterRef.current?.focus({ preventScroll: true }));
  };
  // X, the backdrop and Escape: once the sheet changed the grid, they land on the results like "Show N"; otherwise the page stays put.
  const closeSheet = () => (search !== sheetFrom.current ? showResults() : setSheet(false));
  const seeAll = () => {
    apply({ h: [] });
    window.scrollTo({ top: 0 });
  };

  const plural = (n: number) => `${n} ${n === 1 ? "scent" : "scents"}`;
  // Away from /shop a search keeps the page's name, so it reads as a search of this page.
  const heading = searching ? (list === "all" ? `Results for “${query.trim()}”` : `${title} · “${query.trim()}”`) : selection ? "Selected scents" : title;
  const sortLabel = sorts.find((s) => s.key === url.sort)?.label;
  const field = <SearchField value={query} onChange={setQuery} onSubmit={() => query.trim() && reportSearch(query, results)} dark={Boolean(banner)} />;
  // What a search on this page could not see: the page itself, or the filters on /shop.
  const where = list === "all" ? "these filters" : scope;
  // The count never reads as "0 scents" when the house has the scent.
  const found = `${filtered.length} here · ${elsewhere.length} elsewhere`;

  return (
    <div>
      {banner && !selection ? (
        <div className="relative -mx-5 overflow-hidden bg-night text-linen lg:mx-0">
          <div className="absolute inset-0">{banner}</div>
          {/* Night behind the words. With the words on the right (from md, where the 40 px title fits the right half)
              it starts only where the still's subject ends, at 46% from the left; on a phone, where the words have to sit
              over that subject, it is deeper. */}
          <div className={`absolute inset-0 bg-gradient-to-r from-night/60 via-night/20 to-transparent ${bannerSide === "right" ? "max-md:from-night/80 max-md:via-night/60 max-md:to-night/20 md:bg-[linear-gradient(to_left,rgba(23,22,20,0.6)_0%,rgba(23,22,20,0.5)_50%,transparent_54%)]" : ""}`} aria-hidden="true" />
          <div className={`relative flex min-h-[160px] flex-col justify-between gap-3 px-5 py-3.5 lg:min-h-[400px] lg:p-10 ${bannerSide === "right" ? "md:pl-[48%] lg:pl-[48%]" : ""}`}>
            <div>
              {eyebrow && <p className="eyebrow text-[12px] text-linen/80">{eyebrow}</p>}
              {/* On the right half the title keeps one line: smaller until there is room for 64 px. */}
              <h1 className={`serif mt-1 text-[40px] font-semibold leading-none lg:text-[64px] ${bannerSide === "right" ? "lg:max-xl:text-[48px]" : ""}`}>{line ? <LineName line={line} size="0.9em" /> : title}</h1>
              <p className="mt-3 hidden max-w-[44ch] text-[17px] leading-relaxed text-linen/80 lg:block">{descriptor}</p>
            </div>
            {/* How many scents, right above the search that narrows them. */}
            <div className={`w-[72%] max-w-[360px] ${bannerSide === "right" ? "md:w-full" : ""}`}>
              <p className="tnum mb-2 text-[13px] text-linen/80" aria-live="polite">
                {elsewhere.length ? found : searching ? `${plural(filtered.length)} for “${query.trim()}”` : plural(filtered.length)}
              </p>
              {field}
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-4 lg:pt-2">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="serif min-w-0 truncate py-0.5 text-[32px] font-semibold leading-[1.15] lg:text-[56px]">
              {line && !selection ? (
                <>
                  <LineName line={line} size="0.9em" />
                  {searching ? ` · “${query.trim()}”` : ""}
                </>
              ) : (
                heading
              )}
            </h1>
            <p className="tnum shrink-0 text-[13px] text-ash" aria-live="polite">
              {elsewhere.length ? found : plural(filtered.length)}
            </p>
          </div>
          {!searching && !selection && <p className="mt-2 hidden max-w-[56ch] text-[17px] leading-relaxed text-ash lg:block">{descriptor}</p>}
          {!selection && <div className="mt-3 lg:mt-6 lg:max-w-[420px]">{field}</div>}
        </div>
      )}

      {hasRow && (
        <div ref={rowRef} className="mt-2 flex items-center gap-2 lg:mt-6 lg:items-start">
          <button ref={filterRef} type="button" className="btn btn-secondary btn-sm shrink-0 gap-2 px-4" aria-haspopup="dialog" aria-expanded={sheet} onClick={openSheet}>
            <FilterIcon />
            Filter{activeCount ? ` · ${activeCount}` : ""}
          </button>
          <div ref={chipsRef} className="no-scrollbar -mr-5 flex min-w-0 flex-1 gap-2 overflow-x-auto pr-5 lg:mr-0 lg:flex-wrap lg:pr-0" role="group" aria-label="Quick filters">
            {/* Clear all leads, beside the Filter count it resets, so it is always on screen; then the applied chips, then those still on offer. */}
            {activeCount > 1 && (
              <button type="button" className="lnk lnk-quiet h-11 shrink-0 px-2 text-ash" onClick={() => apply({ line: null, family: null, mood: null })}>
                Clear all
              </button>
            )}
            {quick.map((o) => (
              <button key={o.key} type="button" className="chip h-11 shrink-0 text-[13px]" aria-pressed={o.active} onClick={() => toggleChip(o)}>
                {o.label}
                {o.active ? <Icon name="close" size={14} /> : o.count !== undefined && <span className="tnum text-ash">{o.count}</span>}
              </button>
            ))}
          </div>
          <label className="relative hidden h-11 shrink-0 cursor-pointer items-center gap-2 border border-dune bg-paper px-4 text-[13px] lg:flex">
            <span className="text-ash">Sort</span>
            <span className="font-medium">{sortLabel}</span>
            <Icon name="chevron-down" size={14} />
            <select value={url.sort} onChange={(e) => apply({ sort: e.target.value as Sort })} aria-label="Sort" className="absolute inset-0 cursor-pointer opacity-0">
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {shown.length === 0 ? (
        searching ? (
          elsewhere.length ? (
            // Not on this page is not "doesn't exist": show where it is in the house.
            <div className="mt-6">
              <p className="serif text-[26px] leading-tight">
                “{query.trim()}” isn’t in {where}.
              </p>
              <p className="mt-1 text-[15px] text-ash">Elsewhere in the house:</p>
              <div className="card-grid mt-6 grid grid-cols-2 gap-x-3 gap-y-10 lg:mt-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
                {elsewhere.slice(0, 6).map((e, i) => (
                  <ProductCard key={e.handle} entry={e} priority={i < 2} sizes={CARD_SIZES} list="search" index={i} badge={badges ? undefined : false} />
                ))}
              </div>
              <div className="mt-12 flex justify-center">
                <Link href={houseSearch} className="btn btn-secondary btn-block lg:w-auto">
                  {elsewhere.length > 6 ? `See all ${plural(elsewhere.length)}` : "Search every scent"} for “{query.trim()}”
                </Link>
              </div>
            </div>
          ) : (
            <NoMatch query={query.trim()} lineCounts={lineCounts} />
          )
        ) : (
          <div className="py-16 text-center">
            <p className="serif text-[26px]">Nothing matches these filters.</p>
            <button type="button" className="btn btn-secondary mt-6" onClick={() => apply({ line: null, family: null, mood: null, h: [] })}>
              Clear filters
            </button>
          </div>
        )
      ) : (
        <div ref={gridRef} className="card-grid mt-4 grid grid-cols-2 gap-x-3 gap-y-10 lg:mt-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
          {shown.map((e, i) => (
            <Fragment key={e.handle}>
              <ProductCard entry={e} priority={i < 2} sizes={CARD_SIZES} list={listName} index={i} badge={badges ? undefined : false} />
              {promo && i === Math.min(3, shown.length - 1) && <BoxTile box={promo} />}
            </Fragment>
          ))}
        </div>
      )}

      {shown.length < filtered.length && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="tnum text-[13px] text-ash">
            Showing {shown.length} of {filtered.length}
          </p>
          <button type="button" className="btn btn-secondary btn-block lg:w-auto" onClick={() => apply({ all: true })}>
            Show all {filtered.length} scents
          </button>
        </div>
      )}
      {shown.length > 0 && elsewhere.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Link href={houseSearch} className="btn btn-secondary btn-block gap-2 lg:w-auto">
            {elsewhere.length} more for “{query.trim()}” outside {where}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      )}
      {selection && (
        <div className="mt-12 flex justify-center">
          <button type="button" className="btn btn-block lg:w-auto" onClick={seeAll}>
            See all {entries.length} scents
          </button>
        </div>
      )}

      {showFloat && (
        <div ref={floatRef} className="shop-float pointer-events-none fixed inset-x-0 bottom-0 z-[40] flex justify-center pb-[calc(16px+env(safe-area-inset-bottom))] lg:hidden">
          <button type="button" aria-haspopup="dialog" onClick={openSheet} className="bar-enter float-shadow pointer-events-auto flex h-12 items-center gap-2 bg-night px-6 text-[13px] font-semibold tracking-[0.04em] text-linen">
            <FilterIcon />
            Filter &amp; sort{activeCount ? ` · ${activeCount}` : ""}
          </button>
        </div>
      )}

      {sheet && (
        <FilterSheet
          groups={groups}
          count={filtered.length}
          // Clear resets the sort too, so it also works when a sort is all that was chosen.
          canClear={activeCount > 0 || url.sort !== "recommended"}
          onClear={() => apply({ line: null, family: null, mood: null, sort: "recommended" })}
          onShow={showResults}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
