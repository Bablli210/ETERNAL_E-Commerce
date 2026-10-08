import type { DashData, Line, PeriodKey } from "@/lib/dashboard/types";
import { egp, int, isNum, pct, times } from "./format";
import { Gap, Pill, Section, TableBox } from "./ui";

/** The three lines in the template's colours; anything without a line tag is a set or an extra. */
const LINES: Record<Line | "other", { label: string; colour: string }> = {
  eterna: { label: "eterna · for her", colour: "var(--wash)" },
  eterno: { label: "eterno · for him", colour: "var(--bar)" },
  eternal: { label: "eternal · unisex", colour: "var(--muted)" },
  other: { label: "Sets and other", colour: "var(--rule-strong)" },
};

/** What sells: the scents by net sales, and each line's share of them. */
export function Products({
  rows: all,
  days,
  approximate,
  gap,
}: {
  rows: DashData["products"][PeriodKey];
  days: PeriodKey;
  approximate: boolean;
  gap: string | null;
}) {
  // A row that is only a return (no order, money back) stays out of the shares; the return is already in net sales above.
  const rows = (all ?? []).filter((r) => (r.net ?? 0) > 0 || (r.orders ?? 0) > 0);
  const total = rows.reduce((s, r) => s + Math.max(0, r.net ?? 0), 0);
  const byLine = new Map<Line | "other", number>();
  for (const r of rows) byLine.set(r.line ?? "other", (byLine.get(r.line ?? "other") ?? 0) + Math.max(0, r.net ?? 0));
  const lines = [...byLine.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const sub = `Net sales by scent, last ${days} days.${approximate ? " Rebuilt from orders, as Shopify's analytics aren't available." : ""}`;
  return (
    <Section id="h-prod" title="What sells" sub={sub}>
      {gap ? (
        <Gap>{gap}</Gap>
      ) : !rows.length ? (
        <p className="quiet-line">{all ? `No scent sold in the last ${days} full days.` : "Shopify gave no best-seller figures this time."}</p>
      ) : (
        <div className="two">
          <div className="card">
            <TableBox>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Scent</th>
                    <th scope="col" className="r">
                      Bottles
                    </th>
                    <th scope="col" className="r">
                      Orders
                    </th>
                    <th scope="col" className="r">
                      Net sales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 12).map((r) => (
                    <tr key={r.title}>
                      <th scope="row">
                        {r.title}
                        {r.line ? (
                          <span className="small tag">
                            <span className="sep"> · </span>
                            {r.line}
                          </span>
                        ) : null}
                        {total > 0 ? (
                          <span
                            className="share"
                            style={{ width: `${Math.min(100, (Math.max(0, r.net ?? 0) / total) * 100).toFixed(1)}%` }}
                            aria-hidden="true"
                          />
                        ) : null}
                      </th>
                      <td className="r">{int(r.units)}</td>
                      <td className="r">{int(r.orders)}</td>
                      <td className="r">{egp(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableBox>
          </div>
          {total > 0 ? (
            <div className="card">
              <h3>Share of sales by line</h3>
              <div className="split" aria-hidden="true">
                {lines.map(([k, v]) => (
                  <span key={k} style={{ width: `${((v / total) * 100).toFixed(2)}%`, background: LINES[k].colour }} />
                ))}
              </div>
              <ul className="split-key">
                {lines.map(([k, v]) => (
                  <li key={k} className="key">
                    <i className="sw" style={{ background: LINES[k].colour }} aria-hidden="true" />
                    {LINES[k].label} · {pct(v / total)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}

/** Where orders come from: the site a buyer arrived from before checkout. */
export function Sources({ sources, days, gap }: { sources: DashData["sources"]; days: PeriodKey; gap: string | null }) {
  const rows = (sources[days] ?? []).filter((r) => r.orders > 0 || r.net > 0);
  const total = rows.reduce((s, r) => s + Math.max(0, r.orders), 0);
  return (
    <Section id="h-src" title="Where orders come from" sub={`The site a buyer arrived from before checkout, last ${days} days.`}>
      {gap ? (
        <Gap>{gap}</Gap>
      ) : (
        <div className="card">
          {rows.length ? (
            <TableBox>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Arrived from</th>
                    <th scope="col" className="r">
                      Orders
                    </th>
                    <th scope="col" className="r">
                      Share
                    </th>
                    <th scope="col" className="r">
                      Net sales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.source}>
                      <th scope="row">{r.source}</th>
                      <td className="r">{int(r.orders)}</td>
                      <td className="r">{total > 0 ? pct(r.orders / total) : "–"}</td>
                      <td className="r">{egp(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableBox>
          ) : (
            <p className="small">{sources[days] ? `No orders in the last ${days} full days.` : "Shopify gave no order sources this time."}</p>
          )}
          {sources.note ? <p className="small card-foot">{sources.note}</p> : null}
        </div>
      )}
    </Section>
  );
}

/** Meta's campaigns over the last 30 days, each followed by its ad sets. */
export function Campaigns({ campaigns, gap }: { campaigns: DashData["campaigns"]; gap: string | null }) {
  const rows = campaigns.rows;
  if (!gap && !rows.length) return null;
  return (
    <Section
      id="h-camp"
      title="Meta campaigns"
      sub={
        <>
          {campaigns.period}. Ad sets sit under their campaign.
          {gap ? null : <span className="swipe-hint"> Scroll the table sideways for spend and results.</span>}
        </>
      }
    >
      {gap ? (
        <Gap>{gap}</Gap>
      ) : (
        <div className="card">
          <TableBox wide label="Meta campaigns and ad sets">
            <table className="camp">
              <thead>
                <tr>
                  <th scope="col">Campaign / ad set</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="r">
                    Budget a day
                  </th>
                  <th scope="col" className="r">
                    Spend
                  </th>
                  <th scope="col" className="r">
                    Page loads
                  </th>
                  <th scope="col" className="r">
                    Added to bag
                  </th>
                  <th scope="col" className="r">
                    Purchases
                  </th>
                  <th scope="col" className="r">
                    Return
                  </th>
                  <th scope="col" className="r">
                    Cost per purchase
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.level === "adset" ? "sub" : undefined}>
                    <th scope="row">
                      {r.level === "adset" ? <span className="vh">Ad set: </span> : null}
                      {r.name}
                    </th>
                    <td>
                      <Pill tone={r.active ? "active" : "paused"}>{r.status}</Pill>
                    </td>
                    <td className="r">{egp(r.budgetDay)}</td>
                    <td className="r">{egp(r.spend)}</td>
                    <td className="r">{int(r.lpv)}</td>
                    <td className="r">{int(r.atc)}</td>
                    <td className="r">{int(r.purchases)}</td>
                    <td className="r">{times(r.roas)}</td>
                    <td className="r">{egp(r.cpa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableBox>
        </div>
      )}
    </Section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat">
      <dt className="label">{label}</dt>
      <dd>
        <span className="v">{value}</span>
        {note ? <span className="small">{note}</span> : null}
      </dd>
    </div>
  );
}

/** Who buys (Shopify's all-time counts, cities and devices) and who Meta can reach again (its audiences). */
export function Audience({ audience: a, gaps }: { audience: DashData["audience"]; gaps: DashData["gaps"] }) {
  const share = (part: unknown, whole: unknown, of: string) => (isNum(part) && isNum(whole) && whole > 0 ? `${pct(part / whole)} of ${of}` : undefined);
  return (
    <Section id="h-aud" title="Who buys, and who we can reach again" sub="Customer counts are all-time, from Shopify.">
      {gaps.shopify ? (
        <Gap>{gaps.shopify}</Gap>
      ) : (
        <div className="card">
          <dl className="stats">
            <Stat label="Customers" value={int(a.customers)} />
            <Stat label="Have ordered" value={int(a.buyers)} />
            <Stat label="Ordered twice or more" value={int(a.repeatBuyers)} note={share(a.repeatBuyers, a.buyers, "buyers")} />
            <Stat label="Email subscribers" value={int(a.emailSubscribed)} note={share(a.emailSubscribed, a.customers, "customers")} />
            <Stat label="SMS subscribers" value={int(a.smsSubscribed)} />
          </dl>
        </div>
      )}
      <div className="two">
        <div className="card">
          <h3>Meta audiences ready for ads</h3>
          {gaps.audiences ? (
            <Gap className="in-card">{gaps.audiences}</Gap>
          ) : (
            <TableBox>
              <table className="card-table">
                <thead>
                  <tr>
                    <th scope="col">Audience</th>
                    <th scope="col" className="r">
                      People
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {a.metaAudiences.length ? (
                    a.metaAudiences.map((x) => (
                      <tr key={x.name}>
                        <th scope="row">
                          {x.name}
                          {x.kind ? (
                            <span className="small tag">
                              <span className="sep"> · </span>
                              {x.kind}
                            </span>
                          ) : null}
                        </th>
                        <td className="r">{x.size ?? "–"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="small">
                        No audiences yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableBox>
          )}
        </div>
        {gaps.shopify ? null : (
          <div className="card">
            <h3>Orders by city · last 90 days</h3>
            {a.cities.length ? (
              <TableBox>
                <table className="card-table">
                  <thead>
                    <tr>
                      <th scope="col">City</th>
                      <th scope="col" className="r">
                        Orders
                      </th>
                      <th scope="col" className="r">
                        Net sales
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.cities.map((x) => (
                      <tr key={x.name}>
                        <th scope="row">{x.name}</th>
                        <td className="r">{int(x.orders)}</td>
                        <td className="r">{egp(x.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableBox>
            ) : (
              <p className="small card-sub">Shopify gave no city figures this time.</p>
            )}
            {a.devices.length ? (
              <p className="small card-foot">
                Checkouts by device: {a.devices.map((d) => `${d.name} ${int(d.completed)} of ${int(d.sessions)} visits`).join(" · ")}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </Section>
  );
}
