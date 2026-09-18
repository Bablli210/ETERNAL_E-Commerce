"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { searchIndex } from "@/lib/search";
import { ProductImage } from "@/components/product/ProductImage";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";

export type TaleIndexEntry = { slug: string; title: string; handle: string; line: string };

export function SearchOverlay({ index, taleIndex, popular, onClose }: { index: ScentIndexEntry[]; taleIndex: TaleIndexEntry[]; popular: ScentIndexEntry[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => inputRef.current?.focus(), []);

  const results = useMemo(() => searchIndex(index, q, 5), [index, q]);
  const tales = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return taleIndex.slice(0, 2);
    return taleIndex.filter((x) => x.title.toLowerCase().includes(t) || x.handle.includes(t)).slice(0, 3);
  }, [taleIndex, q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <div className="fade-enter absolute inset-x-0 top-full border-b border-dune bg-paper text-night">
      <div className="wrap py-6 lg:py-8">
        <form onSubmit={submit} role="search" className="flex items-center gap-3 border-b border-night pb-3">
          <Icon name="search" size={22} className="shrink-0 text-ash" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder='Search scents or the original you love — e.g. "Blue Talisman"'
            aria-label="Search"
            className="serif w-full bg-transparent text-[24px] outline-none placeholder:text-stone md:text-[32px]"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center hover:text-sea">
            <Icon name="close" />
          </button>
        </form>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow className="mb-3 block">{q.trim().length >= 2 ? `Scents (${results.length})` : "Start typing"}</Eyebrow>
            {q.trim().length >= 2 && results.length === 0 && <p className="text-ash">Nothing by that name yet. Try a note, a family, or the original you know.</p>}
            <ul className="flex flex-col divide-y divide-dune">
              {results.map(({ entry, matchedInspiredBy }) => (
                <li key={entry.handle}>
                  <Link href={`/products/${entry.handle}`} onClick={onClose} className="group flex items-center gap-4 py-3">
                    <ProductImage src={entry.image} alt="" world={entry.world} sizes="56px" className="h-[68px] w-[56px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="display-m !text-[20px] group-hover:text-sea">{entry.title}</p>
                      <p className="truncate text-[12px] text-ash">
                        {entry.lineLabel ? `${entry.lineLabel} · ` : ""}
                        {entry.inspiredBy ? (
                          <>
                            Inspired by <span className={matchedInspiredBy ? "font-semibold text-night" : ""}>{entry.inspiredBy}</span>
                          </>
                        ) : (
                          entry.notesShort.join(", ")
                        )}
                      </p>
                    </div>
                    <Price money={entry.price} className="text-[13px] font-medium" />
                  </Link>
                </li>
              ))}
            </ul>
            {q.trim().length >= 2 && (
              <Link href={`/shop?q=${encodeURIComponent(q.trim())}`} onClick={onClose} className="lnk mt-4">
                See all results <Icon name="arrow-right" size={16} />
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-8">
            <div>
              <Eyebrow className="mb-3 block">Popular right now</Eyebrow>
              <ul className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <li key={p.handle}>
                    <Link href={`/products/${p.handle}`} onClick={onClose} className="chip">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Eyebrow className="mb-3 block">Tales ({tales.length})</Eyebrow>
              <ul className="flex flex-col gap-2">
                {tales.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/tales/${t.slug}`} onClick={onClose} className="serif text-[18px] hover:text-sea">
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-dune pt-5">
              <p className="text-[13px] text-ash">Not sure what to search?</p>
              <Link href="/finder" onClick={onClose} className="lnk mt-1">
                Take the scent finder <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
