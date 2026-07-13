import type { Pregnancy, GA } from '../core/calc';
import { gestationalAgeOn, conceptionalAgeOn } from '../core/calc';
import { fetalSizeForWeek } from '../core/fetalGrowth';
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

  return (
    <div class="today-header card">
      <div class="today-header__ga">
        <span class="today-header__ga-big">{ga.weeks}w {ga.days}d</span>
        <span class="today-header__ga-label">gestational age</span>
      </div>
      <div class="today-header__ca">
        {ca.weeks}w {ca.days}d conceptional age
      </div>
      <div class="today-header__size">{sizeText}</div>
    </div>
  );
}
