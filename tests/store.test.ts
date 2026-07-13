// Tests for the pure validation logic exported from store.ts.
// vitest runs in Node — no real localStorage — so we test isValidSettings and
// isValidAnchor directly (the pure guard functions exported for testability).

import { describe, it, expect } from 'vitest';
import { isValidSettings, isValidAnchor } from '../src/state/store';
import { DEFAULT_SETTINGS } from '../src/core/calc';

describe('isValidSettings — rejects bad GA numbers in lastProgesteroneGA', () => {
  function baseSettings() {
    return {
      betaHcgAfterDay5: 10,
      betaHcgAfterDay3: 12,
      transferKind: 'unknown',
      lastProgesteroneGA: { weeks: 10, days: 0 },
    };
  }

  it('accepts default settings', () => {
    expect(isValidSettings(DEFAULT_SETTINGS)).toBe(true);
  });

  it('rejects weeks: 1e309 (Infinity after JSON parse)', () => {
    const s = { ...baseSettings(), lastProgesteroneGA: { weeks: 1e309, days: 0 } };
    expect(isValidSettings(s)).toBe(false);
  });

  it('rejects weeks: NaN', () => {
    const s = { ...baseSettings(), lastProgesteroneGA: { weeks: NaN, days: 0 } };
    expect(isValidSettings(s)).toBe(false);
  });

  it('rejects weeks: -1 (negative)', () => {
    const s = { ...baseSettings(), lastProgesteroneGA: { weeks: -1, days: 0 } };
    expect(isValidSettings(s)).toBe(false);
  });

  it('rejects weeks: 3.5 (fractional)', () => {
    const s = { ...baseSettings(), lastProgesteroneGA: { weeks: 3.5, days: 0 } };
    expect(isValidSettings(s)).toBe(false);
  });

  it('rejects weeks: 46 (above max)', () => {
    const s = { ...baseSettings(), lastProgesteroneGA: { weeks: 46, days: 0 } };
    expect(isValidSettings(s)).toBe(false);
  });

  it('rejects days: 7 (above max)', () => {
    const s = { ...baseSettings(), lastProgesteroneGA: { weeks: 10, days: 7 } };
    expect(isValidSettings(s)).toBe(false);
  });
});

describe('isValidSettings — rejects bad betaHcg offsets', () => {
  function baseSettings() {
    return {
      betaHcgAfterDay5: 10,
      betaHcgAfterDay3: 12,
      transferKind: 'unknown',
      lastProgesteroneGA: { weeks: 10, days: 0 },
    };
  }

  it('rejects betaHcgAfterDay5: -2', () => {
    expect(isValidSettings({ ...baseSettings(), betaHcgAfterDay5: -2 })).toBe(false);
  });

  it('rejects betaHcgAfterDay5: 0', () => {
    expect(isValidSettings({ ...baseSettings(), betaHcgAfterDay5: 0 })).toBe(false);
  });

  it('rejects betaHcgAfterDay5: 31 (above max)', () => {
    expect(isValidSettings({ ...baseSettings(), betaHcgAfterDay5: 31 })).toBe(false);
  });

  it('rejects betaHcgAfterDay3: NaN', () => {
    expect(isValidSettings({ ...baseSettings(), betaHcgAfterDay3: NaN })).toBe(false);
  });

  it('rejects betaHcgAfterDay5: 1.5 (fractional)', () => {
    expect(isValidSettings({ ...baseSettings(), betaHcgAfterDay5: 1.5 })).toBe(false);
  });

  it('accepts betaHcgAfterDay5: 1 (minimum valid)', () => {
    expect(isValidSettings({ ...baseSettings(), betaHcgAfterDay5: 1 })).toBe(true);
  });

  it('accepts betaHcgAfterDay5: 30 (maximum valid)', () => {
    expect(isValidSettings({ ...baseSettings(), betaHcgAfterDay5: 30 })).toBe(true);
  });
});

describe('isValidSettings — valid blob round-trips', () => {
  it('round-trips a JSON blob with all valid fields', () => {
    const blob = JSON.stringify({
      betaHcgAfterDay5: 10,
      betaHcgAfterDay3: 12,
      transferKind: 'frozen',
      lastProgesteroneGA: { weeks: 10, days: 0 },
    });
    expect(isValidSettings(JSON.parse(blob))).toBe(true);
  });
});

describe('isValidAnchor — rejects bad ga values in ga_on_date', () => {
  it('rejects weeks: Infinity', () => {
    expect(isValidAnchor({ type: 'ga_on_date', date: '2024-01-01', ga: { weeks: Infinity, days: 0 } })).toBe(false);
  });

  it('rejects weeks: -1', () => {
    expect(isValidAnchor({ type: 'ga_on_date', date: '2024-01-01', ga: { weeks: -1, days: 0 } })).toBe(false);
  });

  it('rejects weeks: 3.5 (fractional)', () => {
    expect(isValidAnchor({ type: 'ga_on_date', date: '2024-01-01', ga: { weeks: 3.5, days: 0 } })).toBe(false);
  });

  it('rejects days: 7', () => {
    expect(isValidAnchor({ type: 'ga_on_date', date: '2024-01-01', ga: { weeks: 10, days: 7 } })).toBe(false);
  });

  it('rejects weeks: 1e309 (Infinity after JSON round-trip)', () => {
    const parsed = JSON.parse('{"type":"ga_on_date","date":"2024-01-01","ga":{"weeks":1e309,"days":0}}');
    expect(isValidAnchor(parsed)).toBe(false);
  });

  it('accepts a valid ga_on_date anchor', () => {
    expect(isValidAnchor({ type: 'ga_on_date', date: '2024-01-01', ga: { weeks: 10, days: 3 } })).toBe(true);
  });

  it('accepts a non-ga anchor (no ga field needed)', () => {
    expect(isValidAnchor({ type: 'retrieval', date: '2024-01-01' })).toBe(true);
  });
});
