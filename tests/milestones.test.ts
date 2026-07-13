import { describe, it, expect } from 'vitest';
import { computePregnancy } from '../src/core/calc';
import { getMilestones, nextMilestone } from '../src/core/milestones';
import { fetalSizeForWeek } from '../src/core/fetalGrowth';
import { diffDays } from '../src/core/dates';

const P = computePregnancy({ type: 'retrieval', date: '2024-02-20' });
// Known dates for this fixture:
//   retrieval 2024-02-20, transferDay5 2024-02-25, betaHcg 2024-03-06,
//   lastProgesterone 2024-04-16, trimester1End 2024-05-13,
//   trimester2End 2024-08-19, edd 2024-11-12.

describe('getMilestones ordering', () => {
  it('returns 7 milestones ascending by date', () => {
    const ms = getMilestones(P, '2024-01-01');
    expect(ms).toHaveLength(7);
    for (let i = 1; i < ms.length; i++) {
      expect(diffDays(ms[i].date, ms[i - 1].date)).toBeGreaterThanOrEqual(0);
    }
    expect(ms.map((m) => m.id)).toEqual([
      'retrieval',
      'transfer',
      'betaHcg',
      'lastProgesterone',
      'trimester1End',
      'trimester2End',
      'edd',
    ]);
  });

  it('marks the transfer as implied day-5 for a retrieval anchor', () => {
    const ms = getMilestones(P, '2024-01-01');
    const transfer = ms.find((m) => m.id === 'transfer')!;
    expect(transfer.date).toBe('2024-02-25'); // transferDay5
    expect(transfer.implied).toBe(true);
    expect(transfer.label).toBe('Embryo transfer (day 5, implied)');
    // the anchor's own milestone is NOT implied
    expect(ms.find((m) => m.id === 'retrieval')!.implied).toBe(false);
  });

  it('uses the matching transfer date/label for a transfer anchor', () => {
    const p3 = computePregnancy({ type: 'transfer_day3', date: '2024-03-01' });
    const t3 = getMilestones(p3, '2024-01-01').find((m) => m.id === 'transfer')!;
    expect(t3.date).toBe('2024-03-01');
    expect(t3.implied).toBe(false);
    expect(t3.label).toBe('Embryo transfer (day 3)');
  });
});

describe('past / today / future status at three different "today" values', () => {
  it('all future when today precedes every milestone', () => {
    const ms = getMilestones(P, '2024-01-01');
    expect(ms.every((m) => m.status === 'future')).toBe(true);
    expect(ms.every((m) => m.daysUntil > 0)).toBe(true);
  });

  it("marks 'today' on an exact match and past/future around it", () => {
    const ms = getMilestones(P, '2024-03-06'); // betaHcg day
    const beta = ms.find((m) => m.id === 'betaHcg')!;
    expect(beta.status).toBe('today');
    expect(beta.daysUntil).toBe(0);
    expect(ms.find((m) => m.id === 'retrieval')!.status).toBe('past');
    expect(ms.find((m) => m.id === 'edd')!.status).toBe('future');
  });

  it('all past when today is after every milestone', () => {
    const ms = getMilestones(P, '2025-01-01');
    expect(ms.every((m) => m.status === 'past')).toBe(true);
    expect(ms.every((m) => m.daysUntil < 0)).toBe(true);
  });
});

describe('daysUntil signs', () => {
  it('is date − today (negative in the past, positive in the future)', () => {
    const ms = getMilestones(P, '2024-03-06');
    expect(ms.find((m) => m.id === 'retrieval')!.daysUntil).toBe(diffDays('2024-02-20', '2024-03-06'));
    expect(ms.find((m) => m.id === 'edd')!.daysUntil).toBe(diffDays('2024-11-12', '2024-03-06'));
    expect(ms.find((m) => m.id === 'retrieval')!.daysUntil).toBeLessThan(0);
    expect(ms.find((m) => m.id === 'edd')!.daysUntil).toBeGreaterThan(0);
  });
});

describe('nextMilestone', () => {
  it('is the first non-past milestone (today counts as next)', () => {
    const ms = getMilestones(P, '2024-03-06');
    expect(nextMilestone(ms)!.id).toBe('betaHcg'); // status today
  });

  it('is the earliest future milestone when nothing is today', () => {
    const ms = getMilestones(P, '2024-03-07');
    expect(nextMilestone(ms)!.id).toBe('lastProgesterone');
  });

  it('returns null when all milestones are past', () => {
    const ms = getMilestones(P, '2025-01-01');
    expect(nextMilestone(ms)).toBeNull();
  });
});

describe('fetalSizeForWeek boundaries', () => {
  it('returns null below week 8', () => {
    expect(fetalSizeForWeek(7)).toBeNull();
    expect(fetalSizeForWeek(0)).toBeNull();
  });

  it('returns data at the lower boundary (week 8)', () => {
    expect(fetalSizeForWeek(8)).toEqual({ week: 8, lengthCm: 1.6, weightG: 1 });
  });

  it('returns data at the upper boundary (week 40)', () => {
    expect(fetalSizeForWeek(40)).toEqual({ week: 40, lengthCm: 51.0, weightG: 3619 });
  });

  it('returns null above week 40', () => {
    expect(fetalSizeForWeek(41)).toBeNull();
    expect(fetalSizeForWeek(100)).toBeNull();
  });

  it('has monotonically increasing length across the crown-heel range (14–40)', () => {
    for (let w = 15; w <= 40; w++) {
      expect(fetalSizeForWeek(w)!.lengthCm).toBeGreaterThan(fetalSizeForWeek(w - 1)!.lengthCm);
    }
  });
});
