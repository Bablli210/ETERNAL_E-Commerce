import type { DashData, MetaAds, PeriodKey } from "@/lib/dashboard/types";
import { cairoTime, int, isNum, one, pct } from "./format";
import { Gap, Section, TableBox } from "./ui";

type Pixel = DashData["tracking"]["pixel"];

const STEPS: { label: string; key: keyof MetaAds; of: string }[] = [
  { label: "Saw an ad", key: "reach", of: "people reached" },
  { label: "Clicked through", key: "linkClicks", of: "of those reached" },
  { label: "Page loaded", key: "lpv", of: "of clicks" },
  { label: "Added to bag", key: "atc", of: "of page loads" },
  { label: "Started checkout", key: "ic", of: "of bag adds" },
  { label: "Bought", key: "purchases", of: "of checkouts" },
];

/** People Meta's ads brought, step by step. Bars are scaled by square root so the late, small steps stay visible. */
function Steps({ ads, days }: { ads: MetaAds; days: PeriodKey }) {
  const counts = STEPS.map((s) => ads[s.key]);
  const max = Math.max(1, ...counts.filter(isNum));
  return (
    <div className="card">
      <h3>People who came from Meta ads · last {days} days</h3>
      <ol className="funnel">
        {STEPS.map((s, i) => {
          const v = counts[i];
          const before = i ? counts[i - 1] : null;
          const rate = i && isNum(before) && before > 0 && isNum(v) ? `${pct(v / before)} ${s.of}` : "";
          return (
            <li key={s.key} className="step">
              <span>{s.label}</span>
              <span className="fbar" style={{ width: isNum(v) ? `${Math.max(0.6, Math.sqrt(v / max) * 100).toFixed(1)}%` : 0 }} aria-hidden="true" />
              <span className="n">{int(v)}</span>
              {rate ? <span className="rate">{rate}</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Every event the website sent Meta, ad or not, browser and server copies apart. */
function SiteEvents({ pixel, gap }: { pixel: Pixel; gap: string | null }) {
  if (gap)
    return (
      <div className="card">
        <h3>Everything the website reported to Meta</h3>
        <Gap className="in-card">{gap}</Gap>
      </div>
    );
  if (!pixel) return null;
  const noEmq = pixel.events.length > 0 && pixel.events.every((e) => !isNum(e.emq));
  const last = [pixel.lastBrowser ? `browser ${cairoTime(pixel.lastBrowser)}` : "", pixel.lastServer ? `server ${cairoTime(pixel.lastServer)}` : ""]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="card">
      <h3>Everything the website reported to Meta</h3>
      <p className="small card-sub">
        Last {pixel.windowDays} days, every visitor, ad or not. Browser and server copies of the same event are shown apart, as Meta counts them before removing
        duplicates.
      </p>
      {pixel.events.length ? (
        <TableBox>
          <table>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col" className="r">
                  Browser
                </th>
                <th scope="col" className="r">
                  Server
                </th>
                <th scope="col" className="r">
                  Match quality
                </th>
              </tr>
            </thead>
            <tbody>
              {pixel.events.map((e) => (
                <tr key={e.name}>
                  <th scope="row">{e.label}</th>
                  <td className="r">{int(e.browser)}</td>
                  <td className="r">{int(e.server)}</td>
                  <td className="r">{isNum(e.emq) ? `${one(e.emq)}/10` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableBox>
      ) : (
        <p className="small">Meta received no events from the website in these days.</p>
      )}
      {/* No cause named: besides a key that may not read it, the scores are missing when the read was throttled or failed, or before Meta has scored any event, and the page is not told which. The owner details give the state. */}
      {noEmq ? <p className="small card-foot">Meta gave no match quality scores.</p> : null}
      {last || pixel.hosts.length ? (
        <p className="small card-foot">
          {last ? `Last event: ${last} (Cairo time).` : ""}
          {last && pixel.hosts.length ? " " : ""}
          {pixel.hosts.length ? `Sites that sent events in the last 7 days: ${pixel.hosts.join(", ")}.` : ""}
        </p>
      ) : null}
    </div>
  );
}

/** From ad to order: Meta's funnel for the period beside what the website itself reported. */
export function Funnel({ ads, pixel, days, gaps }: { ads: MetaAds | null | undefined; pixel: Pixel; days: PeriodKey; gaps: DashData["gaps"] }) {
  if (!ads && !gaps.ads && !pixel && !gaps.pixel) return null;
  return (
    <Section id="h-funnel" title="From ad to order" sub="Bars are scaled by square root so the small steps stay visible.">
      <div className="two">
        {gaps.ads ? (
          <div className="card">
            <h3>People who came from Meta ads</h3>
            <Gap className="in-card">{gaps.ads}</Gap>
          </div>
        ) : ads ? (
          <Steps ads={ads} days={days} />
        ) : null}
        <SiteEvents pixel={pixel} gap={gaps.pixel} />
      </div>
    </Section>
  );
}
