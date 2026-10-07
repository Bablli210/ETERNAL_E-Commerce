"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Tip = { i: number; byKey: boolean; day: string; net?: string; orders?: string; spend?: string; purchases?: string };

/**
 * The day-by-day chart's readout (TrendChart.tsx renders the chart on the
 * server). The figures come from the data-* attributes on each day's column,
 * already formatted, so nothing is computed twice. A mouse shows the day
 * under the pointer; a finger taps or slides sideways (vertical swipes still
 * scroll the page) and the readout stays until a tap elsewhere; the keyboard
 * focuses the chart and steps through the days with the arrow keys, with
 * each day also read out to screen readers.
 */
export function TrendTip({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const tipEl = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const columns = () => box.current?.querySelector<HTMLElement>(".trend-cols") ?? null;

  const show = (i: number, byKey: boolean) => {
    const col = columns()?.children[i];
    if (!(col instanceof HTMLElement)) return;
    const d = col.dataset;
    setTip((t) =>
      t && t.i === i && t.byKey === byKey ? t : { i, byKey, day: d.day ?? "", net: d.net, orders: d.orders, spend: d.spend, purchases: d.purchases },
    );
  };

  const fromPointer = (e: React.PointerEvent) => {
    const cols = columns();
    if (!cols) return;
    const r = cols.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || r.width === 0) return;
    show(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))), false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = tip?.i ?? n;
    const next =
      e.key === "ArrowRight"
        ? Math.min(n - 1, tip ? at + 1 : n - 1)
        : e.key === "ArrowLeft"
          ? Math.max(0, at - 1)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : null;
    if (e.key === "Escape") setTip(null);
    if (next === null) return;
    e.preventDefault();
    show(next, true);
  };

  // Place the readout beside the day, on the side with more room, never past the chart's edges.
  useLayoutEffect(() => {
    const el = tipEl.current;
    const b = box.current;
    const cols = b?.querySelector<HTMLElement>(".trend-cols");
    if (!tip || !el || !b || !cols) return;
    const br = b.getBoundingClientRect();
    const cr = cols.getBoundingClientRect();
    const cx = cr.left - br.left + ((tip.i + 0.5) / n) * cr.width;
    const w = el.offsetWidth;
    const left = cx < br.width / 2 ? cx + 14 : cx - 14 - w;
    el.style.left = `${Math.max(0, Math.min(br.width - w, left))}px`;
  }, [tip, n]);

  // A touch readout stays put after the finger lifts; a tap anywhere else closes it.
  useEffect(() => {
    if (!tip) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setTip(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [tip]);

  const said = tip?.byKey
    ? [tip.day, tip.net !== undefined ? `net sales ${tip.net}, ${tip.orders}` : "", tip.spend !== undefined ? `ad spend ${tip.spend}, ${tip.purchases}` : ""]
        .filter(Boolean)
        .join("; ")
    : "";

  return (
    <div
      ref={box}
      className="trend-live"
      role="group"
      tabIndex={0}
      aria-label={`${label} Use the left and right arrow keys to read each day.`}
      onPointerDown={fromPointer}
      onPointerMove={fromPointer}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setTip(null);
      }}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        if (e.target === e.currentTarget && e.currentTarget.matches(":focus-visible") && !tip) show(n - 1, true);
      }}
      onBlur={() => setTip(null)}
    >
      {tip ? <span className="trend-band" style={{ left: `${(tip.i / n) * 100}%`, width: `${100 / n}%` }} aria-hidden="true" /> : null}
      {children}
      <div ref={tipEl} className="trend-tip" hidden={!tip} aria-hidden="true">
        {tip ? (
          <>
            <strong>{tip.day}</strong>
            {tip.net !== undefined ? (
              <span>
                <i className="k bar" />
                <b>{tip.net}</b> net sales · {tip.orders}
              </span>
            ) : null}
            {tip.spend !== undefined ? (
              <span>
                <i className="k line" />
                <b>{tip.spend}</b> ad spend · {tip.purchases}
              </span>
            ) : null}
          </>
        ) : null}
      </div>
      <p className="vh" aria-live="polite">
        {said}
      </p>
    </div>
  );
}
