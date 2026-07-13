import { describe, it, expect } from 'vitest';
import { generateICS } from '../src/core/ics';
import type { IcsOptions } from '../src/core/ics';
import type { Milestone } from '../src/core/milestones';
import { getMilestones } from '../src/core/milestones';
import { computePregnancy } from '../src/core/calc';
import { retrievalLeap } from './fixtures';

const TODAY = '2024-02-01';

function baseOpts(overrides?: Partial<IcsOptions>): IcsOptions {
  return {
    calendarName: 'IVF Wheel schedule',
    reminder: 'none',
    dtstamp: TODAY,
    ...overrides,
  };
}

function getTestMilestones(): Milestone[] {
  const p = computePregnancy(retrievalLeap.anchor);
  return getMilestones(p, TODAY);
}

describe('generateICS — line endings', () => {
  it('uses CRLF throughout and has no stray bare LF', () => {
    const ics = generateICS(getTestMilestones(), baseOpts());
    // Split on CRLF — none of the resulting parts should contain a bare \n
    const parts = ics.split('\r\n');
    for (const part of parts) {
      expect(part, `Part should not contain bare \\n: ${JSON.stringify(part)}`).not.toContain('\n');
    }
  });

  it('final line ends with CRLF', () => {
    const ics = generateICS(getTestMilestones(), baseOpts());
    expect(ics.endsWith('\r\n')).toBe(true);
  });
});

describe('generateICS — calendar skeleton', () => {
  it('has correct calendar header fields', () => {
    const ics = generateICS(getTestMilestones(), baseOpts());
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('VERSION:2.0\r\n');
    expect(ics).toContain('PRODID:-//IVF Wheel//EN\r\n');
    expect(ics).toContain('CALSCALE:GREGORIAN\r\n');
    expect(ics).toContain('METHOD:PUBLISH\r\n');
    expect(ics).toContain('X-WR-CALNAME:IVF Wheel schedule\r\n');
    expect(ics).toContain('END:VCALENDAR\r\n');
  });

  it('includes the calendarName in X-WR-CALNAME', () => {
    const ics = generateICS(getTestMilestones(), baseOpts({ calendarName: 'My Custom Calendar' }));
    expect(ics).toContain('X-WR-CALNAME:My Custom Calendar\r\n');
  });
});

describe('generateICS — event count and structure', () => {
  it('emits one VEVENT per milestone', () => {
    const milestones = getTestMilestones();
    const ics = generateICS(milestones, baseOpts());
    const beginCount = (ics.match(/BEGIN:VEVENT\r\n/g) || []).length;
    const endCount = (ics.match(/END:VEVENT\r\n/g) || []).length;
    expect(beginCount).toBe(milestones.length);
    expect(endCount).toBe(milestones.length);
  });

  it('each event has DTSTART, DTEND, DTSTAMP, UID, SUMMARY', () => {
    const milestones = getTestMilestones();
    const ics = generateICS(milestones, baseOpts());
    const dtstart = (ics.match(/DTSTART;VALUE=DATE:/g) || []).length;
    const dtend = (ics.match(/DTEND;VALUE=DATE:/g) || []).length;
    const dtstamp = (ics.match(/DTSTAMP:/g) || []).length;
    const uid = (ics.match(/UID:/g) || []).length;
    const summary = (ics.match(/SUMMARY:/g) || []).length;
    expect(dtstart).toBe(milestones.length);
    expect(dtend).toBe(milestones.length);
    expect(dtstamp).toBe(milestones.length);
    expect(uid).toBe(milestones.length);
    expect(summary).toBe(milestones.length);
  });
});

