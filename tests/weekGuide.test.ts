import { describe, it, expect } from 'vitest';
import { weekGuideFor } from '../src/core/weekGuide';

describe('weekGuideFor — boundaries', () => {
  it('returns null for week 3 (below range)', () => {
    expect(weekGuideFor(3)).toBeNull();
  });

  it('returns a valid guide for week 4 (lower bound)', () => {
    const g = weekGuideFor(4);
    expect(g).not.toBeNull();
    expect(g!.week).toBe(4);
  });

  it('returns a valid guide for week 40 (upper bound)', () => {
    const g = weekGuideFor(40);
    expect(g).not.toBeNull();
    expect(g!.week).toBe(40);
  });

  it('returns null for week 41 (above range)', () => {
    expect(weekGuideFor(41)).toBeNull();
  });
});

describe('weekGuideFor — every week 4–40 has non-empty comparison and note', () => {
  for (let w = 4; w <= 40; w++) {
    it(`week ${w} has non-empty comparison and note`, () => {
      const g = weekGuideFor(w);
      expect(g).not.toBeNull();
      expect(g!.week).toBe(w);
      expect(typeof g!.comparison).toBe('string');
      expect(g!.comparison.trim().length).toBeGreaterThan(0);
      expect(typeof g!.note).toBe('string');
      expect(g!.note.trim().length).toBeGreaterThan(0);
    });
  }
});

describe('weekGuideFor — determinism', () => {
  it('returns identical objects on repeated calls for the same week', () => {
    const a = weekGuideFor(20);
    const b = weekGuideFor(20);
    expect(a).toEqual(b);
  });

  it('returns null consistently for out-of-range weeks', () => {
    expect(weekGuideFor(0)).toBeNull();
    expect(weekGuideFor(0)).toBeNull();
    expect(weekGuideFor(41)).toBeNull();
    expect(weekGuideFor(41)).toBeNull();
  });
});
