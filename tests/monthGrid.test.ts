import { describe, it, expect } from 'vitest';
import { monthGridFor, monthOf, addMonths } from '../src/core/monthGrid';
import { toEpochDay } from '../src/core/dates';

// Mon-indexed weekday from epoch day (Mon=0 … Sun=6)
// 1970-01-01 was a Thursday = Mon-index 3
function weekdayOf(epochDay: number): number {
  return ((epochDay % 7) + 3 + 7) % 7;
}

describe('monthGridFor — 2026-03 (March, starts on Sunday)', () => {
  const grid = monthGridFor(2026, 3);

  it('label is "March 2026"', () => {
    expect(grid.label).toBe('March 2026');
  });

  it('first cell is 2026-02-23 (the Monday before Mar 1 which is a Sunday)', () => {
    expect(grid.weeks[0][0].date).toBe('2026-02-23');
  });

  it('Mar 1 is the 7th cell (last in first week, index 6)', () => {
    expect(grid.weeks[0][6].date).toBe('2026-03-01');
    expect(grid.weeks[0][6].inMonth).toBe(true);
  });

  it('all weeks have exactly 7 cells', () => {
    for (const week of grid.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('inMonth flags: Feb cells are false, Mar cells are true', () => {
    // First week: first 6 cells are Feb (inMonth false), last is Mar 1 (true)
    for (let i = 0; i < 6; i++) {
      expect(grid.weeks[0][i].inMonth).toBe(false);
    }
    expect(grid.weeks[0][6].inMonth).toBe(true);
  });

  it('all Mar dates have inMonth:true', () => {
    const marCells = grid.weeks.flat().filter(c => c.date.startsWith('2026-03-'));
    expect(marCells).toHaveLength(31);
    for (const cell of marCells) {
      expect(cell.inMonth).toBe(true);
    }
  });

  it('non-March cells have inMonth:false', () => {
    const other = grid.weeks.flat().filter(c => !c.date.startsWith('2026-03-'));
    for (const cell of other) {
      expect(cell.inMonth).toBe(false);
    }
  });

  it('weeks.length is between 4 and 6', () => {
    expect(grid.weeks.length).toBeGreaterThanOrEqual(4);
    expect(grid.weeks.length).toBeLessThanOrEqual(6);
  });
});

describe('monthGridFor — 2028-02 (leap year February)', () => {
  const grid = monthGridFor(2028, 2);

  it('contains 2028-02-29 with inMonth:true', () => {
    const all = grid.weeks.flat();
    const leapDay = all.find(c => c.date === '2028-02-29');
    expect(leapDay).toBeDefined();
    expect(leapDay!.inMonth).toBe(true);
  });

  it('has 29 in-month cells (29 days in Feb 2028)', () => {
    const inMonth = grid.weeks.flat().filter(c => c.inMonth);
    expect(inMonth).toHaveLength(29);
  });
});

describe('monthGridFor — 2026-02 (non-leap February)', () => {
  const grid = monthGridFor(2026, 2);

  it('does NOT contain 2026-02-29', () => {
    const all = grid.weeks.flat();
    const leapDay = all.find(c => c.date === '2026-02-29');
    expect(leapDay).toBeUndefined();
  });

  it('has 28 in-month cells', () => {
    const inMonth = grid.weeks.flat().filter(c => c.inMonth);
    expect(inMonth).toHaveLength(28);
  });
});

describe('monthGridFor — 2026-06 (June, starts on Monday)', () => {
  const grid = monthGridFor(2026, 6);

  it('first cell is exactly 2026-06-01 (no leading out-month cells)', () => {
    expect(grid.weeks[0][0].date).toBe('2026-06-01');
    expect(grid.weeks[0][0].inMonth).toBe(true);
  });

  it('all weeks have exactly 7 cells', () => {
    for (const week of grid.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('weeks.length is between 4 and 6', () => {
    expect(grid.weeks.length).toBeGreaterThanOrEqual(4);
    expect(grid.weeks.length).toBeLessThanOrEqual(6);
  });
});

describe('every grid — invariants', () => {
  // A selection of months to stress-test invariants
  const cases: Array<[number, number]> = [
    [2026, 1], [2026, 2], [2026, 3], [2026, 6], [2026, 9], [2026, 12],
    [2028, 2], [2025, 1], [2024, 2], // 2024-02 is also leap
  ];

  for (const [year, month] of cases) {
    describe(`${year}-${String(month).padStart(2, '0')}`, () => {
      const grid = monthGridFor(year, month);

      it('weeks.length between 4 and 6', () => {
        expect(grid.weeks.length).toBeGreaterThanOrEqual(4);
        expect(grid.weeks.length).toBeLessThanOrEqual(6);
      });

      it('first cell is a Monday (Mon-index 0)', () => {
        const firstDate = grid.weeks[0][0].date;
        const dow = weekdayOf(toEpochDay(firstDate));
        expect(dow).toBe(0);
      });

      it('dates are strictly consecutive across the whole grid', () => {
        const cells = grid.weeks.flat();
        for (let i = 1; i < cells.length; i++) {
          const prev = toEpochDay(cells[i - 1].date);
          const curr = toEpochDay(cells[i].date);
          expect(curr - prev).toBe(1);
        }
      });

      it('last cell is a Sunday (Mon-index 6)', () => {
        const lastWeek = grid.weeks[grid.weeks.length - 1];
        const lastDate = lastWeek[lastWeek.length - 1].date;
        const dow = weekdayOf(toEpochDay(lastDate));
        expect(dow).toBe(6);
      });
    });
  }
});

describe('monthOf', () => {
  it('extracts year and month from an ISODate', () => {
    expect(monthOf('2026-03-15')).toEqual({ year: 2026, month: 3 });
    expect(monthOf('2028-02-29')).toEqual({ year: 2028, month: 2 });
    expect(monthOf('2025-12-01')).toEqual({ year: 2025, month: 12 });
  });
});

describe('addMonths', () => {
  it('addMonths(2026, 12, 1) → {year: 2027, month: 1}', () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('addMonths(2026, 1, -1) → {year: 2025, month: 12}', () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('round-trips: +12 months then -12 returns original', () => {
    const start = { year: 2026, month: 6 };
    const forward = addMonths(start.year, start.month, 12);
    const back = addMonths(forward.year, forward.month, -12);
    expect(back).toEqual(start);
  });

  it('addMonths with delta 0 is identity', () => {
    expect(addMonths(2026, 6, 0)).toEqual({ year: 2026, month: 6 });
  });

  it('addMonths large positive delta crosses multiple years', () => {
    expect(addMonths(2024, 11, 26)).toEqual({ year: 2027, month: 1 });
  });

  it('addMonths(0, 1, -1) → {year: -1, month: 12} (floored modulo, not JS remainder)', () => {
    expect(addMonths(0, 1, -1)).toEqual({ year: -1, month: 12 });
  });

  it('addMonths(1, 1, -13) → {year: -1, month: 12} (totalMonths=-1, floored)', () => {
    // totalMonths = 1*12 + (1-1) - 13 = -1 → floor(-1/12)=-1, month=12
    expect(addMonths(1, 1, -13)).toEqual({ year: -1, month: 12 });
  });
});

describe('monthGridFor — validation', () => {
  it('throws on month < 1', () => {
    expect(() => monthGridFor(2026, 0)).toThrow();
  });

  it('throws on month > 12', () => {
    expect(() => monthGridFor(2026, 13)).toThrow();
  });
});
