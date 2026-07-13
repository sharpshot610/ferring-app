import { useState } from 'preact/hooks';
import type { Pregnancy } from '../core/calc';
import type { Milestone } from '../core/milestones';
import { nextMilestone } from '../core/milestones';
import { hcgDoublingTime } from '../core/hcg';
import type { HcgReading } from '../core/hcg';
import { TodayHeader } from './TodayHeader';
import { Timeline } from './Timeline';
import { ReverseQuery } from './ReverseQuery';
import { formatMilestoneDate } from '../core/summary';

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
  return `Next: ${next.label} in ${next.daysUntil} day${next.daysUntil === 1 ? '' : 's'}`;
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

const INITIAL_HCG: HcgState = { v1: '', d1: '', h1: '9', v2: '', d2: '', h2: '9' };

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

      <Timeline milestones={milestones} />

      {/* Derived dates grid */}
      <div class="card derived-dates">
        <h3 class="derived-dates__title">Derived dates</h3>
        <dl class="derived-dates__grid">
          {pregnancyKeys.map(key => {
            const val = (pregnancy as unknown as Record<string, string>)[key];
            if (!val) return null;
            return (
              <div class="derived-dates__row" key={key}>
                <dt class="derived-dates__term">
                  {PREGNANCY_LABELS[key]}
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
                  <input
                    id="hcg-d1"
                    class="input"
                    type="date"
                    value={hcg.d1}
                    onInput={e => setHcg(s => ({ ...s, d1: (e.target as HTMLInputElement).value }))}
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
                  <input
                    id="hcg-d2"
                    class="input"
                    type="date"
                    value={hcg.d2}
                    onInput={e => setHcg(s => ({ ...s, d2: (e.target as HTMLInputElement).value }))}
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
      <div class="action-row">
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
        <button class="btn btn--primary" onClick={onExport}>
          Export schedule →
        </button>
      </div>
    </div>
  );
}
