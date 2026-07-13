import { describe, it, expect } from 'vitest';
import { hcgDoublingTime } from '../src/core/hcg';
import type { HcgReading } from '../src/core/hcg';

// ── helpers ───────────────────────────────────────────────────────────────────

function reading(date: string, value: number, hourOfDay = 0): HcgReading {
  return { date, value, hourOfDay };
}

// ── exact doubling in 48h ─────────────────────────────────────────────────────

describe('hcgDoublingTime — exact 48h doubling → reassuring', () => {
  it('100 → 200 two days apart same hour gives hours=48 and reassuring', () => {
    const r = hcgDoublingTime(
      reading('2024-03-01', 100, 9),
      reading('2024-03-03', 200, 9),
    );
    expect(r.hoursBetween).toBe(48);
    expect(r.hours).toBeCloseTo(48, 6);
    expect(r.assessment).toBe('reassuring');
  });
});

// ── slow case (>96h) ──────────────────────────────────────────────────────────

describe('hcgDoublingTime — slow assessment', () => {
  it('100 → 110 over 4 days (96h) gives >96h and slow', () => {
    // doubling time = 96 * ln2 / ln(110/100) ≈ 664h — well into slow
    const r = hcgDoublingTime(
      reading('2024-03-01', 100, 0),
      reading('2024-03-05', 110, 0),
    );
    expect(r.hoursBetween).toBe(96);
    expect(r.hours).toBeGreaterThan(96);
    expect(r.assessment).toBe('slow');
  });
});

// ── borderline case (72 < hours ≤ 96) ────────────────────────────────────────

describe('hcgDoublingTime — borderline assessment', () => {
  it('100 → 133 over 3 days (72h) gives ≈72h boundary', () => {
    // ln(2) / ln(133/100) * 72 ≈ 72h → on the edge, let's use a case clearly borderline
    // 100 → 160 over 96h: doubling = 96 * ln2/ln(1.6) ≈ 143h — that's slow
    // Better: 100 → 200 over 80h: doubling = 80h → borderline
    // Use day gap + hour offsets: 3 days + 8h = 80h between
    const r = hcgDoublingTime(
      reading('2024-03-01', 100, 0),
      reading('2024-03-04', 200, 8),
    );
    expect(r.hoursBetween).toBe(80);
    expect(r.hours).toBeCloseTo(80, 6);
    expect(r.assessment).toBe('borderline');
  });

  it('72h < doubling ≤ 96h is classified borderline', () => {
    // 100 → 200 over 90h: doubling = 90h → borderline
    const r = hcgDoublingTime(
      reading('2024-03-01', 100, 0),
      reading('2024-03-04', 200, 18),
    );
    expect(r.hoursBetween).toBe(90);
    expect(r.hours).toBeCloseTo(90, 6);
    expect(r.assessment).toBe('borderline');
  });
});

// ── hourOfDay handling ────────────────────────────────────────────────────────

describe('hcgDoublingTime — hourOfDay arithmetic', () => {
  it('same day different hours: 100 → 200 taken 12h apart is reassuring', () => {
    const r = hcgDoublingTime(
      reading('2024-03-01', 100, 6),
      reading('2024-03-01', 200, 18),
    );
    expect(r.hoursBetween).toBe(12);
    expect(r.hours).toBeCloseTo(12, 6);
    expect(r.assessment).toBe('reassuring');
  });

  it('crossing days with hour offsets: day+2 09:00 vs 15:00 start = 42h', () => {
    // first at 2024-03-01 15:00, second at 2024-03-03 09:00
    // hoursBetween = (3 - 1) * 24 + (9 - 15) = 48 - 6 = 42
    const r = hcgDoublingTime(
      reading('2024-03-01', 100, 15),
      reading('2024-03-03', 200, 9),
    );
    expect(r.hoursBetween).toBe(42);
    expect(r.hours).toBeCloseTo(42, 6);
    expect(r.assessment).toBe('reassuring');
  });
});

// ── boundary: exactly 72h doubling is reassuring ─────────────────────────────

describe('hcgDoublingTime — assessment boundary at 72h', () => {
  it('doubling in exactly 72h is classified reassuring', () => {
    const r = hcgDoublingTime(
      reading('2024-03-01', 100, 0),
      reading('2024-03-04', 200, 0),
    );
    expect(r.hoursBetween).toBe(72);
    expect(r.hours).toBeCloseTo(72, 6);
    expect(r.assessment).toBe('reassuring');
  });
});

// ── non-finite value guards (NaN / Infinity) ──────────────────────────────────

describe('hcgDoublingTime — throws on non-finite hCG values', () => {
  it('throws when first.value is NaN (e.g. from parseFloat(""))', () => {
    expect(() =>
      hcgDoublingTime(reading('2024-03-01', NaN, 9), reading('2024-03-03', 200, 9)),
    ).toThrow('Please enter a numeric hCG value for both readings.');
  });

  it('throws when second.value is NaN', () => {
    expect(() =>
      hcgDoublingTime(reading('2024-03-01', 100, 9), reading('2024-03-03', NaN, 9)),
    ).toThrow('Please enter a numeric hCG value for both readings.');
  });

  it('throws when first.value is Infinity', () => {
    expect(() =>
      hcgDoublingTime(reading('2024-03-01', Infinity, 9), reading('2024-03-03', 200, 9)),
    ).toThrow('Please enter a numeric hCG value for both readings.');
  });

  it('throws when hourOfDay is NaN (e.g. from parseInt("", 10) = NaN)', () => {
    expect(() =>
      hcgDoublingTime(reading('2024-03-01', 100, NaN), reading('2024-03-03', 200, 9)),
    ).toThrow('Please enter a numeric hCG value for both readings.');
  });
});

// ── error conditions ──────────────────────────────────────────────────────────

describe('hcgDoublingTime — throws on invalid inputs', () => {
  it('throws when hoursBetween <= 0 (second before first)', () => {
    expect(() =>
      hcgDoublingTime(
        reading('2024-03-03', 200, 0),
        reading('2024-03-01', 400, 0),
      ),
    ).toThrow();
  });

  it('throws when first.value <= 0', () => {
    expect(() =>
      hcgDoublingTime(reading('2024-03-01', 0, 0), reading('2024-03-03', 200, 0)),
    ).toThrow();
  });

  it('throws when second.value <= 0', () => {
    expect(() =>
      hcgDoublingTime(reading('2024-03-01', 100, 0), reading('2024-03-03', -5, 0)),
    ).toThrow();
  });

  it('throws with a clinic-referral message when hCG is not rising', () => {
    expect(() =>
      hcgDoublingTime(
        reading('2024-03-01', 500, 0),
        reading('2024-03-03', 300, 0),
      ),
    ).toThrowError(/consult.*clinic/i);
  });

  it('throws when second.value equals first.value (not rising)', () => {
    expect(() =>
      hcgDoublingTime(
        reading('2024-03-01', 200, 0),
        reading('2024-03-03', 200, 0),
      ),
    ).toThrow();
  });
});
