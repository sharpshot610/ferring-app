import { describe, it, expect } from 'vitest';
import {
  computePregnancy,
  gestationalAgeOn,
  conceptionalAgeOn,
  dateRangeForGestationalWeek,
  DEFAULT_SETTINGS,
  type Pregnancy,
} from '../src/core/calc';
import { allFixtures, gaFixture } from './fixtures';

describe('computePregnancy — every fixture, every field', () => {
  for (const f of allFixtures) {
    it(f.name, () => {
      const p = computePregnancy(f.anchor);
      const keys = Object.keys(f.expected) as (keyof Pregnancy)[];
      for (const k of keys) {
        expect(p[k], `${f.name} field ${k}`).toBe(f.expected[k]);
      }
      // and the whole object deep-equals
      expect(p).toEqual(f.expected);
    });
  }
});

describe('ga_on_date normalization', () => {
  it('normalizes GA anchor back to the correct LMP', () => {
    const p = computePregnancy(gaFixture.anchor);
    expect(p.lmp).toBe('2024-01-01');
    // GA of 10w0d on the anchor date, conceptional 8w0d
    expect(gestationalAgeOn(p, '2024-03-11')).toEqual({ weeks: 10, days: 0, totalDays: 70 });
    expect(conceptionalAgeOn(p, '2024-03-11')).toEqual({ weeks: 8, days: 0, totalDays: 56 });
  });

  it('accepts weeks+days GA and offsets LMP by exact day count', () => {
    const p = computePregnancy({ type: 'ga_on_date', date: '2024-06-01', ga: { weeks: 6, days: 3 } });
    // lmp = date − (7*6 + 3) = date − 45
    expect(p.lmp).toBe('2024-04-17');
  });

  it('throws a clear error when ga is missing', () => {
    expect(() => computePregnancy({ type: 'ga_on_date', date: '2024-06-01' })).toThrow(/ga/i);
  });

  it('throws for non-finite weeks (Infinity)', () => {
    expect(() =>
      computePregnancy({ type: 'ga_on_date', date: '2024-06-01', ga: { weeks: Infinity, days: 0 } }),
    ).toThrow();
  });

  it('throws for negative weeks', () => {
    expect(() =>
      computePregnancy({ type: 'ga_on_date', date: '2024-06-01', ga: { weeks: -1, days: 0 } }),
    ).toThrow();
  });

  it('throws for fractional days', () => {
    expect(() =>
      computePregnancy({ type: 'ga_on_date', date: '2024-06-01', ga: { weeks: 10, days: 2.5 } }),
    ).toThrow();
  });
});

describe('gestationalAgeOn', () => {
  it('computes weeks/days/totalDays on the LMP itself', () => {
    const p = computePregnancy({ type: 'lmp', date: '2024-01-01' });
    expect(gestationalAgeOn(p, '2024-01-01')).toEqual({ weeks: 0, days: 0, totalDays: 0 });
    expect(gestationalAgeOn(p, '2024-01-08')).toEqual({ weeks: 1, days: 0, totalDays: 7 });
    expect(gestationalAgeOn(p, '2024-01-10')).toEqual({ weeks: 1, days: 2, totalDays: 9 });
  });

  it('keeps days in 0–6 for dates BEFORE the LMP (negative GA)', () => {
    const p = computePregnancy({ type: 'lmp', date: '2024-01-10' });
    // 3 days before lmp → totalDays = -3 → floor(-3/7) = -1 weeks, days = -3-(-7)=4
    const ga = gestationalAgeOn(p, '2024-01-07');
    expect(ga.totalDays).toBe(-3);
    expect(ga.weeks).toBe(-1);
    expect(ga.days).toBe(4);
    expect(ga.days).toBeGreaterThanOrEqual(0);
    expect(ga.days).toBeLessThanOrEqual(6);
    // exactly one week before → clean -1w0d
    expect(gestationalAgeOn(p, '2024-01-03')).toEqual({ weeks: -1, days: 0, totalDays: -7 });
  });
});

