import type { CheckoutView, DashData, DeliveriesView, Finding, PeriodKey, ProductHealthRow, ShipState, WebsiteView } from "@/lib/dashboard/types";
import { cairoTime, egp, int, isNum, one, pct, plural, rangeText } from "./format";
import { Gap, Pill, Section, TableBox } from "./ui";

/**
 * The sections that answer "what is happening after the click": what to work
 * on, deliveries and the courier, why checkouts are left, how the website
 * itself is doing, and each scent from first look to the customer's door.
 * Every section opens with what its figures say (lib/dashboard/insights.ts),
 * then the figures; a section whose source isn't connected says why.
 */

const LEVEL: Record<Finding["level"], { tone: string; word: string }> = {
  critical: { tone: "critical", word: "Urgent" },
  warning: { tone: "warning", word: "Fix" },
  info: { tone: "neutral", word: "Note" },
  good: { tone: "ok", word: "Good" },
};

/** Findings as the attention list sets them: a word, the title, the figures behind it and what to do. */
export function Findings({ items, empty }: { items: Finding[]; empty?: string }) {
  if (!items.length) return empty ? <p className="quiet-line">{empty}</p> : null;
  return (
    <ul className="attn findings">
      {items.map((f) => (
        <li key={f.title} className="attn-item">
          <Pill tone={LEVEL[f.level].tone}>{LEVEL[f.level].word}</Pill>
          <div>
            <strong>{f.title}</strong>
            <p>{f.evidence}</p>
            {f.fix ? <p className="fix">What to do: {f.fix}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string | null }) {
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

/** Steps as a funnel, each with its share of the step before. Square-root bars keep the late steps visible, as in "From ad to order". */
function Steps({ steps }: { steps: { key: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <ol className="funnel">
      {steps.map((s, i) => {
        const before = i ? steps[i - 1].count : null;
        return (
          <li key={s.key} className="step">
            <span>{s.label}</span>
            <span className="fbar" style={{ width: `${Math.max(0.6, Math.sqrt(s.count / max) * 100).toFixed(1)}%` }} aria-hidden="true" />
            <span className="n">{int(s.count)}</span>
            {i && before ? <span className="rate">{pct(s.count / before)} of the step before</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------ What to work on */

export function WorkOn({ items, any }: { items: Finding[]; any: boolean }) {
  return (
    <Section id="h-work" title="What to work on" sub="Every problem the figures show, most urgent first. Each says what it rests on and what to do.">
      <Findings items={items} empty={any ? "Nothing in deliveries, checkout or the website needs work right now." : "Connect Shopify and GA4 (owner details below) and this list fills itself from the figures."} />
    </Section>
  );
}

/* ------------------------------------------------------------ Deliveries */

const SHIP_WORD: Record<ShipState, string> = { waiting: "Not shipped", in_transit: "In transit", out: "Out for delivery", attempted: "Attempted", delivered: "Delivered", failed: "Failed", cancelled: "Cancelled" };

export function Deliveries({ view, days, gap, bostaGap }: { view: DeliveriesView | null; days: PeriodKey; gap: string | null; bostaGap: string | null }) {
  if (gap || !view)
    return (
      <Section id="h-del" title="Orders on the road">
        <Gap>{gap ?? "Orders could not be read just now."}</Gap>
      </Section>
    );
  const p = view.periods[days];
  const s = view.speed;
  const capped = days === "90";
  return (
    <Section
      id="h-del"
      title="Orders on the road"
      sub={`What happened after checkout: shipped, delivered, paid. ${capped ? "Shopify lets the app read 60 days of orders, so the 90-day figures cover 60." : `Last ${days} full days`}; speed over ${rangeText(view.basis)}.`}
    >
      <Findings items={view.says} />
      <div className="card">
        <dl className="stats">
          <Stat label="Waiting to ship" value={int(view.now.waiting)} note={view.now.waiting ? `${egp(view.now.waitingValue)}${isNum(view.now.oldestWaitingHours) ? ` · oldest ${Math.round(view.now.oldestWaitingHours)} h` : ""}` : "none"} />
          <Stat label="On the road" value={int(view.now.onTheRoad)} note={view.now.onTheRoad ? `${egp(view.now.onTheRoadValue)} not yet collected` : "none"} />
          <Stat label="Delivered" value={int(p?.delivered)} note={p ? `${egp(p.deliveredValue)} reached customers` : null} />
          <Stat label="Failed or returned" value={int(p?.failed)} note={p?.failed ? egp(p.failedValue) : null} />
          <Stat label="On time" value={pct(s.withinPromise)} note={`within ${s.promiseDays} working days (Sun–Thu)`} />
          <Stat label="Order to door" value={isNum(s.toDoorDays) ? `${one(s.toDoorDays)} d` : "–"} note={isNum(s.toDoorP90) ? `slowest tenth ${one(s.toDoorP90)} d` : null} />
          <Stat label="Order to courier" value={isNum(s.toShipHours) ? `${Math.round(s.toShipHours)} h` : "–"} note="median" />
          <Stat label="With the courier" value={isNum(s.transitDays) ? `${one(s.transitDays)} d` : "–"} note={`median, ${plural(s.delivered, "delivery", "deliveries")}`} />
        </dl>
      </div>
      <div className="two">
        <div className="card">
          <h3>Still moving past the promise</h3>
          {view.late.length ? (
            <TableBox>
              <table className="card-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Where it is</th>
                    <th scope="col" className="r">
                      Days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {view.late.slice(0, 10).map((l) => (
                    <tr key={l.name}>
                      <th scope="row">
                        {l.name}
                        {l.city ? <span className="small tag"> · {l.city}</span> : null}
                      </th>
                      <td>{l.last ?? SHIP_WORD[l.state]}</td>
                      <td className="r">{int(l.days)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableBox>
          ) : (
            <p className="small card-sub">Every order on the road is within the promise.</p>
          )}
          {view.waiting.length ? (
            <>
              <h3 className="card-h">Not handed to the courier yet</h3>
              <TableBox>
                <table className="card-table">
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col">Placed</th>
                      <th scope="col" className="r">
                        Waiting
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.waiting.slice(0, 10).map((w) => (
                      <tr key={w.name}>
                        <th scope="row">{w.name}</th>
                        <td>{cairoTime(w.placedAt)}</td>
                        <td className="r">{w.hours >= 48 ? `${Math.floor(w.hours / 24)} d` : `${w.hours} h`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableBox>
            </>
          ) : null}
        </div>
        <div className="card">
          <h3>Bosta</h3>
          {view.bosta?.state === "ok" ? (
            <>
              <dl className="stats">
                <Stat label="Cash collected" value={egp(view.bosta.codCollected)} note="delivered, last 60 days" />
                <Stat label="Cash on the road" value={egp(view.bosta.codOnTheRoad)} />
                <Stat label="Returned to us" value={int(view.bosta.returned)} />
                <Stat label="Attempts per shipment" value={isNum(view.bosta.attempts) ? one(view.bosta.attempts) : "–"} />
              </dl>
              {view.bosta.exceptions.length ? (
                <p className="small card-foot">Why deliveries stalled: {view.bosta.exceptions.map((e) => `${e.reason} (${e.count})`).join(" · ")}</p>
              ) : null}
            </>
          ) : (
            <Gap className="in-card">{bostaGap ?? "Bosta could not be read just now."}</Gap>
          )}
          {view.byCity?.length ? (
            <>
              <h3 className="card-h">By city</h3>
              <TableBox>
                <table className="card-table">
                  <thead>
                    <tr>
                      <th scope="col">City</th>
                      <th scope="col" className="r">
                        Delivered
                      </th>
                      <th scope="col" className="r">
                        Days
                      </th>
                      <th scope="col" className="r">
                        Failed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.byCity.map((c) => (
                      <tr key={c.city}>
                        <th scope="row">{c.city}</th>
                        <td className="r">{int(c.delivered)}</td>
                        <td className="r">{isNum(c.days) ? one(c.days) : "–"}</td>
                        <td className="r">{int(c.failed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableBox>
            </>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ Checkout */

export function Checkout({ view, gap }: { view: CheckoutView | null; gap: string | null }) {
  if (gap || !view)
    return (
      <Section id="h-co" title="Why people leave at checkout">
        <Gap>{gap ?? "Abandoned checkouts could not be read just now."}</Gap>
      </Section>
    );
  const r = view.reached;
  const left = view.abandoned;
  return (
    <Section
      id="h-co"
      title="Why people leave at checkout"
      sub={`${rangeText(view.basis)}. Shopify records a checkout as abandoned once contact details are given; anyone who leaves before that is only in GA4's steps.`}
    >
      <Findings items={view.says} empty={left ? undefined : "No checkout was left in these 30 days."} />
      <div className="card">
        <dl className="stats">
          <Stat label="Finish checkout" value={pct(view.completion)} note={`${plural(view.orders, "order")} · ${plural(left, "left", "left")}`} />
          <Stat label="Left behind" value={egp(view.abandonedValue)} note={plural(left, "checkout")} />
          <Stat label="Came back later" value={int(view.recovered)} note={view.recovered ? egp(view.recoveredValue) : null} />
          <Stat label="Saw a delivery fee" value={int(view.fee.count)} note={isNum(view.fee.average) ? `about ${egp(view.fee.average)}` : null} />
          {view.threshold !== null ? (
            <Stat label={`Under ${egp(view.threshold)}`} value={pct(view.under.abandoned)} note={`of left carts · ${pct(view.under.orders)} of orders`} />
          ) : null}
          <Stat label="Average cart" value={egp(view.avgValue.abandoned)} note={`left · ${egp(view.avgValue.orders)} ordered`} />
        </dl>
      </div>
      <div className="two">
        <div className="card">
          <h3>Checkout, step by step · GA4</h3>
          {view.steps ? <Steps steps={view.steps} /> : <p className="small card-sub">Connect GA4 to see each step from the bag&rsquo;s Checkout button to the order.</p>}
          {view.byDevice?.length ? <p className="small card-foot">Checkouts ending in an order: {view.byDevice.map((d) => `${d.device} ${pct(d.started ? d.purchased / d.started : null)} of ${int(d.started)}`).join(" · ")}</p> : null}
        </div>
        <div className="card">
          <h3>How far the people who left got</h3>
          {r && left ? (
            <Steps
              steps={[
                { key: "contact", label: "Gave contact details", count: left },
                { key: "address", label: "Entered an address", count: r.address + r.delivery },
                { key: "delivery", label: "Saw the delivery fee", count: r.delivery },
              ]}
            />
          ) : (
            <p className="small card-sub">{left ? "Shopify didn't give checkout addresses, so the address step can't be told apart." : "Nobody left."}</p>
          )}
          {view.topItems.length ? <p className="small card-foot">Most left in checkouts: {view.topItems.map((t) => `${t.title} (${t.count})`).join(" · ")}</p> : null}
          {view.inApp && isNum(view.inApp.abandoned) ? (
            <p className="small card-foot">
              From Instagram&rsquo;s or Facebook&rsquo;s in-app browser: {pct(view.inApp.abandoned)} of left checkouts, {pct(view.inApp.orders)} of orders.
            </p>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ Website */

/** "+12% on the period before". */
const change = (now: unknown, before: unknown) => (isNum(now) && isNum(before) && before > 0 ? `${now >= before ? "+" : "−"}${pct(Math.abs(now - before) / before)} on the period before` : null);

export function Website({ view, days, gap }: { view: WebsiteView | null; days: PeriodKey; gap: string | null }) {
  if (gap || !view)
    return (
      <Section id="h-web" title="How the website is doing">
        <Gap>{gap ?? "Google Analytics could not be read just now."}</Gap>
      </Section>
    );
  const p = view.periods[days];
  const t = p?.totals;
  const orders = p?.funnel.find((s) => s.key === "purchase")?.count ?? null;
  const lcp = view.vitals?.find((v) => v.metric === "LCP");
  return (
    <Section id="h-web" title="How the website is doing" sub={`Every visitor, ad or not, from Google Analytics. Last ${days} full days.`}>
      <Findings items={view.says} />
      {t ? (
        <div className="card">
          <dl className="stats">
            <Stat label="Visits" value={int(t.sessions)} note={change(t.sessions, p?.prev?.sessions)} />
            <Stat label="Visitors" value={int(t.users)} note={isNum(t.newUsers) ? `${int(t.newUsers)} new` : null} />
            <Stat label="Stayed to look" value={pct(t.engagementRate)} note="engaged visits" />
            <Stat label="Time per visit" value={isNum(t.avgSeconds) ? `${Math.floor(t.avgSeconds / 60)}m ${Math.round(t.avgSeconds % 60)}s` : "–"} />
            <Stat label="Visits that order" value={isNum(orders) && isNum(t.sessions) && t.sessions > 0 ? pct(orders / t.sessions) : "–"} note={isNum(orders) ? plural(orders, "order") : null} />
            {lcp ? <Stat label="Pages loading fast" value={pct(lcp.good / Math.max(1, lcp.good + lcp.needsWork + lcp.poor))} note="main picture in 2.5 s, real visitors" /> : null}
          </dl>
        </div>
      ) : null}
      <div className="two">
        <div className="card">
          <h3>From visit to order</h3>
          {p ? <Steps steps={p.funnel} /> : <p className="small card-sub">No figures for this period.</p>}
          {view.inApp?.length ? (
            <p className="small card-foot">
              {view.inApp.map((x) => `${x.inApp}: ${int(x.sessions)} visits, ${int(x.purchases)} orders`).join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="card">
          <h3>Where visits come from · 30 days</h3>
          <TableBox>
            <table className="card-table">
              <thead>
                <tr>
                  <th scope="col">Channel</th>
                  <th scope="col" className="r">
                    Visits
                  </th>
                  <th scope="col" className="r">
                    Orders
                  </th>
                  <th scope="col" className="r">
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.channels.slice(0, 8).map((c) => (
                  <tr key={c.channel}>
                    <th scope="row">{c.channel}</th>
                    <td className="r">{int(c.sessions)}</td>
                    <td className="r">{int(c.purchases)}</td>
                    <td className="r">{egp(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableBox>
          {view.devices.length ? <p className="small card-foot">By device: {view.devices.map((d) => `${d.device} ${int(d.sessions)} visits, ${pct(d.engagementRate)} stayed, ${int(d.purchases)} orders`).join(" · ")}</p> : null}
        </div>
      </div>
      {view.landings.length ? (
        <div className="card">
          <h3>Pages people land on · 30 days</h3>
          <TableBox wide label="Landing pages">
            <table>
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col" className="r">
                    Visits
                  </th>
                  <th scope="col" className="r">
                    Stayed
                  </th>
                  <th scope="col" className="r">
                    Added to bag
                  </th>
                  <th scope="col" className="r">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.landings.map((l) => (
                  <tr key={l.page}>
                    <th scope="row">{l.page}</th>
                    <td className="r">{int(l.sessions)}</td>
                    <td className="r">{pct(l.engagementRate)}</td>
                    <td className="r">{int(l.addToCarts)}</td>
                    <td className="r">{int(l.purchases)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableBox>
        </div>
      ) : null}
    </Section>
  );
}

/* ------------------------------------------------------------ Products, end to end */

const VERDICT_TONE: Record<NonNullable<ProductHealthRow["verdict"]>["kind"], string> = { star: "ok", page: "warning", checkout: "warning", delivery: "critical", quiet: "neutral" };

export function ProductHealth({ rows, gaps }: { rows: ProductHealthRow[] | null; gaps: DashData["gaps"] }) {
  if (!rows?.length)
    return (
      <Section id="h-ph" title="Each scent, from first look to the door">
        <Gap>{gaps.website ?? gaps.shopify ?? "No scent figures yet."}</Gap>
      </Section>
    );
  return (
    <Section
      id="h-ph"
      title="Each scent, from first look to the door"
      sub={
        <>
          Last 30 days. Views and adds from GA4, bottles and sales from Shopify, left checkouts and failed deliveries from the orders.
          <span className="swipe-hint"> Scroll the table sideways for every column.</span>
        </>
      }
    >
      <div className="card">
        <TableBox wide label="Each scent from view to delivery">
          <table className="camp">
            <thead>
              <tr>
                <th scope="col">Scent</th>
                <th scope="col" className="r">
                  Viewed
                </th>
                <th scope="col" className="r">
                  Added
                </th>
                <th scope="col" className="r">
                  Add rate
                </th>
                <th scope="col" className="r">
                  Bottles sold
                </th>
                <th scope="col" className="r">
                  Net sales
                </th>
                <th scope="col" className="r">
                  Left at checkout
                </th>
                <th scope="col" className="r">
                  Failed delivery
                </th>
                <th scope="col">What it says</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((r) => (
                <tr key={r.title}>
                  <th scope="row">
                    {r.title}
                    {r.line ? <span className="small tag"> · {r.line}</span> : null}
                  </th>
                  <td className="r">{int(r.views)}</td>
                  <td className="r">{int(r.adds)}</td>
                  <td className="r">{pct(r.addRate)}</td>
                  <td className="r">{int(r.units)}</td>
                  <td className="r">{egp(r.net)}</td>
                  <td className="r">{int(r.abandoned)}</td>
                  <td className="r">{int(r.failed)}</td>
                  <td>{r.verdict ? <Pill tone={VERDICT_TONE[r.verdict.kind]}>{r.verdict.text}</Pill> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableBox>
      </div>
    </Section>
  );
}

/** The page's sections, as a row of links under the intro: the page is long, and each part answers a different question. */
export function SectionNav() {
  const parts: [string, string][] = [
    ["h-work", "Work on"],
    ["h-kpi", "Sales"],
    ["h-del", "Deliveries"],
    ["h-co", "Checkout"],
    ["h-funnel", "Ads"],
    ["h-web", "Website"],
    ["h-ph", "Scents"],
    ["h-aud", "Customers"],
    ["h-trk", "Data"],
  ];
  return (
    <nav className="sect-nav" aria-label="Sections">
      {parts.map(([id, label]) => (
        <a key={id} href={`#${id}`}>
          {label}
        </a>
      ))}
    </nav>
  );
}
