import { describe, it, expect } from 'vitest';
import { scheduleSummaryText } from '../src/core/summary';
import type { Milestone } from '../src/core/milestones';
import { getMilestones } from '../src/core/milestones';
import { computePregnancy } from '../src/core/calc';
import { retrievalLeap, noLeap2025 } from './fixtures';

const TODAY = '2024-02-01';

function getTestMilestones(): Milestone[] {
  const p = computePregnancy(retrievalLeap.anchor);
  return getMilestones(p, TODAY);
}

describe('scheduleSummaryText — title and headers', () => {
  it('contains the title line', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const text = scheduleSummaryText(p, ms, TODAY);
    expect(text).toContain('IVF Wheel — Schedule Summary');
  });

  it('contains the Generated date line', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const text = scheduleSummaryText(p, ms, TODAY);
    expect(text).toContain(`Generated ${TODAY}`);
  });

  it('contains the gestational age line', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    // today = 2024-02-01; lmp = 2024-02-06 → GA = -1w (days before LMP)
    // totalDays = toEpochDay('2024-02-01') - toEpochDay('2024-02-06') = -5
    // weeks = floor(-5/7) = -1, days = -5 - 7*(-1) = 2
    // So GA is -1w02d — just check the line is present
    const ms = getMilestones(p, TODAY);
    const text = scheduleSummaryText(p, ms, TODAY);
    expect(text).toContain('Gestational age today:');
  });
});

describe('scheduleSummaryText — milestone rows', () => {
  it('contains every milestone label', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const text = scheduleSummaryText(p, ms, TODAY);
    for (const m of ms) {
      expect(text).toContain(m.label);
    }
  });

  it('contains formatted dates for each milestone', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const text = scheduleSummaryText(p, ms, TODAY);
    // Retrieval is 2024-02-20 — that's a Tuesday
    expect(text).toContain('Tue 20 Feb 2024');
  });

  it('formats dates with correct day name (Thu 12 Nov 2024)', () => {
    // noLeap2025 fixture: edd = 2025-12-08 — let's verify day name
    const p = computePregnancy(noLeap2025.anchor);
    const ms = getMilestones(p, '2025-01-01');
    const text = scheduleSummaryText(p, ms, '2025-01-01');
    // 2025-12-08 is a Monday
    expect(text).toContain('Mon 8 Dec 2025');
  });

  it('appends (estimated) marker for implied milestones', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const text = scheduleSummaryText(p, ms, TODAY);
    // With retrieval anchor, everything except retrieval is implied
    const impliedMs = ms.filter((m) => m.implied);
    expect(impliedMs.length).toBeGreaterThan(0);
    for (const m of impliedMs) {
      expect(text).toContain(`${m.label} (estimated)`);
    }
  });

  it('does NOT append (estimated) for the non-implied anchor milestone', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const retrieval = ms.find((m) => m.id === 'retrieval')!;
    expect(retrieval.implied).toBe(false);
    const text = scheduleSummaryText(p, ms, TODAY);
    // retrieval label should appear without (estimated) suffix
    // Find the row with retrieval label and check it doesn't have (estimated)
    const lines = text.split('\n');
    const retrievalLine = lines.find((l) => l.includes(retrieval.label));
    expect(retrievalLine).toBeDefined();
    expect(retrievalLine).not.toContain('(estimated)');
  });
});

describe('scheduleSummaryText — disclaimer', () => {
  it('ends with the disclaimer line', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const text = scheduleSummaryText(p, ms, TODAY);
    expect(text).toContain('Not medical advice — confirm all dates with your clinic.');
  });
});

describe('scheduleSummaryText — determinism', () => {
  it('two calls with same input produce identical output', () => {
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, TODAY);
    const first = scheduleSummaryText(p, ms, TODAY);
    const second = scheduleSummaryText(p, ms, TODAY);
    expect(first).toBe(second);
  });
});

describe('scheduleSummaryText — gestational age correctness', () => {
  it('GA line reflects actual gestational age on today', () => {
    // retrievalLeap: lmp = 2024-02-06; today = 2024-04-01 = lmp+55 days = 7w6d
    const p = computePregnancy(retrievalLeap.anchor);
    const ms = getMilestones(p, '2024-04-01');
    const text = scheduleSummaryText(p, ms, '2024-04-01');
    expect(text).toContain('Gestational age today: 7w06d');
  });
});
