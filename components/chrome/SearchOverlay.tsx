"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type FormEvent, type MouseEvent } from "react";
import type { ScentIndexEntry } from "@/lib/catalogue";
import { searchIndex } from "@/lib/search";
import { track } from "@/lib/client/analytics";
import { InspiredBy } from "@/components/product/InspiredBy";
import { LineLabel } from "@/components/product/LineLabel";
import { ProductImage } from "@/components/product/ProductImage";
import { Eyebrow, Price } from "@/components/ui/Primitives";
import { Icon } from "@/components/ui/Icon";
import { useModal } from "./useModal";
import { WhatsAppLink } from "./WhatsAppLink";

export type TaleIndexEntry = { slug: string; title: string; handle: string; line: string };

/** Rows in the panel; the heading counts every match, and "See all" opens the full list. */
const ROWS = 5;
/** A pause this long after typing counts as a search: on a phone most people tap a row or give up rather than press Enter. */
const IDLE_MS = 1000;

/**
 * The height the visitor can actually see. With the keyboard up it is the
 * visual viewport, so the panel ends above the keyboard and every row can be
 * scrolled into view.
 */
const subscribe = (cb: () => void) => {
  const vv = window.visualViewport;
  vv?.addEventListener("resize", cb);
  return () => vv?.removeEventListener("resize", cb);
};
const visibleHeight = () => Math.round(window.visualViewport?.height ?? window.innerHeight);

/** One search event per distinct term, with how many scents it found (0 is the list of originals to add). */
function report(sent: Set<string>, term: string, results: number) {
  const key = term.toLowerCase();
  if (sent.has(key)) return;
  sent.add(key);
  track({ name: "search", term, results });
}

/** The search hint offers originals only once enough scents name one; until then it would promise what search can't find. */
const ORIGINALS_FOR_HINT = 10;

/** A scent row: the original it is inspired by gets a line of its own, since it is what most visitors search for. */
function ResultRow({ entry, matchedInspiredBy = false, onPick }: { entry: ScentIndexEntry; matchedInspiredBy?: boolean; onPick: (e: MouseEvent) => void }) {
  const rest = entry.inspiredBy ? null : entry.notesShort.join(", ") || entry.bottle?.label || null;
  return (
    <li>
      <Link href={`/products/${entry.handle}`} replace onClick={onPick} className="group flex items-center gap-3 py-3">
        <ProductImage src={entry.image} alt="" world={entry.world} sizes="56px" className="h-14 w-14 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="display-m block truncate !text-[20px] group-hover:text-sea">{entry.title}</span>
          {entry.inspiredBy && (
            <InspiredBy as="span" name={entry.inspiredBy} className="block truncate text-[12px] text-ash" nameClassName={matchedInspiredBy ? "underline decoration-gold underline-offset-2" : ""} />
          )}
          {(entry.line || rest) && (
            <span className="block truncate text-[12px] text-ash">
              {entry.line && <LineLabel line={entry.line} />}
              {entry.line && rest ? " · " : ""}
              {rest}
            </span>
          )}
        </span>
        <Price money={entry.price} className="shrink-0 whitespace-nowrap text-[14px] font-medium" />
      </Link>
    </li>
  );
}

