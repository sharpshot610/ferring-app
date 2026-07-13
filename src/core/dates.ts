// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.
// (todayLocalISO is the ONLY function permitted to read the clock, and only via
// its default parameter, so callers can always inject a fixed `now`.)
//
// All date math is done on UTC epoch-day integers (days since 1970-01-01) built
// from Date.UTC, which is leap-year-correct and immune to local timezone / DST.

export type ISODate = string; // "YYYY-MM-DD"

const MS_PER_DAY = 86400000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a strict "YYYY-MM-DD" string into a UTC epoch-day integer. Throws on
 *  malformed or non-existent calendar dates (e.g. 2023-02-29). */
export function toEpochDay(d: ISODate): number {
  if (!isValidISODate(d)) {
    throw new Error(`Invalid ISO date: ${JSON.stringify(d)}`);
  }
  const [, y, m, day] = ISO_RE.exec(d)!;
  const ms = Date.UTC(Number(y), Number(m) - 1, Number(day));
  return Math.round(ms / MS_PER_DAY);
}

/** Inverse of toEpochDay: a UTC epoch-day integer back to "YYYY-MM-DD". */
export function fromEpochDay(n: number): ISODate {
  const date = new Date(n * MS_PER_DAY);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${pad4(y)}-${pad2(m)}-${pad2(day)}`;
}

export function addDays(d: ISODate, n: number): ISODate {
  return fromEpochDay(toEpochDay(d) + n);
}

export function diffDays(a: ISODate, b: ISODate): number { // a − b
  return toEpochDay(a) - toEpochDay(b);
}

/** Strict format ("YYYY-MM-DD") AND a real calendar date. Rejects 2023-02-29,
 *  2024-13-01, etc. */
export function isValidISODate(s: string): boolean {
  const match = ISO_RE.exec(s);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const day = Number(match[3]);
  if (m < 1 || m > 12) return false;
  if (day < 1 || day > 31) return false;
  // Round-trip through Date.UTC: if any field overflowed, the reconstructed
  // date won't match the parsed components.
  const dt = new Date(Date.UTC(y, m - 1, day));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === day
  );
}

/** The local calendar date as an ISODate. This is the ONLY impure-capable
 *  function: it reads the clock via the default `now`, but callers may inject a
 *  fixed Date to keep it pure. */
export function todayLocalISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const day = now.getDate();
  return `${pad4(y)}-${pad2(m)}-${pad2(day)}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad4(n: number): string {
  return String(n).padStart(4, '0');
}
