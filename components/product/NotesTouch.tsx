"use client";

import Image from "next/image";
import { useState } from "react";
import { track } from "@/lib/client/analytics";

export type TouchNote = { name: string; tier: "Top" | "Heart" | "Base"; at: readonly [number, number] | null; line: string | null };

const TIERS = ["Top", "Heart", "Base"] as const;
const WHEN = { Top: "Top note · the first 15 minutes", Heart: "Heart note · the next few hours", Base: "Base note · what stays on skin" } as const;

/**
 * "How it smells", Notes you can touch: the notes sculpture with a dot on each
 * ingredient it shows. A dot or a chip in the pyramid below picks a note, and
 * the caption says what it smells like and when it arrives. Notes the photo
 * does not show keep a dashed chip and no dot. Starts on the first pictured
 * note, so the page explains itself before the first tap.
 */
export function NotesTouch({ handle, title, src, notes }: { handle: string; title: string; src: string; notes: TouchNote[] }) {
  const first = Math.max(0, notes.findIndex((n) => n.at));
  const [active, setActive] = useState(first);
  const pick = (i: number) => {
    setActive(i);
    track({ name: "ui", action: "note_tap", label: `${handle}:${notes[i].name}` });
  };
  const n = notes[active];
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start lg:gap-16">
      <div className="notes-touch relative aspect-[4/5] w-full overflow-hidden bg-sand">
        <Image src={src} alt={`${title} among its notes`} fill sizes="(min-width: 768px) 45vw, calc(100vw - 40px)" className="object-cover" />
        {notes.map((x, i) =>
          x.at ? (
            <button
              key={x.name}
              type="button"
              className="note-dot"
              style={{ left: `${x.at[0]}%`, top: `${x.at[1]}%` }}
              aria-pressed={i === active}
              aria-label={`${x.name}, ${x.tier.toLowerCase()} note`}
              onClick={() => pick(i)}
            />
          ) : null,
        )}
        <div className="note-caption" aria-live="polite">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-dune uppercase">
            {WHEN[n.tier]}
            {n.at ? "" : " · not in the photo"}
          </span>
          <span className="serif text-[26px] font-semibold leading-[1.05]">{n.name}</span>
          {n.line && <span className="text-[14px] leading-snug">{n.line}</span>}
        </div>
      </div>
      <div className="grid gap-5">
        <p className="text-[14px] text-ash">Tap a note in the photo, or below, to see what it brings.</p>
        {TIERS.map((t) => {
          const row = notes.map((x, i) => [x, i] as const).filter(([x]) => x.tier === t);
          if (!row.length) return null;
          return (
            <div key={t} className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3 border-t border-dune pt-4">
              <p className="pt-2.5 text-[12px] font-semibold tracking-[0.08em] text-gold-text uppercase">{t}</p>
              <div className="flex flex-wrap gap-2">
                {row.map(([x, i]) => (
                  <button key={x.name} type="button" className={`note-chip ${x.at ? "" : "note-chip-off"}`} aria-pressed={i === active} onClick={() => pick(i)}>
                    {x.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
