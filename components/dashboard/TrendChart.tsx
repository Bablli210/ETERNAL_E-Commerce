import type { DashData, PeriodKey } from "@/lib/dashboard/types";
import { compact, egp, int, isNum, plural, rangeText, weekday, day as dayText } from "./format";
import { TrendTip } from "./TrendTip";
import { Gap, Section } from "./ui";

type Day = DashData["daily"]["days"][number];

/** A round step for about four gridlines: 1, 2, 2.5 or 5 times a power of ten. */
function niceStep(span: number) {
  const p = 10 ** Math.floor(Math.log10(span));
  const f = span / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

/** Which days get a date under the axis: the latest always, then every `every` days back. */
function labelled(n: number, most: number) {
  const every = Math.max(1, Math.ceil(n / most));
  const out = new Set<number>();
  for (let i = n - 1; i >= 0; i -= every) out.add(i);
  return out;
}

/** The period's total over the days that were read, and how many those were: days not read are left out, never counted as 0. */
const sum = (rows: Day[], k: "net" | "spend") => {
  const known = rows.map((r) => r[k]).filter(isNum);
  return known.length ? { v: known.reduce((a, b) => a + b, 0), days: known.length } : null;
};

/**
 * Net sales (bars) and Meta ad spend (line) for each full day of the
 * period, on one money axis. The chart is HTML with an SVG line laid over
 * it, sized by CSS, so its 11 px axis text stays 11 px at every width and no
 * script has to measure anything. The phone and desktop variants differ in
 * height and in how many dates the axis names, switched by media queries in
 * dashboard.css. TrendTip adds the hover, touch and keyboard readout; a
 * visually hidden table gives screen readers every figure.
 */
export function TrendChart({ rows, days, gaps }: { rows: Day[]; days: PeriodKey; gaps: DashData["gaps"] }) {
  const sales = !gaps.shopify && rows.some((r) => isNum(r.net));
  const spend = !gaps.ads && rows.some((r) => isNum(r.spend));
  if (rows.length < 2) return null;
  const range = rangeText({ from: rows[0].d, to: rows[rows.length - 1].d });
  const totNet = sum(rows, "net");
  const totSpend = sum(rows, "spend");
  const total = (t: { v: number; days: number } | null) => (t && t.days < rows.length ? `${egp(t.v)} over ${t.days} of ${rows.length} days` : egp(t?.v));
  const missing = [!sales && gaps.shopify, !spend && (gaps.ads ?? gaps.adsDaily)].filter((g): g is string => Boolean(g));

  if (!sales && !spend)
    return (
      <Section id="h-trend" title="Sales and ad spend, day by day">
        <Gap>{missing.length ? missing.join(" ") : "There are no daily figures for these days yet."}</Gap>
      </Section>
    );

  const n = rows.length;
  const values = rows.flatMap((r) => [sales ? r.net : null, spend ? r.spend : null]).filter(isNum);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  // At least a pound a step: a finer one only comes from days at or near zero (a week with no sales and no ad spend), and the axis would print "0" twice.
  const step = Math.max(1, niceStep((high - low || 1) / 4));
  const lo = Math.floor(low / step) * step;
  const hi = Math.max(Math.ceil(high / step) * step, lo + step);
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const zero = pos(0);
  const ticks: number[] = [];
  // `|| 0`: a day figure of -0 would make the bottom tick -0, printed "-0".
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Math.round(t * 100) / 100 || 0);
  const onPhone = labelled(n, 5);
  const onDesktop = labelled(n, 8);

  // The spend line breaks where a day is unknown rather than dropping to zero.
  const runs: string[] = [];
  let run: string[] = [];
  rows.forEach((r, i) => {
    if (spend && isNum(r.spend)) {
      run.push(`${i + 0.5},${((1 - pos(r.spend) / 100) * 1000).toFixed(1)}`);
    } else if (run.length) {
      runs.push(run.join(" "));
      run = [];
    }
  });
  if (run.length) runs.push(run.join(" "));

  const legend = (
    <span className="legend">
      {sales ? (
        <span className="key">
          <i className="sw bar" aria-hidden="true" />
          Net sales · {total(totNet)}
        </span>
      ) : null}
      {spend ? (
        <span className="key">
          <i className="sw line" aria-hidden="true" />
          Meta ad spend · {total(totSpend)}
        </span>
      ) : null}
    </span>
  );
  const what = [sales ? "bars show net sales" : "", spend ? `${sales ? "the line" : "a line"} shows Meta ad spend` : ""].filter(Boolean).join(" and ");
  const alt = `The last ${days} days, ${range}, day by day: ${what}. ${sales ? `Net sales ${total(totNet)} in all. ` : ""}${spend ? `Ad spend ${total(totSpend)} in all. ` : ""}Each day's figures are in the table that follows.`;

  return (
    <Section id="h-trend" title="Sales and ad spend, day by day" sub={legend}>
      <div className="card chart">
        <div className="trend">
          <div className="trend-y" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} style={{ bottom: `${pos(t)}%` }}>
                {compact(t)}
              </span>
            ))}
          </div>
          <TrendTip n={n} label={`Sales and ad spend, the last ${days} days.`}>
            <div className="trend-plot" role="img" aria-label={alt}>
              {ticks.map((t) => (
                <span key={t} className={t === 0 ? "gl zero" : "gl"} style={{ bottom: `${pos(t)}%` }} />
              ))}
              <div className="trend-cols">
                {rows.map((r, i) => {
                  const v = sales ? r.net : null;
                  return (
                    <div
                      key={r.d}
                      className="tc"
                      data-i={i}
                      data-day={weekday(r.d)}
                      data-net={sales ? egp(r.net) : undefined}
                      data-orders={sales ? (isNum(r.orders) ? plural(r.orders, "order") : "orders unknown") : undefined}
                      data-spend={spend ? egp(r.spend) : undefined}
                      data-purchases={spend ? (isNum(r.purchases) ? plural(r.purchases, "ad purchase") : "ad purchases unknown") : undefined}
                    >
                      {isNum(v) && v !== 0 ? (
                        <span
                          className={v < 0 ? "tb neg" : "tb"}
                          style={v < 0 ? { bottom: `${pos(v)}%`, height: `${zero - pos(v)}%` } : { bottom: `${zero}%`, height: `${pos(v) - zero}%` }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {runs.length ? (
                <svg className="trend-line" viewBox={`0 0 ${n} 1000`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  {runs.map((pts) => (
                    <g key={pts}>
                      <polyline className="halo" points={pts} />
                      <polyline points={pts} />
                    </g>
                  ))}
                </svg>
              ) : null}
            </div>
            <div className="trend-x" aria-hidden="true">
              {rows.map((r, i) =>
                onPhone.has(i) || onDesktop.has(i) ? (
                  <span key={r.d} className={`xl${onPhone.has(i) ? " s" : ""}${onDesktop.has(i) ? " l" : ""}`} style={{ left: `${((i + 0.5) / n) * 100}%` }}>
                    {dayText(r.d)}
                  </span>
                ) : null,
              )}
            </div>
          </TrendTip>
        </div>
        {/* A table keeps its content width, so the hiding box sits around it, not on it. */}
        <div className="vh">
          <table>
            <caption>Net sales and Meta ad spend per day, {range}</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                {sales ? (
                  <>
                    <th scope="col">Net sales</th>
                    <th scope="col">Orders</th>
                  </>
                ) : null}
                {spend ? (
                  <>
                    <th scope="col">Ad spend</th>
                    <th scope="col">Purchases Meta credits</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.d}>
                  <th scope="row">{weekday(r.d)}</th>
                  {sales ? (
                    <>
                      <td>{egp(r.net)}</td>
                      <td>{int(r.orders)}</td>
                    </>
                  ) : null}
                  {spend ? (
                    <>
                      <td>{egp(r.spend)}</td>
                      <td>{int(r.purchases)}</td>
                    </>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {missing.length ? <Gap>{missing.join(" ")}</Gap> : null}
    </Section>
  );
}
