import { useEffect, useRef } from 'preact/hooks';
import type { MonthGrid } from '../core/monthGrid';
import type { ISODate } from '../core/dates';

// ─── CalendarGrid ─────────────────────────────────────────────────────────────
// Shared component for the custom date picker popup AND the full calendar screen.
// Props:
//   grid       — from monthGridFor(year, month)
//   today      — ISO date for "today" highlight (chartreuse outline)
//   selected   — ISO date for the selected cell (burgundy fill)
//   markers    — Map<ISODate, string[]> milestone labels per date (chartreuse dots)
//   onSelectDay — called when a day cell button is clicked
//   cellSize   — 'compact' (picker popup) | 'full' (calendar screen)

export type CellSize = 'compact' | 'full';

export interface CalendarGridProps {
  grid: MonthGrid;
  today: ISODate;
  selected?: ISODate;
  markers?: Map<ISODate, string[]>;
  /** Per-day tooltip text for day cells (milestone labels joined). Shown on hover/focus. */
  tooltips?: Map<ISODate, string>;
  onSelectDay?: (date: ISODate) => void;
  cellSize?: CellSize;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_FULL_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function CalendarGrid({
  grid,
  today,
  selected,
  markers,
  tooltips,
  onSelectDay,
  cellSize = 'compact',
}: CalendarGridProps) {
  const gridRef = useRef<HTMLTableElement>(null);

  // When a day is clicked, focus moves to it — no side effect needed beyond the callback
  function handleDayClick(date: ISODate) {
    onSelectDay?.(date);
  }

  function handleDayKeyDown(e: KeyboardEvent, date: ISODate) {
    // Arrow key navigation within the grid
    if (!gridRef.current) return;
    const buttons = Array.from(
      gridRef.current.querySelectorAll<HTMLButtonElement>('button[data-date]')
    );
    const idx = buttons.findIndex(b => b.dataset.date === date);
    if (idx === -1) return;

    let newIdx = idx;
    if (e.key === 'ArrowRight') newIdx = Math.min(idx + 1, buttons.length - 1);
    else if (e.key === 'ArrowLeft') newIdx = Math.max(idx - 1, 0);
    else if (e.key === 'ArrowDown') newIdx = Math.min(idx + 7, buttons.length - 1);
    else if (e.key === 'ArrowUp') newIdx = Math.max(idx - 7, 0);
    else return;

    e.preventDefault();
    buttons[newIdx].focus();
  }

  const isCompact = cellSize === 'compact';
  const tableClass = isCompact ? 'cal-grid cal-grid--compact' : 'cal-grid cal-grid--full';

  return (
    <table class={tableClass} ref={gridRef} role="grid" aria-label={grid.label}>
      <thead>
        <tr>
          {DAY_LABELS.map((d, i) => (
            <th key={i} scope="col" abbr={DAY_FULL_LABELS[i]} class="cal-grid__dow">
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grid.weeks.map((week, wi) => (
          <tr key={wi} role="row">
            {week.map((cell) => {
              const isToday = cell.date === today;
              const isSelected = cell.date === selected;
              const cellMarkers = markers?.get(cell.date);
              const hasMarker = !!cellMarkers && cellMarkers.length > 0;
              const tipText = tooltips?.get(cell.date);

              // Build aria-label: "12 March 2026" + qualifier
              const [y, m, d] = cell.date.split('-').map(Number);
              const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ];
              let ariaLabel = `${d} ${monthNames[m - 1]} ${y}`;
              if (isToday) ariaLabel += ', today';
              if (isSelected) ariaLabel += ', selected';
              if (hasMarker) ariaLabel += `, ${cellMarkers!.join(', ')}`;

              let btnClass = 'cal-grid__day';
              if (!cell.inMonth) btnClass += ' cal-grid__day--out';
              if (isToday) btnClass += ' cal-grid__day--today';
              if (isSelected) btnClass += ' cal-grid__day--selected';

              const btn = (
                <button
                  type="button"
                  class={btnClass}
                  data-date={cell.date}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected ? 'true' : undefined}
                  onClick={() => handleDayClick(cell.date)}
                  onKeyDown={(e) => handleDayKeyDown(e, cell.date)}
                >
                  <span class="cal-grid__day-num">{d}</span>
                  {hasMarker && !isCompact && (
                    <span class="cal-grid__dot" aria-hidden="true" />
                  )}
                  {hasMarker && isCompact && (
                    <span class="cal-grid__dot-sm" aria-hidden="true" />
                  )}
                </button>
              );

              return (
                <td key={cell.date} role="gridcell" class="cal-grid__cell">
                  {tipText && cell.inMonth ? (
                    <span class="tip cal-grid__tip" data-tip={tipText} tabIndex={-1}>
                      {btn}
                    </span>
                  ) : btn}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
