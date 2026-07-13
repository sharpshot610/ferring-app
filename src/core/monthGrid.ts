// PURE module — no DOM, no localStorage, no clock. No external deps.
// All weekday derivation via toEpochDay (1970-01-01 was a Thursday, Mon-index 3).

import type { ISODate } from './dates';
import { toEpochDay, fromEpochDay } from './dates';

export interface MonthCell {
  date: ISODate;
  inMonth: boolean;
}

export interface MonthGrid {
  year: number;
  month: number; // 1-12
  label: string; // "March 2026"
  weeks: MonthCell[][]; // each week = 7 cells, Monday first
}

// Full English month names for labels.
const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Return the Mon-indexed weekday (Mon=0 … Sun=6) for a given epoch day.
 *  1970-01-01 was a Thursday = Mon-index 3. */
function weekdayOf(epochDay: number): number {
  return ((epochDay % 7) + 3 + 7) % 7;
}

/** Days in a given month (handles leap years via Date.UTC round-trip). */
function daysInMonth(year: number, month: number): number {
  // Day 0 of next month = last day of this month
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Build the full month grid for the given year and 1-indexed month. */
export function monthGridFor(year: number, month: number): MonthGrid {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be 1-12.`);
  }

  const label = `${FULL_MONTH_NAMES[month - 1]} ${year}`;

  // Epoch day of the 1st of the month
  const firstDay: ISODate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const firstEpoch = toEpochDay(firstDay);

  // Monday-indexed weekday of the 1st (0 = Mon, 6 = Sun)
  const firstDow = weekdayOf(firstEpoch);

  // Grid starts on the Monday on or before the 1st
  const gridStartEpoch = firstEpoch - firstDow;

  // Epoch day of the last day of the month
  const totalDays = daysInMonth(year, month);
  const lastDay: ISODate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
  const lastEpoch = toEpochDay(lastDay);
  const lastDow = weekdayOf(lastEpoch);

  // Grid ends on the Sunday on or after the last day of the month
  const gridEndEpoch = lastEpoch + (6 - lastDow);

  const weeks: MonthCell[][] = [];
  let cursor = gridStartEpoch;

  while (cursor <= gridEndEpoch) {
    const week: MonthCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = fromEpochDay(cursor);
      const [y, m] = date.split('-').map(Number);
      week.push({ date, inMonth: y === year && m === month });
      cursor++;
    }
    weeks.push(week);
  }

  return { year, month, label, weeks };
}

/** Extract year and month from an ISODate. */
export function monthOf(date: ISODate): { year: number; month: number } {
  const [y, m] = date.split('-').map(Number);
  return { year: y, month: m };
}

/** Add (or subtract) delta months from a year/month pair, wrapping across years. */
export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  // Convert to 0-indexed month count from year 0
  const totalMonths = (year * 12 + (month - 1)) + delta;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return { year: newYear, month: newMonth };
}
