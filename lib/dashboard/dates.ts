/**
 * Calendar days for the dashboard. Vercel runs in UTC while the shop and the
 * ad account count days in Cairo, so every day is worked out with Intl in the
 * source's own time zone, never with toISOString(): for a few hours each
 * night the UTC date is a day behind Cairo's. Cairo also changes its offset
 * twice a year, so offsets are read for the date in question, never fixed.
 */
export const SHOP_TZ = "Africa/Cairo";

/** The calendar day of a moment in a time zone, "YYYY-MM-DD". */
export const ymdIn = (at: Date, tz: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);

/** Calendar arithmetic on "YYYY-MM-DD" (no time zone involved). */
export function addDays(ymd: string, n: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Every day from `from` to `to`, inclusive. */
export function daysBetween(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The N full days ending yesterday, and the N days before them. */
export const fullDays = (n: number, today: string) => ({ from: addDays(today, -n), to: addDays(today, -1) });
export const prevDays = (n: number, today: string) => ({ from: addDays(today, -2 * n), to: addDays(today, -n - 1) });

/** A zone's offset from UTC at a moment, in minutes ("+03:00" is 180). */
export function offsetMinutes(tz: string, at: Date) {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}

/** Midnight at the start of a calendar day in a zone, as an ISO string with that day's offset ("2026-10-08T00:00:00+03:00"). */
export function dayStartIso(ymd: string, tz: string) {
  const mins = offsetMinutes(tz, new Date(`${ymd}T12:00:00Z`));
  const sign = mins < 0 ? "-" : "+";
  const abs = Math.abs(mins);
  return `${ymd}T00:00:00${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
