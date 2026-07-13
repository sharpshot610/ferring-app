import type { Milestone } from '../core/milestones';
import { nextMilestone } from '../core/milestones';
import { formatMilestoneDate } from '../core/summary';

interface Props {
  milestones: Milestone[];
}

// Use the shared pure formatter (single source of truth, matches copy-summary text).
const formatDate = formatMilestoneDate;

function relativeNote(m: Milestone): string {
  if (m.status === 'today') return 'today';
  if (m.status === 'past') {
    const d = Math.abs(m.daysUntil);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
  }
  if (m.daysUntil === 1) return 'tomorrow';
  return `in ${m.daysUntil} days`;
}

export function Timeline({ milestones }: Props) {
  const next = nextMilestone(milestones);

  return (
    <div class="timeline card">
      <h2 class="timeline__title">Milestones</h2>
      <ul class="timeline__list">
        {milestones.map(m => (
          <li
            key={m.id}
            class={[
              'timeline__item',
              m.status === 'past' ? 'timeline__item--past' : '',
              m.status === 'today' ? 'timeline__item--today' : '',
              next && next.id === m.id ? 'timeline__item--next' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div class="timeline__item-icon">
              {m.status === 'past' ? '✓' : m.status === 'today' ? '●' : '○'}
            </div>
            <div class="timeline__item-body">
              <span class="timeline__item-label">
                {m.label}
                {m.implied && <span class="tag tag--implied">implied</span>}
              </span>
              <span class="timeline__item-date">{formatDate(m.date)}</span>
            </div>
            <div class="timeline__item-meta">
              {next && next.id === m.id && m.status !== 'today' && (
                <span class="badge badge--countdown">
                  {m.daysUntil === 1 ? 'tomorrow' : `in ${m.daysUntil} days`}
                </span>
              )}
              {m.status === 'today' && (
                <span class="badge badge--today">today</span>
              )}
              <span class="timeline__item-relative">{relativeNote(m)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
