import type { DashData, Num, PeriodKey } from "@/lib/dashboard/types";
import { egp, int, isNum, pct, rangeText, times, two } from "./format";
import { Gap, Section } from "./ui";

type Day = DashData["daily"]["days"][number];
type Period = DashData["periods"][PeriodKey];

/**
 * The period's day-by-day line under a tile, in the quiet colour with the
 * last day marked. Decoration only (the tile's figure says it), so hidden
 * from screen readers. Unknown days leave a break instead of falling to 0.
 */
export function Sparkline({ values }: { values: Num[] }) {
  const known = values.filter(isNum);
  if (known.length < 2) return null;
  const w = 120;
  const h = 28;
  const lo = Math.min(0, ...known);
  const hi = Math.max(1, ...known);
  const x = (i: number) => ((i / (values.length - 1)) * w).toFixed(1);
  const y = (v: number) => (h - 3 - ((v - lo) / (hi - lo)) * (h - 6)).toFixed(1);
  const runs: string[] = [];
  let run: string[] = [];
  values.forEach((v, i) => {
    if (isNum(v)) {
      run.push(`${x(i)},${y(v)}`);
    } else if (run.length) {
      runs.push(run.join(" "));
      run = [];
    }
  });
  if (run.length) runs.push(run.join(" "));
  const lastIndex = values.findLastIndex(isNum);
  const last = values[lastIndex] as number;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {runs.map((pts) => (
        <polyline key={pts} points={pts} fill="none" stroke="var(--muted)" strokeWidth="1.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      ))}
      {/* A zero-length round-capped stroke: a dot that stays round however the line is stretched. */}
      <path d={`M${x(lastIndex)} ${y(last)}h0`} stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * The change against the previous period, as the end of a sentence. The
 * arrow and the word carry the direction, the colour only repeats it.
 * `inverse`: lower is better (cost per purchase), so a rise shows as bad.
 */
export function Delta({ now, before, days, inverse = false }: { now: Num | undefined; before: Num | undefined; days: PeriodKey; inverse?: boolean }) {
  if (!isNum(now)) return <>no figure for these days</>;
  if (!isNum(before)) return <>no earlier figure</>;
  if (before === 0) return <>{now === 0 ? "same as the period before" : "none the period before"}</>;
  const change = (now - before) / Math.abs(before);
  const dir = change > 0.005 ? "up" : change < -0.005 ? "down" : "flat";
  const size = Math.round(Math.abs(change) * 100);
  return (
    <>
      <span className={`chg ${dir}${inverse ? " inverse" : ""}`}>
        <span aria-hidden="true">{dir === "up" ? "▲" : dir === "down" ? "▼" : "■"} </span>
        <span className="vh">{dir === "up" ? "up " : dir === "down" ? "down " : "about level, "}</span>
        {size}%
      </span>{" "}
      vs previous {days} days
    </>
  );
}

function Tile({ label, value, children, spark }: { label: string; value: string; children: React.ReactNode; spark?: Num[] }) {
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <span className="v">{value}</span>
      <span className="d">{children}</span>
      {spark ? <Sparkline values={spark} /> : null}
    </div>
  );
}

/**
 * The headline tiles for the chosen period: the shop's four from Shopify,
 * advertising's four from Meta. A source that could not be read shows why
 * in place of its tiles.
 */
export function Kpis({ p, full, days, gaps }: { p: Period | undefined; full: Day[]; days: PeriodKey; gaps: DashData["gaps"] }) {
  const s = p?.sales;
  const prev = p?.prev;
  const c = p?.customers;
  const a = p?.ads;
  const ap = p?.adsPrev;
  const range = rangeText(p?.range ?? (full.length ? { from: full[0].d, to: full[full.length - 1].d } : null));
  // Meta's figures can cover other days than the heading (an older read kept through a Meta outage, an ad account in another time zone).
  const adsRange = p?.adsRange && p.range && (p.adsRange.from !== p.range.from || p.adsRange.to !== p.range.to) ? rangeText(p.adsRange) : null;
  const series = (k: "net" | "orders" | "spend" | "purchases") => full.map((d) => d[k]);
  const sub = (
    <>
      {range ? `${range}, full days to yesterday. ` : "Full days to yesterday. "}
      Net sales are after discounts and returns; advertising figures are what Meta credits to its ads.
      {p?.approximate ? " Shopify's analytics aren't available, so the shop's figures are rebuilt from orders: a return counts on the day of its order." : ""}
    </>
  );
  return (
    <Section id="h-kpi" title={`The last ${days} days`} sub={sub}>
      <div className="kgroup">
        <p className="label">Shop · Shopify</p>
        {gaps.shopify ? (
          <Gap>{gaps.shopify}</Gap>
        ) : (
          <div className="kpis">
            <Tile label="Net sales" value={egp(s?.net)} spark={series("net")}>
              <Delta now={s?.net} before={prev?.net} days={days} />
            </Tile>
            <Tile label="Orders" value={int(s?.orders)} spark={series("orders")}>
              <Delta now={s?.orders} before={prev?.orders} days={days} />
            </Tile>
            <Tile label="Average order" value={egp(s?.aov)}>
              <Delta now={s?.aov} before={prev?.aov} days={days} />
            </Tile>
            <Tile label="Returning customers" value={pct(c?.returningRate)}>
              {c?.customers === 0
                ? "no customers in these days"
                : isNum(c?.customers) && isNum(c?.returning)
                  ? `${int(c.returning)} of ${int(c.customers)} customers ordered before`
                  : "no figure for these days"}
            </Tile>
          </div>
        )}
      </div>
      <div className="kgroup">
        <p className="label">Advertising · Meta</p>
        {!gaps.ads && adsRange && <p className="dash-hint">These figures cover {adsRange}.</p>}
        {gaps.ads ? (
          <Gap>{gaps.ads}</Gap>
        ) : (
          <div className="kpis">
            <Tile label="Ad spend" value={egp(a?.spend)} spark={series("spend")}>
              <Delta now={a?.spend} before={ap?.spend} days={days} />
            </Tile>
            <Tile label="Purchases from ads" value={int(a?.purchases)} spark={series("purchases")}>
              <Delta now={a?.purchases} before={ap?.purchases} days={days} />
            </Tile>
            <Tile label="Return on ad spend" value={times(a?.roas)}>
              {isNum(a?.roas) ? `EGP ${two(a.roas)} back per EGP 1 · ` : ""}
              <Delta now={a?.roas} before={ap?.roas} days={days} />
            </Tile>
            <Tile label="Cost per purchase" value={egp(a?.cpa)}>
              <Delta now={a?.cpa} before={ap?.cpa} days={days} inverse />
            </Tile>
          </div>
        )}
      </div>
    </Section>
  );
}