describe('conceptionalAgeOn', () => {
  it('is gestational age minus 14 days', () => {
    const p = computePregnancy({ type: 'lmp', date: '2024-01-01' });
    expect(conceptionalAgeOn(p, '2024-01-15')).toEqual({ weeks: 0, days: 0, totalDays: 0 });
    expect(conceptionalAgeOn(p, '2024-01-01')).toEqual({ weeks: -2, days: 0, totalDays: -14 });
  });
});

describe('dateRangeForGestationalWeek', () => {
  it('week N = lmp + 7N .. + 6', () => {
    const p = computePregnancy({ type: 'lmp', date: '2024-01-01' });
    expect(dateRangeForGestationalWeek(p, 0)).toEqual({ start: '2024-01-01', end: '2024-01-07' });
    expect(dateRangeForGestationalWeek(p, 1)).toEqual({ start: '2024-01-08', end: '2024-01-14' });
    expect(dateRangeForGestationalWeek(p, 40)).toEqual({ start: '2024-10-07', end: '2024-10-13' });
  });
});

describe('β-hCG timing', () => {
  it('day-3 anchor: anchor date + betaHcgAfterDay3 (default 12)', () => {
    const p = computePregnancy({ type: 'transfer_day3', date: '2024-05-01' });
    expect(p.betaHcg).toBe('2024-05-13'); // +12
  });

  it('day-5 anchor: anchor date + betaHcgAfterDay5 (default 10)', () => {
    const p = computePregnancy({ type: 'transfer_day5', date: '2024-05-01' });
    expect(p.betaHcg).toBe('2024-05-11'); // +10
  });

  it('non-transfer anchor: implied day-5 → transferDay5 + betaHcgAfterDay5', () => {
    const p = computePregnancy({ type: 'lmp', date: '2024-02-10' });
    expect(p.betaHcg).toBe('2024-03-10'); // transferDay5 (2024-02-29) + 10
  });

  it('respects settings overrides for the betaHcg offsets', () => {
    const p3 = computePregnancy({ type: 'transfer_day3', date: '2024-05-01' }, { betaHcgAfterDay3: 14 });
    expect(p3.betaHcg).toBe('2024-05-15');
    const p5 = computePregnancy({ type: 'transfer_day5', date: '2024-05-01' }, { betaHcgAfterDay5: 9 });
    expect(p5.betaHcg).toBe('2024-05-10');
  });
});

describe('settings overrides', () => {
  it('lastProgesteroneGA drives lastProgesterone offset from LMP', () => {
    const p = computePregnancy(
      { type: 'lmp', date: '2024-01-01' },
      { lastProgesteroneGA: { weeks: 12, days: 3 } },
    );
    // lmp + (7*12 + 3) = lmp + 87
    expect(p.lastProgesterone).toBe('2024-03-28');
  });

  it('defaults put lastProgesterone at lmp + 70 (10w0d)', () => {
    const p = computePregnancy({ type: 'lmp', date: '2024-01-01' });
    expect(p.lastProgesterone).toBe('2024-03-11');
    expect(DEFAULT_SETTINGS.lastProgesteroneGA).toEqual({ weeks: 10, days: 0 });
  });
});

describe('trimester ends', () => {
  it('are exactly lmp + 97 and lmp + 195', () => {
    for (const f of allFixtures) {
      const p = computePregnancy(f.anchor);
      expect(dateRangeForGestationalWeek(p, 0).start).toBe(p.lmp);
      // trimester1End is lmp + 97
      const t1 = computePregnancy(f.anchor).trimester1End;
      const t2 = computePregnancy(f.anchor).trimester2End;
      expect(t1).toBe(f.expected.trimester1End);
      expect(t2).toBe(f.expected.trimester2End);
    }
  });
});