export function SearchOverlay({ index, taleIndex, popular, onClose }: { index: ScentIndexEntry[]; taleIndex: TaleIndexEntry[]; popular: ScentIndexEntry[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const term = q.trim();
  const typed = term.length >= 2;
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const sent = useRef(new Set<string>());
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const height = useSyncExternalStore(subscribe, visibleHeight, () => null);
  // Back closes the panel instead of leaving the site; links take over its history entry.
  const { follow, release } = useModal(panel, input, onClose);

  const all = useMemo(() => searchIndex(index, term, index.length), [index, term]);
  const none = typed && all.length === 0;
  const tales = useMemo(() => {
    const t = term.toLowerCase();
    return t.length < 2 ? [] : taleIndex.filter((x) => x.title.toLowerCase().includes(t) || x.handle.includes(t)).slice(0, 3);
  }, [taleIndex, term]);
  // The hint names a real original from the catalogue, never an invented one, and only once enough scents name one.
  const example = useMemo(() => {
    const originals = index.filter((e) => e.inspiredBy);
    return originals.length >= ORIGINALS_FOR_HINT ? originals[0].inspiredBy : null;
  }, [index]);
  const resultsUrl = `/shop?q=${encodeURIComponent(term)}`;

  useEffect(() => {
    router.prefetch("/shop");
  }, [router]);

  useEffect(() => {
    if (term.length < 3) return;
    const t = window.setTimeout(() => report(sent.current, term, all.length), IDLE_MS);
    return () => window.clearTimeout(t);
  }, [term, all.length]);

  // The panel stays open, its button showing progress, until the results page has rendered: on a slow connection a search that closes at once looks ignored.
  useEffect(() => {
    if (submitted && !pending) onClose();
  }, [submitted, pending, onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!term) return input.current?.focus();
    report(sent.current, term, all.length);
    input.current?.blur();
    setSubmitted(true);
    // The results take over the panel's history entry, so Back from them returns to the page the search was opened on.
    release();
    startTransition(() => router.replace(resultsUrl));
  };

  const pick = (entry: ScentIndexEntry, i: number, list: string) => (e: MouseEvent) => {
    track({ name: "select_item", list, index: i, item: { productId: entry.productId, variantId: entry.bottle?.numericId ?? entry.productId, name: entry.title, price: parseFloat(entry.price.amount), variant: entry.bottle?.label, category: entry.lineLabel } });
    follow(`/products/${entry.handle}`)(e);
  };

  const starters = (
    <div>
      <Eyebrow className="mb-1 block">Where to start</Eyebrow>
      <ul className="flex flex-col divide-y divide-dune">
        {popular.map((p, i) => (
          <ResultRow key={p.handle} entry={p} onPick={pick(p, i, "search_start")} />
        ))}
      </ul>
    </div>
  );

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fade-enter absolute inset-x-0 top-full max-h-[calc(100dvh-var(--chrome-h,var(--header-h)))] overflow-y-auto overscroll-contain border-b border-dune bg-paper text-night"
      style={height ? { maxHeight: `calc(${height}px - var(--chrome-h, var(--header-h)))` } : undefined}
    >
      <div className="wrap pt-4 pb-8 lg:py-8">
        <form onSubmit={submit} role="search" className="flex items-center gap-2 border-b border-night pb-2 lg:gap-3">
          <Icon name="search" size={22} className="hidden shrink-0 text-ash lg:block" />
          <label htmlFor="site-search" className="sr-only">
            Search scents
          </label>
          <input
            id="site-search"
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder={example ? "Scent, note or original" : "Scent or note"}
            className="serif min-w-0 flex-1 bg-transparent text-[22px] outline-none placeholder:text-ash md:text-[32px] [&::-webkit-search-cancel-button]:appearance-none"
          />
          <button type="submit" aria-label="Search" className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 bg-night px-3 text-[13px] font-semibold tracking-[0.04em] text-linen hover:bg-sea">
            {pending ? (
              <span className="dots" aria-hidden="true">
                <i>.</i>
                <i>.</i>
                <i>.</i>
              </span>
            ) : (
              <>
                <span className="hidden md:inline">Search</span>
                <Icon name="arrow-right" size={18} />
              </>
            )}
          </button>
          <button type="button" onClick={onClose} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center hover:text-sea">
            <Icon name="close" />
          </button>
        </form>

        {!typed && <p className="mt-2 text-[13px] text-ash">{example ? `Search by the original you know, e.g. ${example}.` : "Search by scent or note."}</p>}
        {typed && all.length > 0 && (
          <Link
            href={resultsUrl}
            replace
            onClick={(e) => {
              // A quick tap here is the clearest search of all: it counts before the idle timer would.
              report(sent.current, term, all.length);
              follow(resultsUrl)(e);
            }}
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold"
          >
            <span className="lnk">
              See all {all.length} {all.length === 1 ? "result" : "results"}
            </span>
            <Icon name="arrow-right" size={16} />
          </Link>
        )}

        <div className="mt-4 grid grid-cols-1 gap-8 lg:mt-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            {!typed && starters}
            {typed && all.length > 0 && (
              <>
                <Eyebrow className="mb-1 block">Scents ({all.length})</Eyebrow>
                <ul className="flex flex-col divide-y divide-dune">
                  {all.slice(0, ROWS).map(({ entry, matchedInspiredBy }, i) => (
                    <ResultRow key={entry.handle} entry={entry} matchedInspiredBy={matchedInspiredBy} onPick={pick(entry, i, "search")} />
                  ))}
                </ul>
              </>
            )}
            {none && (
              <div className="flex flex-col gap-6">
                <div>
                  {/* The term may be an original or a feeling rather than a scent's name, so the miss reads as ours, with a way on that never depends on WhatsApp. */}
                  <p className="display-m !text-[22px]">We haven’t matched “{term}” yet.</p>
                  <Link href="/finder" replace onClick={follow("/finder")} className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium">
                    <span className="lnk">Find your match in 60 seconds</span>
                    <Icon name="arrow-right" size={16} />
                  </Link>
                  <WhatsAppLink label="search_none" text={`Hello eternal, which of your scents is closest to ${term}?`} className="mt-2 inline-flex min-h-11 items-center gap-2 text-[14px] font-medium">
                    <Icon name="whatsapp" size={18} />
                    <span className="lnk">Ask us which is closest to {term}</span>
                  </WhatsAppLink>
                </div>
                {starters}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-8">
            {tales.length > 0 && (
              <div>
                <Eyebrow className="mb-1 block">Tales</Eyebrow>
                <ul className="flex flex-col">
                  {tales.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/tales/${t.slug}`} replace onClick={follow(`/tales/${t.slug}`)} className="serif flex min-h-11 items-center text-[18px] hover:text-sea">
                        {t.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-dune pt-4">
              <p className="text-[13px] text-ash">Not sure what to search for?</p>
              <Link href="/finder" replace onClick={follow("/finder")} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold">
                <span className="lnk">Find your scent</span>
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
