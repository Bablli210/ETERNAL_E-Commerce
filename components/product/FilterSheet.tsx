"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { useModal } from "@/components/chrome/useModal";
import { Icon } from "@/components/ui/Icon";

export type FilterOption = { key: string; label: string; count?: number; active: boolean; onToggle: () => void };
export type FilterGroup = { title: string; options: FilterOption[] };

/**
 * The filter and sort sheet: rises from the bottom on a phone, where the
 * thumb is. The grid behind it updates as chips are tapped; the button at the
 * foot names how many scents that leaves. useModal does the modal's
 * housekeeping, as for the menu and search: the page behind is locked, Tab
 * wraps inside the sheet, and focus returns to the button that opened it.
 */
export function FilterSheet({ groups, count, canClear, onClear, onShow, onClose }: { groups: FilterGroup[]; count: number; canClear: boolean; onClear: () => void; onShow: () => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal(dialogRef, closeRef);

  const onEscape = useEffectEvent((e: KeyboardEvent) => e.key === "Escape" && onClose());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onEscape(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title">
      {/* A tap outside closes the sheet. Not a button: Tab and the screen reader stay on the sheet's own controls, and Escape and Close do the same. */}
      <div aria-hidden="true" onClick={onClose} className="fade-enter absolute inset-0 bg-night/40" />
      <div className="sheet-enter absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col bg-paper text-night lg:inset-y-0 lg:left-0 lg:right-auto lg:max-h-none lg:w-[400px]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-dune pl-5 pr-2">
          <h2 id="filter-sheet-title" className="serif text-[26px]">
            Filter &amp; sort
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center hover:text-sea">
            <Icon name="close" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-5 py-6">
          {groups
            .filter((g) => g.options.length > 0)
            .map((g) => (
              <fieldset key={g.title}>
                <legend className="eyebrow mb-3 text-[12px] text-ash">{g.title}</legend>
                <div className="flex flex-wrap gap-2">
                  {g.options.map((o) => (
                    <button key={o.key} type="button" className="chip h-11 text-[13px]" aria-pressed={o.active} onClick={o.onToggle}>
                      {o.label}
                      {o.count !== undefined && <span className={`tnum ${o.active ? "text-linen/70" : "text-ash"}`}>{o.count}</span>}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
        </div>
        <footer className="flex shrink-0 items-center gap-3 border-t border-dune px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          <button type="button" className="btn btn-secondary btn-sm h-12 px-5" onClick={onClear} disabled={!canClear}>
            Clear
          </button>
          <button type="button" className="btn h-12 flex-1" onClick={onShow}>
            Show {count} {count === 1 ? "scent" : "scents"}
          </button>
        </footer>
      </div>
    </div>
  );
}
