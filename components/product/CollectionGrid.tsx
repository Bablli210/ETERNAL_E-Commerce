"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { families, familyOrder, moods, moodOrder, type FamilyKey, type MoodKey } from "@/content/taxonomy";
import { searchIndex } from "@/lib/search";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/components/ui/Icon";

type Sort = "bestselling" | "new" | "price-asc" | "price-desc" | "az";

export type EditorialTile = { eyebrow: string; quote: string; cta: string; href: string; dark?: boolean };

export function CollectionGrid({
  entries,
  initialQuery = "",
  showLineFilter = false,
  editorial,
  pageSize = 12,
}: {
  entries: ScentIndexEntry[];
  initialQuery?: string;
  showLineFilter?: boolean;
  editorial?: EditorialTile;
  pageSize?: number;
}) {
  const [family, setFamily] = useState<FamilyKey | null>(null);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [q, setQ] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("bestselling");
  const [shown, setShown] = useState(pageSize);
  const [drawer, setDrawer] = useState(false);

  const filtered = useMemo(() => {
    let list = entries;
    if (q.trim().length >= 2) list = searchIndex(list, q, 100).map((r) => r.entry);
    if (family) list = list.filter((e) => e.families.includes(family));
    if (mood) list = list.filter((e) => moods[mood].tags.some((t) => e.tags.includes(t)));
    if (line) list = list.filter((e) => e.line === line);
    const price = (e: ScentIndexEntry) => parseFloat(e.price.amount);
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => price(a) - price(b));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => price(b) - price(a));
        break;
      case "az":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "new":
        list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      default:
        list = [...list].sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || Number(Boolean(b.image)) - Number(Boolean(a.image)));
    }
    return list;
  }, [entries, q, family, mood, line, sort]);

  const visible = filtered.slice(0, shown);
  const activeCount = [family, mood, line].filter(Boolean).length;
  const clear = () => {
    setFamily(null);
    setMood(null);
    setLine(null);
    setQ("");
  };

  return (
    <div>
      {/* Family chips at first level, sticky under the header on mobile. */}
      <div className="sticky top-[var(--header-h)] z-[30] -mx-5 border-b border-dune bg-linen/95 px-5 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Scent family">
            <button type="button" className="chip" aria-pressed={family === null} onClick={() => setFamily(null)}>
              All
            </button>
            {familyOrder.map((k) => (
              <button key={k} type="button" className="chip" aria-pressed={family === k} onClick={() => setFamily(family === k ? null : k)}>
                {families[k].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="relative hidden flex-1 lg:block">
              <span className="sr-only">Search by the original you love</span>
              <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
              <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search by the original you love" className="field !h-11 !pl-9 w-[280px] text-[13px]" />
            </label>
            <button type="button" className="chip" aria-expanded={drawer} onClick={() => setDrawer((d) => !d)}>
              Filters{activeCount ? ` · ${activeCount}` : ""}
              <Icon name="chevron-down" size={14} />
            </button>
            <label className="chip cursor-pointer">
              <span className="text-ash">Sort:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent text-[12px] font-medium outline-none" aria-label="Sort">
                <option value="bestselling">Bestselling</option>
                <option value="new">Newest</option>
                <option value="price-asc">Price, low to high</option>
                <option value="price-desc">Price, high to low</option>
                <option value="az">A – Z</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {drawer && (
        <div className="drop-enter mt-4 grid gap-6 border border-dune bg-paper p-5 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 text-ash">Mood</p>
            <div className="flex flex-wrap gap-2">
              {moodOrder.map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={mood === k} onClick={() => setMood(mood === k ? null : k)}>
                  {moods[k].label}
                </button>
              ))}
            </div>
          </div>
          {showLineFilter && (
            <div>
              <p className="eyebrow mb-3 text-ash">Line</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["eterna", "Her — eterna"],
                  ["eterno", "Him — eterno"],
                  ["eternal", "Unisex — eternal"],
                ].map(([k, label]) => (
                  <button key={k} type="button" className="chip" aria-pressed={line === k} onClick={() => setLine(line === k ? null : k)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="md:hidden">
            <span className="eyebrow mb-3 block text-ash">Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search by the original you love" className="field text-[13px]" />
          </label>
        </div>
      )}

      {(activeCount > 0 || q) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
          {q && (
            <button type="button" className="chip on" onClick={() => setQ("")}>
              “{q}” <Icon name="close" size={12} />
            </button>
          )}
          {mood && (
            <button type="button" className="chip on" onClick={() => setMood(null)}>
              {moods[mood].label} <Icon name="close" size={12} />
            </button>
          )}
          {line && (
            <button type="button" className="chip on" onClick={() => setLine(null)}>
              {line} <Icon name="close" size={12} />
            </button>
          )}
          <button type="button" className="lnk lnk-quiet ml-2 text-ash" onClick={clear}>
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="display-m">Nothing matches yet.</p>
          <p className="mt-2 text-ash">Try another family, or let the finder choose for you.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" className="btn btn-secondary" onClick={clear}>
              Clear filters
            </button>
            <Link href="/finder" className="btn">
              Take the scent finder
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
          {visible.map((e, i) => (
            <Fragment key={e.handle}>
              <ProductCard entry={e} priority={i < 4} />
              {editorial && i === 7 && (
                <Link
                  href={editorial.href}
                  className={`group col-span-2 flex flex-col justify-between p-8 ${editorial.dark ? "grain bg-sea text-linen" : "bg-sand text-night"}`}
                >
                  <span className={`eyebrow ${editorial.dark ? "text-dune" : "text-ash"}`}>{editorial.eyebrow}</span>
                  <p className="serif mt-6 text-[28px] leading-[1.15] md:text-[34px]">{editorial.quote}</p>
                  <span className="lnk mt-8 self-start">
                    {editorial.cta} <Icon name="arrow-right" size={16} />
                  </span>
                </Link>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="tnum text-[13px] text-ash">
            Showing {visible.length} of {filtered.length}
          </p>
          {shown < filtered.length && (
            <button type="button" className="btn btn-secondary" onClick={() => setShown((s) => s + pageSize)}>
              Show {Math.min(pageSize, filtered.length - shown)} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
