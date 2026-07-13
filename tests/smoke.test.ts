import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/core/calc';

describe('smoke', () => {
  it('DEFAULT_SETTINGS.betaHcgAfterDay5 === 10', () => {
    expect(DEFAULT_SETTINGS.betaHcgAfterDay5).toBe(10);
  });
});
