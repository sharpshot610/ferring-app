import { describe, it, expect } from 'vitest';
import {
  toEpochDay,
  fromEpochDay,
  addDays,
  diffDays,
  isValidISODate,
  todayLocalISO,
} from '../src/core/dates';

describe('addDays across boundaries', () => {
  it('crosses Feb 28/29 in a leap year', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('crosses Feb 28 → Mar 1 in a non-leap year', () => {
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(addDays('2023-03-01', -1)).toBe('2023-02-28');
  });

  it('crosses year boundaries', () => {
    expect(addDays('2023-12-31', 1)).toBe('2024-01-01');
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
  });
});

describe('diffDays', () => {
  it('is a − b in whole days', () => {
    expect(diffDays('2024-03-01', '2024-02-28')).toBe(2); // includes Feb 29
    expect(diffDays('2023-03-01', '2023-02-28')).toBe(1);
    expect(diffDays('2024-01-01', '2023-12-31')).toBe(1);
    expect(diffDays('2024-02-06', '2024-11-12')).toBe(-280);
    expect(diffDays('2024-02-06', '2024-02-06')).toBe(0);
  });
});

describe('fromEpochDay(toEpochDay(d)) round-trips across all of 2024', () => {
  it('is exact for every day of the leap year 2024', () => {
    let d = '2024-01-01';
    const end = toEpochDay('2024-12-31');
    while (toEpochDay(d) <= end) {
      expect(fromEpochDay(toEpochDay(d))).toBe(d);
      d = addDays(d, 1);
    }
    // sanity: 2024 is a leap year → 366 days
    expect(diffDays('2025-01-01', '2024-01-01')).toBe(366);
  });
});

describe('isValidISODate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidISODate('2024-02-29')).toBe(true); // leap day
    expect(isValidISODate('2024-01-01')).toBe(true);
    expect(isValidISODate('2023-12-31')).toBe(true);
    expect(isValidISODate('2000-02-29')).toBe(true); // divisible-by-400 leap
  });

  it('rejects non-existent calendar dates', () => {
    expect(isValidISODate('2023-02-29')).toBe(false); // not a leap year
    expect(isValidISODate('2024-13-01')).toBe(false); // month 13
    expect(isValidISODate('2024-00-10')).toBe(false); // month 0
    expect(isValidISODate('2024-04-31')).toBe(false); // April has 30 days
    expect(isValidISODate('2100-02-29')).toBe(false); // divisible by 100 not 400
    expect(isValidISODate('2024-01-00')).toBe(false); // day 0
  });

  it('rejects malformed strings', () => {
    expect(isValidISODate('2024-1-1')).toBe(false); // not zero-padded
    expect(isValidISODate('2024/01/01')).toBe(false);
    expect(isValidISODate('24-01-01')).toBe(false);
    expect(isValidISODate('')).toBe(false);
    expect(isValidISODate('2024-01-01T00:00:00')).toBe(false);
    expect(isValidISODate('not-a-date')).toBe(false);
  });
});

describe('toEpochDay', () => {
  it('throws on invalid dates', () => {
    expect(() => toEpochDay('2023-02-29')).toThrow();
    expect(() => toEpochDay('nonsense')).toThrow();
  });

  it('anchors 1970-01-01 at epoch day 0', () => {
    expect(toEpochDay('1970-01-01')).toBe(0);
    expect(toEpochDay('1970-01-02')).toBe(1);
    expect(toEpochDay('1969-12-31')).toBe(-1);
  });
});

describe('todayLocalISO', () => {
  it('formats an injected Date as its local calendar date', () => {
    const d = new Date(2024, 1, 29, 13, 45); // Feb 29 2024, local
    expect(todayLocalISO(d)).toBe('2024-02-29');
  });

  it('zero-pads month and day', () => {
    const d = new Date(2025, 0, 5, 0, 0); // Jan 5 2025
    expect(todayLocalISO(d)).toBe('2025-01-05');
  });
});
