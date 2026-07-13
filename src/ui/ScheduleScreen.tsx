import { useState } from 'preact/hooks';
import type { Pregnancy } from '../core/calc';
import type { Milestone } from '../core/milestones';
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

export function ScheduleScreen({
  pregnancy,
  milestones,
  today,
  onEditInputs,
  onStartOver,
  onExport,
}: Props) {
  const [reverseOpen, setReverseOpen] = useState(false);
  const [confirmStartOver, setConfirmStartOver] = useState(false);

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

  const pregnancyKeys = Object.keys(PREGNANCY_LABELS) as Array<keyof typeof PREGNANCY_LABELS>;

  return (
    <div class="screen-content">
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
