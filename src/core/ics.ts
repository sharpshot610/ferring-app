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
 * Return the number of UTF-8 bytes a single Unicode code point occupies.
 * Pure: no TextEncoder, no Buffer — uses code-point ranges per RFC 3629.
 */
function utf8ByteLength(cp: number): number {
  if (cp <= 0x7f) return 1;
  if (cp <= 0x7ff) return 2;
  if (cp <= 0xffff) return 3;
  return 4; // supplementary planes (U+10000–U+10FFFF)
}

/**
 * Fold a content line per RFC 5545 §3.1:
 * lines longer than 75 octets are split with CRLF + single space.
 * Folds by UTF-8 byte count (not UTF-16 code units) to handle multibyte
 * characters such as β (U+03B2, 2 bytes) and emoji (4 bytes) correctly.
 * First line ≤ 75 octets; each continuation line ≤ 75 octets (leading space
 * counts as 1 octet, leaving 74 octets of content).
 */
function foldLine(line: string): string {
  // Fast path: pure ASCII lines (code unit count == byte count)
  if (line.length <= 75 && /^[\x00-\x7f]*$/.test(line)) return line;

  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  let isFirst = true;
  const limit = () => (isFirst ? 75 : 74); // first line 75; continuations 74 (+ leading space = 75)

  for (const ch of line) { // iterates code points, not code units
    const cp = ch.codePointAt(0)!;
    const bytes = utf8ByteLength(cp);
    if (currentBytes + bytes > limit()) {
      parts.push(isFirst ? current : ' ' + current);
      current = ch;
      currentBytes = bytes;
      isFirst = false;
    } else {
      current += ch;
      currentBytes += bytes;
    }
  }
  if (current.length > 0 || parts.length === 0) {
    parts.push(isFirst ? current : ' ' + current);
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
    const uid = `${ms.id}@ivf-wheel`;
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
