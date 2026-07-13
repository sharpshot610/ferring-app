// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.

import type { ISODate } from './dates';

export type AnchorType = 'retrieval' | 'lmp' | 'transfer_day3' | 'transfer_day5' | 'edd' | 'ga_on_date';

export interface Anchor {
  type: AnchorType;
  date: ISODate;
  ga?: { weeks: number; days: number };
}

export interface Settings {
  betaHcgAfterDay5: number;   // default 10
  betaHcgAfterDay3: number;   // default 12
  lastProgesteroneGA: { weeks: number; days: number }; // default {weeks:10, days:0}
  transferKind: 'fresh' | 'frozen' | 'unknown';        // default 'unknown'
}

export const DEFAULT_SETTINGS: Settings = {
  betaHcgAfterDay5: 10,
  betaHcgAfterDay3: 12,
  lastProgesteroneGA: { weeks: 10, days: 0 },
  transferKind: 'unknown',
};

export const EDD_FROM_RETRIEVAL = 266;
export const EDD_FROM_LMP = 280;
export const EDD_FROM_DAY3 = 263;
export const EDD_FROM_DAY5 = 261;
export const LMP_FROM_RETRIEVAL = -14;

export interface Pregnancy {
  lmp: ISODate;
  edd: ISODate;
  retrieval: ISODate;
  transferDay3: ISODate;
  transferDay5: ISODate;
  betaHcg: ISODate;
  lastProgesterone: ISODate;
  trimester1End: ISODate;
  trimester2End: ISODate;
  anchorType: AnchorType;
}

export function computePregnancy(anchor: Anchor, settings?: Partial<Settings>): Pregnancy {
  throw new Error('unimplemented');
}

export interface GA {
  weeks: number;
  days: number;
  totalDays: number;
}

export function gestationalAgeOn(p: Pregnancy, date: ISODate): GA {
  throw new Error('unimplemented');
}

export function conceptionalAgeOn(p: Pregnancy, date: ISODate): GA {
  throw new Error('unimplemented');
}

export function dateRangeForGestationalWeek(p: Pregnancy, week: number): { start: ISODate; end: ISODate } {
  throw new Error('unimplemented');
}
