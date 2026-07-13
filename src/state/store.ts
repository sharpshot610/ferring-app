import { useState, useEffect } from 'preact/hooks';
import type { Anchor, Settings } from '../core/calc';
import { DEFAULT_SETTINGS } from '../core/calc';

export type Theme = 'system' | 'light' | 'dark';

export interface AppState {
  version: 1;
  anchor: Anchor | null;
  settings: Settings;
  theme: Theme;
}

const STORAGE_KEY = 'ferring-app:v1';

const DEFAULT_STATE: AppState = {
  version: 1,
  anchor: null,
  settings: { ...DEFAULT_SETTINGS },
  theme: 'system',
};

function isValidAnchorType(t: unknown): boolean {
  return (
    t === 'retrieval' ||
    t === 'lmp' ||
    t === 'transfer_day3' ||
    t === 'transfer_day5' ||
    t === 'edd' ||
    t === 'ga_on_date'
  );
}

/** Safe GA field: integer, non-negative, weeks ≤ 45, days 0–6. */
function isValidGAWeeks(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 45;
}

function isValidGADays(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6;
}

/** Safe betaHcg offset: integer, 1–30. */
function isValidBetaOffset(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 30;
}

export function isValidAnchor(a: unknown): a is Anchor {
  if (!a || typeof a !== 'object') return false;
  const obj = a as Record<string, unknown>;
  if (!isValidAnchorType(obj.type)) return false;
  if (typeof obj.date !== 'string') return false;
  if (obj.type === 'ga_on_date') {
    if (!obj.ga || typeof obj.ga !== 'object') return false;
    const ga = obj.ga as Record<string, unknown>;
    if (!isValidGAWeeks(ga.weeks) || !isValidGADays(ga.days)) return false;
  }
  return true;
}

export function isValidSettings(s: unknown): s is Settings {
  if (!s || typeof s !== 'object') return false;
  const obj = s as Record<string, unknown>;
  if (!isValidBetaOffset(obj.betaHcgAfterDay5)) return false;
  if (!isValidBetaOffset(obj.betaHcgAfterDay3)) return false;
  if (
    obj.transferKind !== 'fresh' &&
    obj.transferKind !== 'frozen' &&
    obj.transferKind !== 'unknown'
  ) return false;
  if (!obj.lastProgesteroneGA || typeof obj.lastProgesteroneGA !== 'object') return false;
  const ga = obj.lastProgesteroneGA as Record<string, unknown>;
  if (!isValidGAWeeks(ga.weeks) || !isValidGADays(ga.days)) return false;
  return true;
}

export function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, settings: { ...DEFAULT_SETTINGS } };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version !== 1) return { ...DEFAULT_STATE, settings: { ...DEFAULT_SETTINGS } };
    const anchor = isValidAnchor(parsed.anchor) ? parsed.anchor : null;
    const settings = isValidSettings(parsed.settings) ? parsed.settings : { ...DEFAULT_SETTINGS };
    const theme: Theme =
      parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system'
        ? (parsed.theme as Theme)
        : 'system';
    return { version: 1, anchor, settings, theme };
  } catch {
    return { ...DEFAULT_STATE, settings: { ...DEFAULT_SETTINGS } };
  }
}

export function save(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — not a crash condition
  }
}

export function usePersistedState(): [AppState, (update: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>(() => load());

  useEffect(() => {
    save(state);
  }, [state]);

  const update = (partial: Partial<AppState>) => {
    setState(prev => {
      const next = { ...prev, ...partial };
      return next;
    });
  };

  return [state, update];
}
