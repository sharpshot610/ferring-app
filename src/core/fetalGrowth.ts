// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.

export interface FetalSize {
  week: number;
  lengthCm: number;
  weightG: number;
}

export function fetalSizeForWeek(week: number): FetalSize | null {
  throw new Error('unimplemented');
}
