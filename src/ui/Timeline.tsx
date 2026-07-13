import type { Milestone } from '../core/milestones';
import { nextMilestone } from '../core/milestones';
import { formatMilestoneDate } from '../core/summary';
import type { ISODate } from '../core/dates';

interface Props {
  milestones: Milestone[];
  highlightDate?: ISODate;
  onMilestoneHover?: (date: ISODate | null) => void;
  onMilestoneSelect?: (date: ISODate | null) => void;
  selectedDate?: ISODate | null;
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

export function Timeline({
  milestones,
  highlightDate,
  onMilestoneHover,
  onMilestoneSelect,
  selectedDate,
}: Props) {
  const next = nextMilestone(milestones);

  return (
    <div class="timeline card">
      <h2 class="timeline__title">Milestones</h2>
      <ul class="timeline__list">
        {milestones.map(m => {
          const isHighlighted = highlightDate === m.date;
          const isSelected = selectedDate === m.date;

          return (
            <li
              key={m.id}
              class={[
                'timeline__item',
                m.status === 'past' ? 'timeline__item--past' : '',
                m.status === 'today' ? 'timeline__item--today' : '',
                next && next.id === m.id ? 'timeline__item--next' : '',
                isHighlighted ? 'timeline__item--highlighted' : '',
                isSelected ? 'timeline__item--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected ? 'true' : 'false'}
              onClick={() => {
                // Toggle: clicking again clears selection
                onMilestoneSelect?.(isSelected ? null : (m.date as ISODate));
              }}
              onMouseEnter={() => onMilestoneHover?.(m.date as ISODate)}
              onMouseLeave={() => onMilestoneHover?.(null)}
              onFocus={() => onMilestoneHover?.(m.date as ISODate)}
              onBlur={() => onMilestoneHover?.(null)}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onMilestoneSelect?.(isSelected ? null : (m.date as ISODate));
                }
              }}
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
          );
        })}
      </ul>
    </div>
  );
}
