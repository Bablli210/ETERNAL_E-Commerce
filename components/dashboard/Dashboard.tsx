import Link from "next/link";
import { PERIOD_KEYS, type DashData, type PeriodKey, type Viewer } from "@/lib/dashboard/types";
import { cairoTime, egp, isNum, plural } from "./format";
import { Funnel } from "./Funnel";
import { Kpis } from "./Kpis";
import { Attention, Foot, Notes, OwnerDetails, SourceChips, Tracking } from "./Status";
import { Audience, Campaigns, Products, Sources } from "./Tables";
import { TopBar } from "./TopBar";
import { TrendChart } from "./TrendChart";

/**
 * The period switch: plain links, so it works before any script loads and
 * each period has its own address. The page keeps its scroll position, so
 * switching from deep in the page stays on the section being read.
 */
function PeriodSwitch({ days }: { days: PeriodKey }) {
  return (
    <nav className="dash-seg" aria-label="Period">
      {PERIOD_KEYS.map((k) => (
        <Link key={k} href={`?days=${k}`} prefetch={false} scroll={false} aria-current={k === days ? "page" : undefined}>
          {k} days
        </Link>
      ))}
    </nav>
  );
}

/** "Updated 7 Oct, 13:00 Cairo · Today so far: 1 order, EGP 1,250, ad spend EGP 179". */
function Freshness({ data }: { data: DashData }) {
  const t = data.daily.days.find((d) => d.d === data.daily.today);
  const parts: string[] = [];
  if (t && !data.gaps.shopify && isNum(t.orders)) parts.push(t.orders > 0 ? `${plural(t.orders, "order")}, ${egp(t.net)}` : "no orders yet");
  if (t && !data.gaps.ads && isNum(t.spend) && t.spend > 0) parts.push(`ad spend ${egp(t.spend)}`);
  return (
    <p className="dash-fresh">
      {data.status.updatedAt ? <span>Updated {cairoTime(data.status.updatedAt)} Cairo</span> : <span>Not read yet</span>}
      {parts.length ? (
        <>
          <span className="sep"> · </span>
          <span>Today so far: {parts.join(", ")}</span>
        </>
      ) : null}
    </p>
  );
}

/**
 * The signed-in dashboard: the old claude.ai page (docs/analytics/dashboard/
 * template.html) as a server component, so every figure arrives in the HTML
 * and only the chart's readout runs in the browser. A section whose source
 * could not be read says why (data.gaps) instead of showing zeros. The
 * owner details render only for an owner, and only when the server sent them.
 */
export function Dashboard({
  data,
  days,
  viewer,
  toolbar,
  notice,
}: {
  data: DashData;
  days: PeriodKey;
  viewer: Viewer;
  toolbar?: React.ReactNode;
  notice?: React.ReactNode;
}) {
  const p = data.periods[days];
  const n = Number(days);
  // The period's full days, ending yesterday: the same days the tiles count. Today shows apart, in the top bar.
  const full = [...data.daily.days]
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
    .filter((d) => d.d < data.daily.today)
    .slice(-n);

  return (
    <>
      <TopBar
        period={
          <>
            <PeriodSwitch days={days} />
            <Freshness data={data} />
          </>
        }
        toolbar={toolbar}
      />
      <main className="dash-main" id="dash-main">
        {notice ? <div className="dash-notice">{notice}</div> : null}
        <div className="intro">
          <p className="label">eternal · eau de parfum · Cairo</p>
          <h1>How the house is selling</h1>
          <p className="lede">
            Sales and customers from Shopify, advertising from Meta, and the state of the tracking that feeds both. Figures are read live and refreshed every
            few minutes.
          </p>
          <SourceChips sources={data.status.sources} />
        </div>
        <Attention items={data.status.attention} />
        <Kpis p={p} full={full} days={days} gaps={data.gaps} />
        <TrendChart rows={full} days={days} gaps={data.gaps} />
        <Funnel ads={p?.ads} pixel={data.tracking.pixel} days={days} gaps={data.gaps} />
        <Products rows={data.products[days]} days={days} approximate={Boolean(p?.approximate)} gap={data.gaps.shopify} />
        <Sources sources={data.sources} days={days} gap={data.gaps.shopify} />
        <Campaigns campaigns={data.campaigns} gap={data.gaps.campaigns} />
        <Audience audience={data.audience} gaps={data.gaps} />
        <Tracking items={data.tracking.items} />
        <Notes notes={data.notes} />
        <Foot dayLabel={data.status.dayLabel} />
        {data.admin && viewer.role === "owner" ? <OwnerDetails admin={data.admin} /> : null}
      </main>
    </>
  );
}
