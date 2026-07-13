import { describe, it, expect } from 'vitest';
import { generateICS } from '../src/core/ics';
import type { IcsOptions } from '../src/core/ics';
import type { Milestone } from '../src/core/milestones';
import type { MilestoneId } from '../src/core/milestones';
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

  it('UID format is id@ivf-wheel (date-stable for re-import deduplication)', () => {
    const ms: Milestone[] = [{
      id: 'retrieval',
      label: 'Egg retrieval / IUI',
      date: '2024-02-20',
      implied: false,
      status: 'past',
      daysUntil: -10,
    }];
    const ics = generateICS(ms, baseOpts());
    expect(ics).toContain('UID:retrieval@ivf-wheel\r\n');
  });

  it('same milestone id with two different dates produces the same UID', () => {
    function makeMs(date: string): Milestone[] {
      return [{
        id: 'edd',
        label: 'Due date',
        date,
        implied: false,
        status: 'future',
        daysUntil: 10,
      }];
    }
    const ics1 = generateICS(makeMs('2024-03-15'), baseOpts());
    const ics2 = generateICS(makeMs('2025-09-01'), baseOpts());
    const uid1 = ics1.split('\r\n').find(l => l.startsWith('UID:'))!;
    const uid2 = ics2.split('\r\n').find(l => l.startsWith('UID:'))!;
    expect(uid1).toBe('UID:edd@ivf-wheel');
    expect(uid1).toBe(uid2);
  });

  it('two different milestone ids produce different UIDs', () => {
    function makeMs(id: MilestoneId): Milestone[] {
      return [{
        id,
        label: 'Test',
        date: '2024-03-15',
        implied: false,
        status: 'future',
        daysUntil: 10,
      }];
    }
    const ics1 = generateICS(makeMs('edd'), baseOpts());
    const ics2 = generateICS(makeMs('retrieval'), baseOpts());
    const uid1 = ics1.split('\r\n').find(l => l.startsWith('UID:'))!;
    const uid2 = ics2.split('\r\n').find(l => l.startsWith('UID:'))!;
    expect(uid1).not.toBe(uid2);
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
  it('folds content lines longer than 75 octets (ASCII)', () => {
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
    // Every physical line (after CRLF split) must be ≤ 75 UTF-8 bytes.
    const crlfLines = ics.split('\r\n');
    for (const line of crlfLines) {
      expect(
        new TextEncoder().encode(line).length,
        `Line exceeds 75 UTF-8 bytes: ${JSON.stringify(line)}`,
      ).toBeLessThanOrEqual(75);
    }
    // Folded continuation lines start with a space
    expect(ics).toContain('\r\n ');
  });

  it('folds correctly when label contains β (2-byte UTF-8 character)', () => {
    // β is U+03B2, 2 UTF-8 bytes. A SUMMARY line containing many β chars
    // must be folded by byte count, not char count.
    const label = 'β-hCG test repeated β β β β β β β β β β β β β β β β β β β β β β β β β β β β β β β β β β β β';
    const ms: Milestone[] = [{
      id: 'betaHcg',
      label,
      date: '2024-03-06',
      implied: false,
      status: 'future',
      daysUntil: 33,
    }];
    const ics = generateICS(ms, baseOpts());
    const crlfLines = ics.split('\r\n');
    for (const line of crlfLines) {
      expect(
        new TextEncoder().encode(line).length,
        `Line exceeds 75 UTF-8 bytes: ${JSON.stringify(line)}`,
      ).toBeLessThanOrEqual(75);
    }
    // Verify round-trip: unfolding (remove CRLF+space sequences) restores the
    // original logical line.
    const summaryLogical = ics
      .split('\r\n')
      .reduce((acc, line) => {
        if (line.startsWith(' ')) return acc + line.slice(1);
        return acc ? acc + '\n' + line : line;
      }, '');
    const summaryLine = summaryLogical.split('\n').find(l => l.startsWith('SUMMARY:'))!;
    expect(summaryLine).toContain(label.replace(/,/g, '\\,').replace(/;/g, '\\;'));
  });

  it('does not split surrogate pairs when label contains astral emoji', () => {
    // 🧬 is U+1F9EC, 4 UTF-8 bytes — requires 2 UTF-16 code units (surrogate pair).
    // Slicing by code unit (String.prototype.slice) would corrupt the character;
    // our code point iterator (for...of) must not split it.
    const label = '🧬 DNA test label that is long enough to require folding because it exceeds seventy five bytes total yes';
    const ms: Milestone[] = [{
      id: 'edd',
      label,
      date: '2024-03-15',
      implied: false,
      status: 'future',
      daysUntil: 1,
    }];
    const ics = generateICS(ms, baseOpts());
    const crlfLines = ics.split('\r\n');
    for (const line of crlfLines) {
      expect(
        new TextEncoder().encode(line).length,
        `Line exceeds 75 UTF-8 bytes: ${JSON.stringify(line)}`,
      ).toBeLessThanOrEqual(75);
    }
    // Verify round-trip: unfold by stripping CRLF+space, then check the emoji
    // is intact in the reconstructed SUMMARY logical line.
    const summaryLogical = ics
      .split('\r\n')
      .reduce((acc, line) => {
        if (line.startsWith(' ')) return acc + line.slice(1);
        return acc ? acc + '\n' + line : line;
      }, '');
    const summaryLine = summaryLogical.split('\n').find(l => l.startsWith('SUMMARY:'))!;
    // The emoji must survive folding and unfolding without corruption
    expect(summaryLine).toContain('🧬');
    // If the surrogate pair were split, codePointAt on the emoji position would
    // return a surrogate value (0xD800–0xDFFF) rather than 0x1F9EC.
    const emojiIdx = summaryLine.indexOf('🧬');
    expect(emojiIdx).toBeGreaterThan(-1);
    expect(summaryLine.codePointAt(emojiIdx)).toBe(0x1F9EC);
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
