// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.

import type { ISODate } from './dates';
import { addDays, diffDays } from './dates';

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

// Additional offsets from LMP, kept here so the day-offset numbers never appear
// inlined outside this module.
export const RETRIEVAL_FROM_LMP = 14;                 // retrieval = lmp + 14
export const TRIMESTER1_END_FROM_LMP = 13 * 7 + 6;    // = 97 (end of 13w6d)
export const TRIMESTER2_END_FROM_LMP = 27 * 7 + 6;    // = 195 (end of 27w6d)

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
  const s: Settings = { ...DEFAULT_SETTINGS, ...settings };

  // Canonicalize every anchor to LMP first; everything else derives from LMP by
  // exact integer offsets, so round-trips are exact.
  const lmp = lmpFromAnchor(anchor);

  const edd = addDays(lmp, EDD_FROM_LMP);
  const retrieval = addDays(lmp, RETRIEVAL_FROM_LMP);
  const transferDay3 = addDays(edd, -EDD_FROM_DAY3);
  const transferDay5 = addDays(edd, -EDD_FROM_DAY5);
  const trimester1End = addDays(lmp, TRIMESTER1_END_FROM_LMP);
  const trimester2End = addDays(lmp, TRIMESTER2_END_FROM_LMP);
  const lastProgesterone = addDays(
    lmp,
    7 * s.lastProgesteroneGA.weeks + s.lastProgesteroneGA.days,
  );

  let betaHcg: ISODate;
  if (anchor.type === 'transfer_day3') {
    betaHcg = addDays(anchor.date, s.betaHcgAfterDay3);
  } else if (anchor.type === 'transfer_day5') {
    betaHcg = addDays(anchor.date, s.betaHcgAfterDay5);
  } else {
    // Estimated: assume a day-5 transfer. The UI labels this; core just computes.
    betaHcg = addDays(transferDay5, s.betaHcgAfterDay5);
  }

  return {
    lmp,
    edd,
    retrieval,
    transferDay3,
    transferDay5,
    betaHcg,
    lastProgesterone,
    trimester1End,
    trimester2End,
    anchorType: anchor.type,
  };
}

function lmpFromAnchor(anchor: Anchor): ISODate {
  switch (anchor.type) {
    case 'retrieval':
      return addDays(anchor.date, LMP_FROM_RETRIEVAL);
    case 'lmp':
      return anchor.date;
    case 'transfer_day3':
      // edd = date + EDD_FROM_DAY3 → lmp = edd − 280
      return addDays(addDays(anchor.date, EDD_FROM_DAY3), -EDD_FROM_LMP);
    case 'transfer_day5':
      return addDays(addDays(anchor.date, EDD_FROM_DAY5), -EDD_FROM_LMP);
    case 'edd':
      return addDays(anchor.date, -EDD_FROM_LMP);
    case 'ga_on_date': {
      if (!anchor.ga) {
        throw new Error("Anchor type 'ga_on_date' requires a `ga` value.");
      }
      return addDays(anchor.date, -(7 * anchor.ga.weeks + anchor.ga.days));
    }
  }
}

export interface GA {
  weeks: number;
  days: number;
  totalDays: number;
}

export function gestationalAgeOn(p: Pregnancy, date: ISODate): GA {
  const totalDays = diffDays(date, p.lmp); // may be negative
  return gaFromTotalDays(totalDays);
}

export function conceptionalAgeOn(p: Pregnancy, date: ISODate): GA {
  // Conceptional age = gestational age minus 14 days.
  const totalDays = diffDays(date, p.lmp) - 14;
  return gaFromTotalDays(totalDays);
}

// weeks = Math.floor(totalDays/7); days = totalDays − 7·weeks (always 0–6, weeks
// may be negative). This keeps `days` in 0–6 even for dates before the LMP.
function gaFromTotalDays(totalDays: number): GA {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays - 7 * weeks;
  return { weeks, days, totalDays };
}

export function dateRangeForGestationalWeek(p: Pregnancy, week: number): { start: ISODate; end: ISODate } {
  // Week N = "N weeks + 0..6 days".
  const start = addDays(p.lmp, 7 * week);
  const end = addDays(start, 6);
  return { start, end };
}
