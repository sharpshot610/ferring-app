// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.

import type { ISODate } from './dates';
import { diffDays } from './dates';
import type { AnchorType, Pregnancy } from './calc';

export type MilestoneId =
  | 'retrieval'
  | 'transfer'
  | 'betaHcg'
  | 'lastProgesterone'
  | 'trimester1End'
  | 'trimester2End'
  | 'edd';

export interface Milestone {
  id: MilestoneId;
  label: string;
  date: ISODate;
  implied: boolean;
  status: 'past' | 'today' | 'future';
  daysUntil: number;
}

export function getMilestones(p: Pregnancy, today: ISODate): Milestone[] {
  const anchor = p.anchorType;

  // The transfer milestone matches the anchor type when the anchor IS a
  // transfer; otherwise fall back to the day-5 date, explicitly flagged.
  const transferIsAnchor =
    anchor === 'transfer_day3' || anchor === 'transfer_day5';
  const transfer =
    anchor === 'transfer_day3'
      ? { date: p.transferDay3, label: 'Embryo transfer (day 3)' }
      : anchor === 'transfer_day5'
        ? { date: p.transferDay5, label: 'Embryo transfer (day 5)' }
        : { date: p.transferDay5, label: 'Embryo transfer (day 5, implied)' };

  const specs: Array<{ id: MilestoneId; label: string; date: ISODate }> = [
    { id: 'retrieval', label: 'Egg retrieval / IUI', date: p.retrieval },
    { id: 'transfer', label: transfer.label, date: transfer.date },
    { id: 'betaHcg', label: 'β-hCG test', date: p.betaHcg },
    { id: 'lastProgesterone', label: 'Last progesterone shot', date: p.lastProgesterone },
    { id: 'trimester1End', label: 'End of first trimester', date: p.trimester1End },
    { id: 'trimester2End', label: 'End of second trimester', date: p.trimester2End },
    { id: 'edd', label: 'Due date', date: p.edd },
  ];

  const milestones = specs.map((spec) => {
    const daysUntil = diffDays(spec.date, today);
    const status: Milestone['status'] =
      daysUntil < 0 ? 'past' : daysUntil === 0 ? 'today' : 'future';
    return {
      id: spec.id,
      label: spec.label,
      date: spec.date,
      implied: isImplied(spec.id, anchor, transferIsAnchor),
      status,
      daysUntil,
    };
  });

  // Ascending by date. Ties keep the spec order above (stable sort).
  milestones.sort((a, b) => diffDays(a.date, b.date));
  return milestones;
}

// A milestone is implied unless it is precisely the anchor the user entered.
// lmp/ga_on_date anchors have no milestone of their own, so everything is implied.
function isImplied(
  id: MilestoneId,
  anchor: AnchorType,
  transferIsAnchor: boolean,
): boolean {
  switch (anchor) {
    case 'retrieval':
      return id !== 'retrieval';
    case 'edd':
      return id !== 'edd';
    case 'transfer_day3':
    case 'transfer_day5':
      return !(id === 'transfer' && transferIsAnchor);
    case 'lmp':
    case 'ga_on_date':
      return true;
  }
}

export function nextMilestone(ms: Milestone[]): Milestone | null {
  // First milestone that is not already past (today counts as next).
  for (const m of ms) {
    if (m.status !== 'past') return m;
  }
  return null;
}
