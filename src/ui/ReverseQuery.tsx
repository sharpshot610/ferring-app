import { useState } from 'preact/hooks';
import type { Pregnancy } from '../core/calc';
import { dateRangeForGestationalWeek, gestationalAgeOn } from '../core/calc';
import { isValidISODate } from '../core/dates';
import { formatMilestoneDate } from '../core/summary';

interface Props {
  pregnancy: Pregnancy;
}

// Use the shared pure formatter (single source of truth, matches copy-summary text).
const formatDate = formatMilestoneDate;

export function ReverseQuery({ pregnancy }: Props) {
  const [weekInput, setWeekInput] = useState('');
  const [weekResult, setWeekResult] = useState<{ start: string; end: string } | string | null>(null);

  const [dateInput, setDateInput] = useState('');
  const [gaResult, setGaResult] = useState<{ weeks: number; days: number } | string | null>(null);

  function lookupWeek() {
    const w = parseInt(weekInput, 10);
    if (isNaN(w) || w < 1 || w > 42) {
      setWeekResult('Enter a week between 1 and 42.');
      return;
    }
    try {
      const range = dateRangeForGestationalWeek(pregnancy, w);
      setWeekResult(range);
    } catch (e) {
      setWeekResult('Could not compute date range.');
    }
  }

  function lookupDate() {
    const valid = isValidISODate(dateInput);
    if (!valid) {
      setGaResult('Enter a valid date.');
      return;
    }
    try {
      const ga = gestationalAgeOn(pregnancy, dateInput);
      setGaResult({ weeks: ga.weeks, days: ga.days });
    } catch (e) {
      setGaResult('Could not compute gestational age.');
    }
  }

  return (
    <div class="reverse-query">
      <h3 class="reverse-query__title">Reverse Lookup</h3>

      <div class="reverse-query__tool">
        <label class="reverse-query__label">Week → date range</label>
        <div class="reverse-query__row">
          <input
            class="input input--narrow"
            type="number"
            min={1}
            max={42}
            placeholder="e.g. 20"
            value={weekInput}
            onInput={e => setWeekInput((e.target as HTMLInputElement).value)}
          />
          <button class="btn btn--secondary" onClick={lookupWeek}>Look up</button>
        </div>
        {weekResult !== null && (
          <p class="reverse-query__result">
            {typeof weekResult === 'string'
              ? weekResult
              : `${formatDate(weekResult.start)} — ${formatDate(weekResult.end)}`}
          </p>
        )}
      </div>

      <div class="reverse-query__tool">
        <label class="reverse-query__label">Date → gestational age</label>
        <div class="reverse-query__row">
          <input
            class="input"
            type="date"
            value={dateInput}
            onInput={e => setDateInput((e.target as HTMLInputElement).value)}
          />
          <button class="btn btn--secondary" onClick={lookupDate}>Look up</button>
        </div>
        {gaResult !== null && (
          <p class="reverse-query__result">
            {typeof gaResult === 'string'
              ? gaResult
              : `${gaResult.weeks}w ${gaResult.days}d gestational age`}
          </p>
        )}
      </div>
    </div>
  );
}
