import { useState, useEffect, useRef } from 'preact/hooks';
import { formatMilestoneDate } from '../core/summary';
import { monthGridFor, monthOf, addMonths } from '../core/monthGrid';
import { todayLocalISO } from '../core/dates';
import type { ISODate } from '../core/dates';
import { CalendarGrid } from './CalendarGrid';

// ─── DatePickerField ──────────────────────────────────────────────────────────
// Custom in-app calendar popup — replaces the OS-native date input.
// Contract with parent: value is always an ISODate string or ''.
// The popup is opened via a <button> trigger; day cells are <button>s.
// Keyboard: Enter/Space on trigger opens popup; Escape closes; focus returns.

export interface DatePickerFieldProps {
  value: string;        // ISO date string or ''
  hasError: boolean;
  onChange: (val: string) => void;
  /** Text shown when no date is chosen. */
  placeholder?: string;
  /** Today's date (ISODate). Defaults to todayLocalISO(). Used to compute nav bounds. */
  today?: string;
}

export function DatePickerField({
  value,
  hasError,
  onChange,
  placeholder = '📅 Tap to choose a date',
  today: todayProp,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  // Resolved today: use prop when provided, fall back to todayLocalISO().
  const todayStr: ISODate = (todayProp as ISODate | undefined) ?? todayLocalISO();

  // Nav bounds: today ± 10 years
  const todayYM = monthOf(todayStr);
  const minNavYM = { year: todayYM.year - 10, month: todayYM.month };
  const maxNavYM = { year: todayYM.year + 10, month: todayYM.month };

  // Determine initial month: selected date's month, or today's month
  function initialMonth(): { year: number; month: number } {
    if (value) return monthOf(value as ISODate);
    return todayYM;
  }

  const [navYear, setNavYear] = useState(initialMonth().year);
  const [navMonth, setNavMonth] = useState(initialMonth().month);

  // Sync nav position when popup opens
  function openPopup() {
    const m = initialMonth();
    setNavYear(m.year);
    setNavMonth(m.month);
    setOpen(true);
  }

  function closePopup() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const atMin = navYear * 12 + navMonth <= minNavYM.year * 12 + minNavYM.month;
  const atMax = navYear * 12 + navMonth >= maxNavYM.year * 12 + maxNavYM.month;

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

  function handleSelectDay(date: ISODate) {
    onChange(date);
    closePopup();
  }

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        closePopup();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closePopup();
      }
    }
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [open]);

  // Auto-focus first day cell when popup opens
  useEffect(() => {
    if (!open || !popupRef.current) return;
    const firstBtn = popupRef.current.querySelector<HTMLButtonElement>('button[data-date]');
    firstBtn?.focus();
  }, [open]);

  // Body scroll-lock while popup is open (only meaningful on ≤480px modal layout,
  // but harmless on wider screens and safe to apply unconditionally).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const grid = monthGridFor(navYear, navMonth);

  const wrapperClass = [
    'date-picker-wrapper',
    hasError ? 'date-picker-wrapper--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div class="date-picker-container">
      <button
        type="button"
        class={wrapperClass}
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={value ? `Change date, currently ${formatMilestoneDate(value)}` : 'Choose date'}
        onClick={openPopup}
      >
        {value ? (
          <span class="date-picker-wrapper__chosen">
            {formatMilestoneDate(value)}
            <span class="date-picker-wrapper__change-hint">Tap to change</span>
          </span>
        ) : (
          <span class="date-picker-wrapper__placeholder">{placeholder}</span>
        )}
      </button>

      {open && (
        <div class="dp-popup" ref={popupRef} role="dialog" aria-modal="true" aria-label="Choose a date">
          {/* Backdrop for mobile */}
          <div class="dp-backdrop" aria-hidden="true" onClick={closePopup} />
          <div class="dp-panel">
            <div class="dp-header">
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
              <span class="dp-month-label">{grid.label}</span>
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
              selected={value as ISODate || undefined}
              onSelectDay={handleSelectDay}
              cellSize="compact"
            />
            <button
              type="button"
              class="dp-close-btn"
              onClick={closePopup}
              aria-label="Close date picker"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
