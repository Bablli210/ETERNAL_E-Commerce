import type { Range } from "@/lib/dashboard/types";

/**
 * How the dashboard writes its figures. Unknown is always "–", never 0: a
 * null in the data means the source could not say, and a zero would read as
 * "nothing happened". Days are calendar days ("YYYY-MM-DD") already counted
 * in Cairo by the data layer, so they are formatted as they are (UTC noon
 * keeps the date from shifting); moments (ISO times) are shown in Cairo time.
 */

export const NONE = "–";
export const CAIRO = "Africa/Cairo";

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const fmtInt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** Money in Egyptian pounds, whole pounds: "EGP 1,751". */
export const egp = (v: unknown) => (isNum(v) ? `EGP ${fmtInt.format(Math.round(v))}` : NONE);
export const int = (v: unknown) => (isNum(v) ? fmtInt.format(v) : NONE);
/** A ratio as a percentage with one decimal: 0.231 is "23.1%". */
export const pct = (v: unknown) => (isNum(v) ? `${fmt1.format(v * 100)}%` : NONE);
/** Return on ad spend: "0.53×". */
export const times = (v: unknown) => (isNum(v) ? `${fmt2.format(v)}×` : NONE);
export const two = (v: unknown) => (isNum(v) ? fmt2.format(v) : NONE);
export const one = (v: unknown) => (isNum(v) ? fmt1.format(v) : NONE);
/** Axis ticks: "2.5k", "500", "-1k". */
export const compact = (v: number) => (Math.abs(v) >= 1000 ? `${fmtShort.format(v / 1000)}k` : fmtInt.format(v));

/** "1 order", "3 orders"; the count is written with thousands separators. */
export const plural = (n: number, one: string, many = `${one}s`) => `${fmtInt.format(n)} ${n === 1 ? one : many}`;

const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const momentFmt = new Intl.DateTimeFormat("en-GB", { timeZone: CAIRO, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const noon = (ymd: string) => new Date(`${ymd}T12:00:00Z`);
const valid = (d: Date) => !Number.isNaN(d.getTime());

/** A calendar day: "7 Oct". */
export const day = (ymd: string) => (valid(noon(ymd)) ? dayFmt.format(noon(ymd)) : ymd);
/** A calendar day with its weekday: "Tue 6 Oct". */
export const weekday = (ymd: string) => (valid(noon(ymd)) ? weekdayFmt.format(noon(ymd)) : ymd);
/** A moment in Cairo time: "7 Oct, 13:00". */
export const cairoTime = (iso: string) => {
  const d = new Date(iso);
  return valid(d) ? momentFmt.format(d) : NONE;
};
/** An inclusive run of days: "7 Sep – 6 Oct". */
export const rangeText = (r: Range | null | undefined) => (r ? `${day(r.from)} – ${day(r.to)}` : "");
