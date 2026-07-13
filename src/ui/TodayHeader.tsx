import type { Pregnancy, GA } from '../core/calc';
import { gestationalAgeOn, conceptionalAgeOn } from '../core/calc';
import { fetalSizeForWeek } from '../core/fetalGrowth';
import { weekGuideFor } from '../core/weekGuide';
import type { ISODate } from '../core/dates';

interface Props {
  pregnancy: Pregnancy;
  today: ISODate;
}

function fetalSizeText(gaWeeks: number): string {
  if (gaWeeks < 8) return 'Too early for size data';
  if (gaWeeks > 40) return 'Past 40 weeks — size reference not available';
  const size = fetalSizeForWeek(gaWeeks);
  if (!size) return 'Size data not available for this week';
  return `≈ ${size.lengthCm} cm · ${size.weightG} g`;
}

export function TodayHeader({ pregnancy, today }: Props) {
  const ga: GA = gestationalAgeOn(pregnancy, today);
  const ca: GA = conceptionalAgeOn(pregnancy, today);

  let sizeText: string;
  if (ga.totalDays < 0) {
    sizeText = 'Before pregnancy start';
  } else {
    sizeText = fetalSizeText(ga.weeks);
  }

  // Feature 1: week guide (weeks 4–40 only)
  const guide = (ga.totalDays >= 0 && ga.weeks >= 4 && ga.weeks <= 40)
    ? weekGuideFor(ga.weeks)
    : null;

  // Feature 2: progress bar (hide when GA negative or > 42w)
  const showProgress = ga.totalDays >= 0 && ga.weeks <= 42;
  const progressPct = showProgress
    ? Math.min(100, Math.max(0, (ga.totalDays / (40 * 7)) * 100))
    : 0;

  return (
    <div class="today-header card">
      <div class="today-header__ga">
        <span class="today-header__ga-big">{ga.weeks}w {ga.days}d</span>
        <span class="today-header__ga-label">gestational age</span>
      </div>
      <div class="today-header__ca">
        {ca.weeks}w {ca.days}d{' '}
        <span
          class="tip"
          data-tip="Age counted from fertilisation — about 2 weeks less than gestational age"
        >
          conceptional age
        </span>
      </div>
      <div class="today-header__size">{sizeText}</div>

      {guide && (
        <div class="today-header__week-guide">
          <span class="today-header__comparison-chip">{guide.comparison}</span>
          <p class="today-header__week-note">{guide.note}</p>
        </div>
      )}

      {showProgress && (
        <div class="ga-progress">
          <div class="ga-progress__track">
            <div
              class="ga-progress__fill"
              style={{ width: `${progressPct.toFixed(1)}%` }}
              role="progressbar"
              aria-valuenow={ga.weeks}
              aria-valuemin={0}
              aria-valuemax={40}
              aria-label={`Gestational age: week ${ga.weeks} of 40`}
            />
          </div>
          <p class="ga-progress__caption">Week {ga.weeks} of 40</p>
        </div>
      )}
    </div>
  );
}
