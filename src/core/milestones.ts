// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.

import type { ISODate } from './dates';
import type { Pregnancy } from './calc';

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
  throw new Error('unimplemented');
}

export function nextMilestone(ms: Milestone[]): Milestone | null {
  throw new Error('unimplemented');
}
