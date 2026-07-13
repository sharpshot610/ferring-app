import { useState } from 'preact/hooks';
import type { Pregnancy } from '../core/calc';
import { gestationalAgeOn } from '../core/calc';
import type { Milestone } from '../core/milestones';
import { nextMilestone } from '../core/milestones';
import { hcgDoublingTime } from '../core/hcg';
import type { HcgReading } from '../core/hcg';
import { monthGridFor, monthOf, addMonths } from '../core/monthGrid';
import type { ISODate } from '../core/dates';
import { TodayHeader } from './TodayHeader';
import { Timeline } from './Timeline';
import { ReverseQuery } from './ReverseQuery';
import { CalendarGrid } from './CalendarGrid';
import { formatMilestoneDate } from '../core/summary';
import { DatePickerField } from './DatePickerField';

const PREGNANCY_LABELS: Record<string, string> = {
  lmp: 'Last menstrual period',
  edd: 'Estimated due date',
  retrieval: 'Egg retrieval / IUI',
  transferDay3: 'Day-3 transfer',
  transferDay5: 'Day-5 transfer',
  betaHcg: 'β-hCG test',
  lastProgesterone: 'Last progesterone',
  trimester1End: 'End of 1st trimester',
  trimester2End: 'End of 2nd trimester',
};

// Tooltip text for niche terms shown in the derived-dates section
const PREGNANCY_TIPS: Partial<Record<string, string>> = {
  lmp: 'Last menstrual period — the reference point clinics use to date pregnancy',
  edd: 'Only ~5% of babies arrive exactly on this date',
  betaHcg: 'A blood test measuring pregnancy hormone levels — your first pregnancy confirmation',
  lastProgesterone: 'Typically stopped around 10 weeks when the placenta takes over',
};

const TRANSFER_ANCHOR_TYPES = ['transfer_day3', 'transfer_day5'];

// Use the shared pure formatter (single source of truth, matches copy-summary text).
const formatDate = formatMilestoneDate;

interface Props {
  pregnancy: Pregnancy;
  milestones: Milestone[];
  today: string;
  onEditInputs: () => void;
  onStartOver: () => void;
  onExport: () => void;
}

// Feature 3: compute phase label from milestone statuses (no new date math).
function computePhase(milestones: Milestone[]): string {
  const byId = Object.fromEntries(milestones.map(m => [m.id, m]));
  const transfer = byId['transfer'];
  const betaHcg = byId['betaHcg'];
  const t1End = byId['trimester1End'];
  const t2End = byId['trimester2End'];
  const edd = byId['edd'];

  // Before transfer: transfer is future
  if (transfer && transfer.status === 'future') return 'Preparing';

  // Transfer happened but beta not yet: two-week wait
  if (betaHcg && betaHcg.status === 'future') return 'The two-week wait';

  // Beta happened but end of trimester 1 is future: early pregnancy
  if (t1End && t1End.status === 'future') return 'Early pregnancy';

  // End of trimester 1 passed but trimester 2 end is future: second trimester
  if (t2End && t2End.status === 'future') return 'Second trimester';

  // After trimester 2 end up to and including edd: third trimester
  if (edd && edd.status === 'future') return 'Third trimester';

  // Past edd: full term
  return 'Full term';
}

function nextStepLine(milestones: Milestone[]): string | null {
  const next = nextMilestone(milestones);
  if (!next) return null;
  if (next.status === 'today') return `Next: ${next.label} — today`;
  if (next.daysUntil === 1) return `Next: ${next.label} — tomorrow`;
  return `Next: ${next.label} in ${next.daysUntil} days`;
}

// Feature 4: hCG doubling calculator state and helpers
interface HcgState {
  v1: string;
  d1: string;
  h1: string;
  v2: string;
  d2: string;
  h2: string;
}

const INITIAL_HCG: HcgState = { v1: '', d1: '', h1: '09', v2: '', d2: '', h2: '09' };

function friendlyAssessment(assessment: 'reassuring' | 'borderline' | 'slow', hours: number): string {
  const h = hours.toFixed(1);
  if (assessment === 'reassuring') {
    return `Doubling every ${h} h — within the typical 48–72 h range`;
  }
  if (assessment === 'borderline') {
    return `Doubling every ${h} h — slightly slower than typical; discuss with your clinic`;
  }
  return `Doubling every ${h} h — slower than typical; contact your clinic`;
}

// ─── Inline calendar helpers ──────────────────────────────────────────────────

