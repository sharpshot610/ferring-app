// PURE module — no DOM, no localStorage, no clock. today is always a parameter.
// Plain-text schedule summary generator.

import type { Milestone } from './milestones';
import type { Pregnancy } from './calc';
import { gestationalAgeOn } from './calc';

// Fixed English day and month names — no Intl, no new Date() for formatting,
// fully deterministic and timezone-free.
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format an ISODate "YYYY-MM-DD" → "Thu 12 Nov 2026".
 * Uses Date.UTC to get the day-of-week — pure since we pass a specific date.
 */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  // Use Date.UTC so timezone does not affect day-of-week calculation.
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_NAMES[dow]} ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

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
