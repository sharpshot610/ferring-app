// PURE module — no DOM, no localStorage, no clock. today is always a parameter.
// Plain-text schedule summary generator.

import type { Milestone } from './milestones';
import type { Pregnancy } from './calc';
import { gestationalAgeOn } from './calc';
import { toEpochDay } from './dates';

// Fixed English day and month names — no Intl, no new Date() for formatting,
// fully deterministic and timezone-free.
// Day names are Mon-indexed (Mon=0 … Sun=6) to match the epoch-day formula.
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec',
];

/**
 * Format an ISODate "YYYY-MM-DD" → "Thu 12 Nov 2026".
 * Weekday is computed purely from toEpochDay (no new Date() for formatting).
 * 1970-01-01 was a Thursday (Mon-index 3); formula: ((epochDay % 7) + 10) % 7
 * gives a stable Mon=0 index immune to JS negative-modulo.
 */
export function formatMilestoneDate(iso: string): string {
  const epochDay = toEpochDay(iso);
  // 1970-01-01 is Thu = index 3 in Mon-indexed table.
  // ((epochDay % 7) + 3 + 7) % 7 maps epoch day → Mon-indexed weekday.
  const dowIdx = ((epochDay % 7) + 3 + 7) % 7;
  const [y, m, d] = iso.split('-').map(Number);
  return `${DAY_NAMES[dowIdx]} ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// Keep the module-private alias for use within this file.
const formatDate = formatMilestoneDate;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function scheduleSummaryText(
  p: Pregnancy,
  milestones: Milestone[],
  today: string,
): string {
  const ga = gestationalAgeOn(p, today);
  const gaLine = `Gestational age today: ${ga.weeks}w${pad2(ga.days)}d`;

  // Compute column widths for alignment
  const dateWidth = 'Thu 12 Nov 2026'.length; // fixed: longest possible formatted date
  const formattedDates = milestones.map((ms) => formatDate(ms.date));

  const rows = milestones.map((ms, i) => {
    const dateStr = formattedDates[i].padEnd(dateWidth);
    const label = ms.label + (ms.implied ? ' (estimated)' : '');
    return `  ${dateStr}  ${label}`;
  });

  const lines: string[] = [
    'IVF Wheel — Schedule Summary',
    `Generated ${today}`,
    gaLine,
    '',
    ...rows,
    '',
    'Not medical advice — confirm all dates with your clinic.',
  ];

  return lines.join('\n');
}