function calInitialYM(milestones: Milestone[], today: string) {
  const next = nextMilestone(milestones);
  if (next) return monthOf(next.date as ISODate);
  return monthOf(today as ISODate);
}

function calClamp(
  ym: { year: number; month: number },
  minYM: { year: number; month: number },
  maxYM: { year: number; month: number },
) {
  const val = ym.year * 12 + ym.month;
  const lo = minYM.year * 12 + minYM.month;
  const hi = maxYM.year * 12 + maxYM.month;
  if (val < lo) return minYM;
  if (val > hi) return maxYM;
  return ym;
}

function formatGA(pregnancy: Pregnancy, date: ISODate): string {
  const ga = gestationalAgeOn(pregnancy, date);
  if (ga.totalDays < 0) return 'before your cycle start';
  return `${ga.weeks}w ${ga.days}d`;
}

export function ScheduleScreen({
  pregnancy,
  milestones,
  today,
  onEditInputs,
  onStartOver,
  onExport,
}: Props) {
  const [reverseOpen, setReverseOpen] = useState(false);
  const [hcgOpen, setHcgOpen] = useState(false);
  const [confirmStartOver, setConfirmStartOver] = useState(false);

  // ─── Inline calendar state ────────────────────────────────────────────────
  const sortedDates = [...milestones].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = sortedDates[0]?.date;
  const lastDate = sortedDates[sortedDates.length - 1]?.date;
  const minYM = firstDate ? monthOf(firstDate as ISODate) : monthOf(today as ISODate);
  const maxYM = lastDate ? monthOf(lastDate as ISODate) : monthOf(today as ISODate);
  const startYM = calClamp(calInitialYM(milestones, today), minYM, maxYM);

  const [calYear, setCalYear] = useState(startYM.year);
  const [calMonth, setCalMonth] = useState(startYM.month);
  const [selectedDay, setSelectedDay] = useState<ISODate | null>(null);

  const calAtMin = calYear * 12 + calMonth <= minYM.year * 12 + minYM.month;
  const calAtMax = calYear * 12 + calMonth >= maxYM.year * 12 + maxYM.month;

  function calPrev() {
    if (calAtMin) return;
    const { year, month } = addMonths(calYear, calMonth, -1);
    setCalYear(year);
    setCalMonth(month);
  }
  function calNext() {
    if (calAtMax) return;
    const { year, month } = addMonths(calYear, calMonth, 1);
    setCalYear(year);
    setCalMonth(month);
  }

  // Build markers + tooltips maps
  const calMarkers = new Map<ISODate, string[]>();
  const calTooltips = new Map<ISODate, string>();
  for (const m of milestones) {
    const d = m.date as ISODate;
    const existing = calMarkers.get(d) ?? [];
    existing.push(m.label);
    calMarkers.set(d, existing);
  }
  for (const [d, labels] of calMarkers) {
    calTooltips.set(d, labels.join(' · '));
  }

  const calGrid = monthGridFor(calYear, calMonth);

  // Milestones visible in the current month's grid
  const calGridDates = new Set(calGrid.weeks.flatMap(w => w.map(c => c.date)));
  const calVisibleMilestones = milestones.filter(m => calGridDates.has(m.date));

  function handleCalDaySelect(date: ISODate) {
    setSelectedDay(prev => prev === date ? null : date);
  }

  // Detail line for selected day
  let selectedDetail: { dateStr: string; ga: string; labels: string[] } | null = null;
  if (selectedDay) {
    const labels = calMarkers.get(selectedDay) ?? [];
    selectedDetail = {
      dateStr: formatMilestoneDate(selectedDay),
      ga: formatGA(pregnancy, selectedDay),
      labels,
    };
  }

  // hCG calculator state
  const [hcg, setHcg] = useState<HcgState>(INITIAL_HCG);
  const [hcgResult, setHcgResult] = useState<{ text: string; assessment: 'reassuring' | 'borderline' | 'slow' } | null>(null);
  const [hcgError, setHcgError] = useState<string | null>(null);

  const isBetaHcgEstimated = !TRANSFER_ANCHOR_TYPES.includes(pregnancy.anchorType);

  function handleStartOverClick() {
    setConfirmStartOver(true);
  }

  function handleConfirmStartOver() {
    setConfirmStartOver(false);
    onStartOver();
  }

  function handleCancelStartOver() {
    setConfirmStartOver(false);
  }

  function handleCalculateHcg() {
    setHcgResult(null);
    setHcgError(null);
    try {
      const first: HcgReading = {
        value: parseFloat(hcg.v1),
        date: hcg.d1,
        hourOfDay: parseInt(hcg.h1, 10),
      };
      const second: HcgReading = {
        value: parseFloat(hcg.v2),
        date: hcg.d2,
        hourOfDay: parseInt(hcg.h2, 10),
      };
      const result = hcgDoublingTime(first, second);
      setHcgResult({
        text: friendlyAssessment(result.assessment, result.hours),
        assessment: result.assessment,
      });
    } catch (e) {
      setHcgError(e instanceof Error ? e.message : String(e));
    }
  }

  const pregnancyKeys = Object.keys(PREGNANCY_LABELS) as Array<keyof typeof PREGNANCY_LABELS>;

  // Feature 3: phase + next step
  const phase = computePhase(milestones);
  const nextStep = nextStepLine(milestones);

  // Hour options for hCG calculator
  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div class="screen-content">
      {/* Feature 3: Phase awareness banner */}
      <div class="card phase-banner">
        <span class="phase-banner__chip">{phase}</span>
        {nextStep && <p class="phase-banner__next">{nextStep}</p>}
      </div>

      <TodayHeader pregnancy={pregnancy} today={today} />

      {/* Two-column layout: milestones left, calendar right on ≥768px */}
      <div class="schedule-columns">
        <div class="schedule-columns__milestones">
          <Timeline milestones={milestones} />
        </div>

        {/* Inline calendar card */}
        <div class="schedule-columns__calendar card cal-inline" aria-label="Calendar view">
          <div class="cal-screen__header">
            <button
              type="button"
              class="dp-nav-btn"
              onClick={calPrev}
              disabled={calAtMin}
              aria-label="Previous month"
              aria-disabled={calAtMin}
            >
              ‹
            </button>
            <span class="cal-screen__month-label">{calGrid.label}</span>
            <button
              type="button"
              class="dp-nav-btn"
              onClick={calNext}
              disabled={calAtMax}
              aria-label="Next month"
              aria-disabled={calAtMax}
            >
              ›
            </button>
          </div>

          <CalendarGrid
            grid={calGrid}
            today={today as ISODate}
            selected={selectedDay ?? undefined}
            markers={calMarkers}
            tooltips={calTooltips}
            onSelectDay={handleCalDaySelect}
            cellSize="full"
          />

          {/* Selected day detail */}
          {selectedDetail && (
            <div class="cal-inline__detail" role="status" aria-live="polite">
              <span class="cal-inline__detail-date">{selectedDetail.dateStr}</span>
              <span class="cal-inline__detail-ga">{selectedDetail.ga}</span>
              {selectedDetail.labels.length > 0 && (
                <span class="cal-inline__detail-labels">{selectedDetail.labels.join(' · ')}</span>
              )}
            </div>
          )}

          {/* Legend for visible milestones */}
          {calVisibleMilestones.length > 0 && (
            <ul class="cal-legend" aria-label="Milestones this month">
              {calVisibleMilestones.map(m => (
                <li key={m.id} class={`cal-legend__item cal-legend__item--${m.status}`}>
                  <span class="cal-legend__dot" aria-hidden="true">●</span>
                  <span class="cal-legend__text">
                    {formatMilestoneDate(m.date)} — {m.label}
                    {m.implied && (
                      <span class="tip" data-tip="Estimated from the date you entered, not one you confirmed" tabIndex={0}> (implied)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Derived dates grid */}
      <div class="card derived-dates">
        <h3 class="derived-dates__title">Derived dates</h3>
        <dl class="derived-dates__grid">
          {pregnancyKeys.map(key => {
            const val = (pregnancy as unknown as Record<string, string>)[key];
            if (!val) return null;
            const tip = PREGNANCY_TIPS[key];
            return (
              <div class="derived-dates__row" key={key}>
                <dt class="derived-dates__term">
                  {PREGNANCY_LABELS[key]}
                  {tip && (
                    <span class="tip" data-tip={tip} tabIndex={0}>ⓘ</span>
                  )}
                  {key === 'betaHcg' && isBetaHcgEstimated && (
                    <span class="tag tag--note">(estimated — assumes day-5 transfer)</span>
                  )}
                </dt>
                <dd class="derived-dates__def">{formatDate(val)}</dd>
              </div>
            );
          })}
        </dl>
      </div>

      {/* Feature 4: hCG doubling calculator collapsible */}
      <div class="card">
        <div class="collapsible collapsible--no-border">
          <button
            class="collapsible__trigger"
            onClick={() => setHcgOpen(o => !o)}
            aria-expanded={hcgOpen}
          >
            hCG doubling calculator
            <span class="collapsible__chevron">{hcgOpen ? '▲' : '▼'}</span>
          </button>
          {hcgOpen && (
            <div class="collapsible__body">
              {/* Reading 1 */}
              <p class="hcg-calc__label">First reading</p>
              <div class="hcg-calc__row">
                <div class="form-field" style="margin-bottom:0">
                  <label class="form-field__label" for="hcg-v1">Value (mIU/mL)</label>
                  <input
                    id="hcg-v1"
                    class="input"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 120"
                    value={hcg.v1}
                    onInput={e => setHcg(s => ({ ...s, v1: (e.target as HTMLInputElement).value }))}
                  />
                </div>
                <div class="form-field" style="margin-bottom:0">
                  <label class="form-field__label" for="hcg-d1">Date</label>
                  <DatePickerField
                    value={hcg.d1}
                    hasError={false}
                    onChange={val => setHcg(s => ({ ...s, d1: val }))}
                    placeholder="Choose date"
                  />
                </div>
                <div class="form-field" style="margin-bottom:0">
                  <label class="form-field__label" for="hcg-h1">Hour</label>
                  <select
                    id="hcg-h1"
                    class="input input--narrow"
                    value={hcg.h1}
                    onChange={e => setHcg(s => ({ ...s, h1: (e.target as HTMLSelectElement).value }))}
                  >
                    {hourOptions.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>

              {/* Reading 2 */}
              <p class="hcg-calc__label" style="margin-top: var(--space-md)">Second reading</p>
              <div class="hcg-calc__row">
                <div class="form-field" style="margin-bottom:0">
                  <label class="form-field__label" for="hcg-v2">Value (mIU/mL)</label>
                  <input
                    id="hcg-v2"
                    class="input"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 260"
                    value={hcg.v2}
                    onInput={e => setHcg(s => ({ ...s, v2: (e.target as HTMLInputElement).value }))}
                  />
                </div>
                <div class="form-field" style="margin-bottom:0">
                  <label class="form-field__label" for="hcg-d2">Date</label>
                  <DatePickerField
                    value={hcg.d2}
                    hasError={false}
                    onChange={val => setHcg(s => ({ ...s, d2: val }))}
                    placeholder="Choose date"
                  />
                </div>
                <div class="form-field" style="margin-bottom:0">
                  <label class="form-field__label" for="hcg-h2">Hour</label>
                  <select
                    id="hcg-h2"
                    class="input input--narrow"
                    value={hcg.h2}
                    onChange={e => setHcg(s => ({ ...s, h2: (e.target as HTMLSelectElement).value }))}
                  >
                    {hourOptions.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>

              <button
                class="btn btn--primary"
                style="margin-top: var(--space-md); width: 100%;"
                onClick={handleCalculateHcg}
              >
                Calculate doubling time
              </button>

              {hcgError && (
                <p class="hcg-calc__error">{hcgError}</p>
              )}

              {hcgResult && !hcgError && (
                <p class={`hcg-calc__result hcg-calc__result--${hcgResult.assessment}`}>
                  {hcgResult.text}
                </p>
              )}

              <p class="hcg-calc__footnote">
                Informational only — hCG patterns vary; your clinic interprets your results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reverse lookup collapsible */}
      <div class="card">
        <div class="collapsible collapsible--no-border">
          <button
            class="collapsible__trigger"
            onClick={() => setReverseOpen(o => !o)}
            aria-expanded={reverseOpen}
          >
            Reverse lookup
            <span class="collapsible__chevron">{reverseOpen ? '▲' : '▼'}</span>
          </button>
          {reverseOpen && (
            <div class="collapsible__body">
              <ReverseQuery pregnancy={pregnancy} />
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      <div class="action-row action-row--wrap">
        {!confirmStartOver ? (
          <button class="btn btn--destructive btn--small" onClick={handleStartOverClick}>
            Start over
          </button>
        ) : (
          <div class="confirm-inline" role="group" aria-label="Confirm start over">
            <span class="confirm-inline__label">Confirm start over?</span>
            <button class="btn btn--destructive btn--small" onClick={handleConfirmStartOver}>
              Yes
            </button>
            <button class="btn btn--secondary btn--small" onClick={handleCancelStartOver}>
              No
            </button>
          </div>
        )}
        <div class="action-row__right">
          <button class="btn btn--primary" onClick={onExport}>
            Export schedule →
          </button>
        </div>
      </div>
    </div>
  );
}
