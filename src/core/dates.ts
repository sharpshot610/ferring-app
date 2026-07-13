// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.

export type ISODate = string; // "YYYY-MM-DD"

export function toEpochDay(d: ISODate): number {
  throw new Error('unimplemented');
}

export function fromEpochDay(n: number): ISODate {
  throw new Error('unimplemented');
}

export function addDays(d: ISODate, n: number): ISODate {
  throw new Error('unimplemented');
}

export function diffDays(a: ISODate, b: ISODate): number { // a − b
  throw new Error('unimplemented');
}

export function isValidISODate(s: string): boolean {
  throw new Error('unimplemented');
}

export function todayLocalISO(now?: Date): ISODate {
  throw new Error('unimplemented');
}