describe('generateICS — DTSTART and DTEND values', () => {
  it('DTEND is DTSTART + 1 day for a normal date', () => {
    const ms: Milestone[] = [{
      id: 'edd',
      label: 'Due date',
      date: '2024-03-15',
      implied: false,
      status: 'future',
      daysUntil: 43,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('DTSTART;VALUE=DATE:20240315\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20240316\r\n');
  });

  it('DTEND crosses month boundary correctly (Feb 28 → Mar 1 in non-leap year)', () => {
    const ms: Milestone[] = [{
      id: 'edd',
      label: 'Due date',
      date: '2025-02-28',
      implied: false,
      status: 'future',
      daysUntil: 1,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('DTSTART;VALUE=DATE:20250228\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20250301\r\n');
  });

  it('DTEND crosses leap day boundary correctly (2028-02-29 → 2028-03-01)', () => {
    const ms: Milestone[] = [{
      id: 'edd',
      label: 'Due date',
      date: '2028-02-29',
      implied: false,
      status: 'future',
      daysUntil: 1,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('DTSTART;VALUE=DATE:20280229\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20280301\r\n');
  });
});

describe('generateICS — DTSTAMP', () => {
  it('renders dtstamp as YYYYMMDDT000000Z', () => {
    const ics = generateICS(getTestMilestones(), baseOpts({ dtstamp: '2024-02-01' }));
    expect(ics).toContain('DTSTAMP:20240201T000000Z\r\n');
  });
});

describe('generateICS — UID determinism', () => {
  it('two calls with same input produce identical output', () => {
    const milestones = getTestMilestones();
    const opts = baseOpts();
    const first = generateICS(milestones, opts);
    const second = generateICS(milestones, opts);
    expect(first).toBe(second);
  });

  it('UID format is date-id@ivf-wheel', () => {
    const ms: Milestone[] = [{
      id: 'retrieval',
      label: 'Egg retrieval / IUI',
      date: '2024-02-20',
      implied: false,
      status: 'past',
      daysUntil: -10,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('UID:2024-02-20-retrieval@ivf-wheel\r\n');
  });
});

describe('generateICS — text escaping', () => {
  it('escapes commas in labels', () => {
    const ms: Milestone[] = [{
      id: 'edd',
      label: 'Test, comma label',
      date: '2024-03-15',
      implied: false,
      status: 'future',
      daysUntil: 1,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('SUMMARY:Test\\, comma label\r\n');
  });

  it('escapes semicolons in labels', () => {
    const ms: Milestone[] = [{
      id: 'edd',
      label: 'Test; semicolon label',
      date: '2024-03-15',
      implied: false,
      status: 'future',
      daysUntil: 1,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('SUMMARY:Test\\; semicolon label\r\n');
  });

  it('escapes backslashes in labels', () => {
    const ms: Milestone[] = [{
      id: 'edd',
      label: 'Test\\backslash',
      date: '2024-03-15',
      implied: false,
      status: 'future',
      daysUntil: 1,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('SUMMARY:Test\\\\backslash\r\n');
  });
});

describe('generateICS — implied milestone', () => {
  it('appends (estimated) to summary for implied milestones', () => {
    const ms: Milestone[] = [{
      id: 'betaHcg',
      label: 'β-hCG test',
      date: '2024-03-06',
      implied: true,
      status: 'future',
      daysUntil: 33,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('SUMMARY:β-hCG test (estimated)\r\n');
  });

  it('does not append (estimated) for non-implied milestones', () => {
    const ms: Milestone[] = [{
      id: 'retrieval',
      label: 'Egg retrieval / IUI',
      date: '2024-02-20',
      implied: false,
      status: 'past',
      daysUntil: -10,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('SUMMARY:Egg retrieval / IUI\r\n');
    expect(ics).not.toContain('(estimated)');
  });
});

describe('generateICS — line folding', () => {
  it('folds content lines longer than 75 octets', () => {
    const longLabel = 'A very long label that will definitely exceed the seventy-five octet limit in the ICS output line';
    const ms: Milestone[] = [{
      id: 'edd',
      label: longLabel,
      date: '2024-03-15',
      implied: false,
      status: 'future',
      daysUntil: 1,
    }];
    const ics = generateICS(ms, baseOpts());
    // All non-folded lines should be ≤ 75 chars
    const crlfLines = ics.split('\r\n');
    for (const line of crlfLines) {
      // Continuation lines start with a space; the space is part of the line
      expect(line.length).toBeLessThanOrEqual(75);
    }
    // The folded continuation lines should start with a space
    expect(ics).toContain('\r\n ');
  });
});

describe('generateICS — VALARM', () => {
  it('no VALARM when reminder is none', () => {
    const ics = generateICS(getTestMilestones(), baseOpts({ reminder: 'none' }));
    expect(ics).not.toContain('BEGIN:VALARM');
  });

  it('VALARM with TRIGGER:-P1D for 1d reminder', () => {
    const ics = generateICS(getTestMilestones(), baseOpts({ reminder: '1d' }));
    expect(ics).toContain('BEGIN:VALARM\r\n');
    expect(ics).toContain('ACTION:DISPLAY\r\n');
    expect(ics).toContain('TRIGGER:-P1D\r\n');
    expect(ics).toContain('END:VALARM\r\n');
  });

  it('VALARM with TRIGGER:-P3D for 3d reminder', () => {
    const ics = generateICS(getTestMilestones(), baseOpts({ reminder: '3d' }));
    expect(ics).toContain('TRIGGER:-P3D\r\n');
  });

  it('VALARM with TRIGGER:-P1W for 1w reminder', () => {
    const ics = generateICS(getTestMilestones(), baseOpts({ reminder: '1w' }));
    expect(ics).toContain('TRIGGER:-P1W\r\n');
  });

  it('VALARM count equals milestone count for non-none reminder', () => {
    const milestones = getTestMilestones();
    const ics = generateICS(milestones, baseOpts({ reminder: '1d' }));
    const alarmCount = (ics.match(/BEGIN:VALARM\r\n/g) || []).length;
    expect(alarmCount).toBe(milestones.length);
  });

  it('VALARM DESCRIPTION matches label', () => {
    const ms: Milestone[] = [{
      id: 'edd',
      label: 'Due date',
      date: '2024-11-12',
      implied: false,
      status: 'future',
      daysUntil: 285,
    }];
    const ics = generateICS(ms, baseOpts({ reminder: '1d' }));
    expect(ics).toContain('DESCRIPTION:Due date\r\n');
  });
});
