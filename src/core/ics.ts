// PURE module — no DOM, no localStorage, no clock. dtstamp is a parameter.
// RFC 5545 compliant iCalendar generator.

import type { Milestone } from './milestones';
import { addDays } from './dates';

export type ReminderLead = 'none' | '1d' | '3d' | '1w';

export interface IcsOptions {
  calendarName: string;        // e.g. "IVF Wheel schedule"
  reminder: ReminderLead;
  dtstamp: string;             // ISODate "YYYY-MM-DD" — caller supplies today; rendered as YYYYMMDDT000000Z
}

/**
 * Escape text per RFC 5545 §3.3.11 TEXT:
 * backslash, semicolon, comma escaped; newlines → \n literal.
 */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|[\r\n]/g, '\\n');
}

/**
 * Convert "YYYY-MM-DD" → "YYYYMMDD".
 */
function isoToCompact(iso: string): string {
  return iso.replace(/-/g, '');
}

/**
 * Fold a content line per RFC 5545 §3.1:
 * lines longer than 75 octets are split with CRLF + single space.
 * We fold at 75 chars (ASCII-safe; labels are ASCII).
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  // First chunk: 75 chars
  parts.push(line.slice(0, 75));
  let pos = 75;
  while (pos < line.length) {
    // Continuation lines start with a space, leaving 74 chars of content
    parts.push(' ' + line.slice(pos, pos + 74));
    pos += 74;
  }
  return parts.join('\r\n');
}

/**
 * Emit a property line, applying text escaping and folding.
 */
function prop(name: string, value: string): string {
  return foldLine(`${name}:${value}`);
}

const REMINDER_TRIGGER: Record<ReminderLead, string | null> = {
  none: null,
  '1d': '-P1D',
  '3d': '-P3D',
  '1w': '-P1W',
};

export function generateICS(milestones: Milestone[], opts: IcsOptions): string {
  const { calendarName, reminder, dtstamp } = opts;
  const dtstampValue = `${isoToCompact(dtstamp)}T000000Z`;
  const triggerValue = REMINDER_TRIGGER[reminder];

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IVF Wheel//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    prop('X-WR-CALNAME', escapeText(calendarName)),
  ];

  for (const ms of milestones) {
    const dtstart = isoToCompact(ms.date);
    const dtend = isoToCompact(addDays(ms.date, 1));
    const uid = `${ms.date}-${ms.id}@ivf-wheel`;
    const summary = escapeText(ms.label) + (ms.implied ? ' (estimated)' : '');

    lines.push('BEGIN:VEVENT');
    lines.push(prop('DTSTART;VALUE=DATE', dtstart));
    lines.push(prop('DTEND;VALUE=DATE', dtend));
    lines.push(prop('DTSTAMP', dtstampValue));
    lines.push(prop('UID', uid));
    lines.push(prop('SUMMARY', summary));

    if (triggerValue !== null) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(prop('DESCRIPTION', escapeText(ms.label)));
      lines.push(prop('TRIGGER', triggerValue));
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // Join with CRLF and add a trailing CRLF
  return lines.join('\r\n') + '\r\n';
}
