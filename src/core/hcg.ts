// PURE module — no DOM, no clock, no external deps.
//
// hCG doubling-time reference:
//   Barnhart KT et al. (2004). "Symptomatic patients with an early viable
//   intrauterine pregnancy: HCG curves redefined." Obstetrics & Gynecology,
//   104(1), 50–55. Early hCG typically doubles every 48–72 hours.
//
// Assessment thresholds (reassuring ≤72h, borderline 72–96h, slow >96h) are
// derived from standard early-pregnancy monitoring guidelines.
//
// IMPORTANT: This module is INFORMATIONAL ONLY and does NOT constitute medical
// advice or clinical diagnosis. All results must be interpreted by a qualified
// healthcare provider.

import { toEpochDay } from './dates';

export interface HcgReading {
  value: number;
  date: string; // ISODate "YYYY-MM-DD"
  hourOfDay: number; // 0–23
}

export interface DoublingResult {
  hours: number;
  assessment: 'reassuring' | 'borderline' | 'slow';
  hoursBetween: number;
}

/** Calculates the hCG doubling time between two serial readings.
 *
 *  Throws if:
 *  - hoursBetween <= 0 (second reading must be after first)
 *  - either value <= 0
 *  - second.value <= first.value (doubling time is undefined for non-rising values)
 */
export function hcgDoublingTime(
  first: HcgReading,
  second: HcgReading,
): DoublingResult {
  if (!Number.isFinite(first.value) || !Number.isFinite(second.value)) {
    throw new Error(
      'Please enter a numeric hCG value for both readings.',
    );
  }

  if (first.value <= 0 || second.value <= 0) {
    throw new Error(
      'hCG values must be greater than zero. Please check the readings.',
    );
  }

  if (!Number.isFinite(first.hourOfDay) || !Number.isFinite(second.hourOfDay)) {
    throw new Error(
      'Please enter a numeric hCG value for both readings.',
    );
  }

  const hoursBetween =
    (toEpochDay(second.date) - toEpochDay(first.date)) * 24 +
    (second.hourOfDay - first.hourOfDay);

  if (hoursBetween <= 0) {
    throw new Error(
      `Second reading must be taken after the first (hoursBetween: ${hoursBetween}). ` +
        'Please verify the dates and times.',
    );
  }

  if (second.value <= first.value) {
    throw new Error(
      'Doubling time is undefined for non-rising hCG values. ' +
        'Please consult your clinic — a non-rising hCG requires clinical evaluation.',
    );
  }

  const hours =
    (hoursBetween * Math.log(2)) / Math.log(second.value / first.value);

  const assessment: DoublingResult['assessment'] =
    hours <= 72 ? 'reassuring' : hours <= 96 ? 'borderline' : 'slow';

  return { hours, assessment, hoursBetween };
}
