import { useState } from 'preact/hooks';
import type { Milestone } from '../core/milestones';
import { nextMilestone } from '../core/milestones';
import { monthGridFor, monthOf, addMonths } from '../core/monthGrid';
import { todayLocalISO } from '../core/dates';
import type { ISODate } from '../core/dates';
import { CalendarGrid } from './CalendarGrid';
import { formatMilestoneDate } from '../core/summary';

// ─── CalendarScreen ───────────────────────────────────────────────────────────
// Full-page calendar view showing milestones plotted as dots on a month grid.
// Month nav is CLAMPED to [month of first milestone … month of last milestone].
// Initial month = month of nextMilestone (or today if all past).

interface Props {
  milestones: Milestone[];
  today: string;
  onBack: () => void;
  onExport: () => void;
}

function isoToYM(date: ISODate) {
  return monthOf(date);
}

export function CalendarScreen({ milestones, today, onBack, onExport }: Props) {
  // Clamp range
  const sortedDates = [...milestones].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = sortedDates[0]?.date;
  const lastDate = sortedDates[sortedDates.length - 1]?.date;

  const minYM = firstDate ? isoToYM(firstDate) : isoToYM(today as ISODate);
  const maxYM = lastDate ? isoToYM(lastDate) : isoToYM(today as ISODate);

  // Initial month: next milestone or today
  function initialYM() {
    const next = nextMilestone(milestones);
    if (next) return monthOf(next.date as ISODate);
    try { return monthOf(todayLocalISO()); } catch {
      const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() + 1 };
    }
  }

  const init = initialYM();
  // Clamp initial month to [min, max]
  const clamp = (ym: { year: number; month: number }) => {
    const val = ym.year * 12 + ym.month;
    const lo = minYM.year * 12 + minYM.month;
    const hi = maxYM.year * 12 + maxYM.month;
    if (val < lo) return minYM;
    if (val > hi) return maxYM;
    return ym;
  };

  const startYM = clamp(init);
  const [navYear, setNavYear] = useState(startYM.year);
  const [navMonth, setNavMonth] = useState(startYM.month);

  const atMin = navYear * 12 + navMonth <= minYM.year * 12 + minYM.month;
  const atMax = navYear * 12 + navMonth >= maxYM.year * 12 + maxYM.month;

  function prevMonth() {
    if (atMin) return;
    const { year, month } = addMonths(navYear, navMonth, -1);
    setNavYear(year);
    setNavMonth(month);
  }

  function nextMonth() {
    if (atMax) return;
    const { year, month } = addMonths(navYear, navMonth, 1);
    setNavYear(year);
    setNavMonth(month);
  }

  // Build markers map
  const markers = new Map<ISODate, string[]>();
  for (const m of milestones) {
    const d = m.date as ISODate;
    const existing = markers.get(d) ?? [];
    existing.push(m.label);
    markers.set(d, existing);
  }

  const grid = monthGridFor(navYear, navMonth);

  // Milestones visible in current month's grid (including out-of-month padding cells)
  const gridDates = new Set(grid.weeks.flatMap(w => w.map(c => c.date)));
  const visibleMilestones = milestones.filter(m => gridDates.has(m.date));

  let todayStr: ISODate;
  try { todayStr = todayLocalISO(); } catch {
    todayStr = new Date().toISOString().slice(0, 10) as ISODate;
  }

  return (
    <div class="screen-content">
      <div class="card cal-screen">
        <div class="cal-screen__header">
          <button
            type="button"
            class="dp-nav-btn"
            onClick={prevMonth}
            disabled={atMin}
            aria-label="Previous month"
            aria-disabled={atMin}
          >
            ‹
          </button>
          <span class="cal-screen__month-label">{grid.label}</span>
          <button
            type="button"
            class="dp-nav-btn"
            onClick={nextMonth}
            disabled={atMax}
            aria-label="Next month"
            aria-disabled={atMax}
          >
            ›
          </button>
        </div>

        <CalendarGrid
          grid={grid}
          today={todayStr}
          markers={markers}
          cellSize="full"
        />

        {/* Legend for this month's milestones */}
        {visibleMilestones.length > 0 && (
          <ul class="cal-legend" aria-label="Milestones this month">
            {visibleMilestones.map(m => (
              <li key={m.id} class={`cal-legend__item cal-legend__item--${m.status}`}>
                <span class="cal-legend__dot" aria-hidden="true">●</span>
                <span class="cal-legend__text">
                  {formatMilestoneDate(m.date)} — {m.label}
                  {m.implied && (
                    <span class="tip" data-tip="Estimated from the date you entered, not one you confirmed"> (implied)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div class="action-row">
        <button type="button" class="btn btn--secondary" onClick={onBack}>
          ← Back to schedule
        </button>
        <button type="button" class="btn btn--primary" onClick={onExport}>
          Continue to export →
        </button>
      </div>
    </div>
  );
}
