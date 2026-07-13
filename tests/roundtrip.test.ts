import { describe, it, expect } from 'vitest';
import {
  computePregnancy,
  gestationalAgeOn,
  type Anchor,
  type Pregnancy,
} from '../src/core/calc';
import { addDays, fromEpochDay, toEpochDay } from '../src/core/dates';
import { allFixtures } from './fixtures';

// Strip anchorType so we can compare the canonical derived fields regardless of
// which anchor produced them.
function withoutAnchorType(p: Pregnancy): Omit<Pregnancy, 'anchorType'> {
  const { anchorType: _drop, ...rest } = p;
  return rest;
}

// Re-anchor a computed pregnancy from each of its derived fields and assert the
// full Pregnancy (minus anchorType) is identical, all six ways.
function assertRoundTrips(base: Pregnancy, arbitraryDate: string) {
  const canonical = withoutAnchorType(base);

  const ga = gestationalAgeOn(base, arbitraryDate);

  const reanchors: Anchor[] = [
    { type: 'edd', date: base.edd },
    { type: 'lmp', date: base.lmp },
    { type: 'transfer_day3', date: base.transferDay3 },
    { type: 'transfer_day5', date: base.transferDay5 },
    { type: 'ga_on_date', date: arbitraryDate, ga: { weeks: ga.weeks, days: ga.days } },
  ];

  for (const anchor of reanchors) {
    const p = computePregnancy(anchor);
    expect(withoutAnchorType(p), `re-anchored via ${anchor.type}`).toEqual(canonical);
  }
}

describe('re-anchoring round-trips (all fixtures, all 6 ways)', () => {
  for (const f of allFixtures) {
    it(f.name, () => {
      // Start from retrieval so all five re-anchors are independent derivations.
      const base = computePregnancy({ type: 'retrieval', date: f.expected.retrieval });
      // sanity: retrieval-anchored base matches fixture (minus anchorType)
      expect(withoutAnchorType(base)).toEqual(withoutAnchorType(f.expected));
      // arbitrary date well inside the pregnancy for the GA re-anchor
      assertRoundTrips(base, addDays(base.lmp, 123));
    });
  }
});

// Deterministic (no Math.random) LCG so the sweep is reproducible.
function makeLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('seeded sweep of 50 retrieval dates (2023–2027)', () => {
  it('round-trips all 6 ways for each', () => {
    const rand = makeLcg(0xc0ffee);
    const lo = toEpochDay('2023-01-01');
    const hi = toEpochDay('2027-12-31');
    const span = hi - lo;

    for (let i = 0; i < 50; i++) {
      const retrieval = fromEpochDay(lo + Math.floor(rand() * (span + 1)));
      const base = computePregnancy({ type: 'retrieval', date: retrieval });
      // vary the GA re-anchor date deterministically too
      const gaDate = addDays(base.lmp, 30 + Math.floor(rand() * 200));
      assertRoundTrips(base, gaDate);
    }
  });
});
