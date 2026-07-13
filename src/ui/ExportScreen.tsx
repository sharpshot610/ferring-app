import { useState } from 'preact/hooks';
import type { Pregnancy } from '../core/calc';
import type { Milestone } from '../core/milestones';
import type { ReminderLead } from '../core/ics';
import { generateICS } from '../core/ics';
import { scheduleSummaryText, formatMilestoneDate } from '../core/summary';
import { todayLocalISO } from '../core/dates';

// Use the shared pure formatter so the export screen and the copy-summary text
// always display identical date strings (single source of truth).
const formatDate = formatMilestoneDate;

interface Props {
  pregnancy: Pregnancy;
  milestones: Milestone[];
  today: string;
  onBack: () => void;
}

export function ExportScreen({ pregnancy, milestones, today, onBack }: Props) {
  // All milestones checked by default
  const [checked, setChecked] = useState<Set<string>>(() => new Set(milestones.map(m => m.id)));
  const [reminder, setReminder] = useState<ReminderLead>('none');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const [fallbackText, setFallbackText] = useState('');

  function toggleMilestone(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDownloadICS() {
    const selected = milestones.filter(m => checked.has(m.id));
    if (selected.length === 0) return;

    let dtstamp: string;
    try {
      dtstamp = todayLocalISO();
    } catch {
      dtstamp = today;
    }

    const icsText = generateICS(selected, {
      calendarName: 'IVF Wheel schedule',
      reminder,
      dtstamp,
    });

    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ivf-schedule.ics';
    document.body.appendChild(a);
    a.click();
    // Defer cleanup: Safari processes downloads asynchronously, so revoking the
    // URL synchronously can abort the download before the browser fetches it.
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function handlePrint() {
    window.print();
  }

  function handleCopySummary() {
    const text = scheduleSummaryText(pregnancy, milestones, today);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), 2000);
      }).catch(() => {
        showFallback(text);
      });
    } else {
      showFallback(text);
    }
  }

  function showFallback(text: string) {
    setFallbackText(text);
    setCopyState('fallback');
  }

  // Feature 5: Share button — only shown when navigator.share is available
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  function handleShare() {
    if (!canShare) return;
    const text = scheduleSummaryText(pregnancy, milestones, today);
    navigator.share({ title: 'IVF Wheel schedule', text }).catch((err: unknown) => {
      // Silently ignore AbortError (user cancelled); surface other errors
      if (err instanceof Error && err.name === 'AbortError') return;
      // Other errors: nothing actionable to show in this path
    });
  }

  const selectedCount = checked.size;

  return (
    <div class="screen-content">

      {/* Section A: Personal calendar */}
      <div class="card export-section">
        <h2 class="export-section__title">Personal calendar</h2>

        <div class="milestone-checklist" role="group" aria-label="Select milestones to export">
          {milestones.map(m => (
            <label key={m.id} class="milestone-check">
              <input
                type="checkbox"
                checked={checked.has(m.id)}
                onChange={() => toggleMilestone(m.id)}
              />
              <span class="milestone-check__label">{m.label}</span>
              <span class="milestone-check__date">{formatDate(m.date)}</span>
            </label>
          ))}
        </div>

        <div class="form-field">
          <label class="form-field__label" for="reminder-select">Reminder</label>
          <select
            id="reminder-select"
            class="input"
            value={reminder}
            onChange={e => setReminder((e.target as HTMLSelectElement).value as ReminderLead)}
          >
            <option value="none">No reminder</option>
            <option value="1d">1 day before</option>
            <option value="3d">3 days before</option>
            <option value="1w">1 week before</option>
          </select>
        </div>

        <button
          class="btn btn--primary"
          style="width: 100%;"
          onClick={handleDownloadICS}
          disabled={selectedCount === 0}
        >
          Download calendar file (.ics)
        </button>

        <p class="export-hint">
          Opens in Apple / Google Calendar — import adds the events with your chosen reminder.
        </p>
      </div>

      {/* Section B: Reference copy */}
      <div class="card export-section">
        <h2 class="export-section__title">Reference copy</h2>

        <div class="export-btn-row">
          <button class="btn btn--secondary" onClick={handlePrint}>
            Print / Save as PDF
          </button>
          <button class="btn btn--secondary" onClick={handleCopySummary}>
            {copyState === 'copied' ? 'Copied ✓' : 'Copy summary'}
          </button>
          {canShare && (
            <button class="btn btn--secondary" onClick={handleShare}>
              Share…
            </button>
          )}
        </div>

        {copyState === 'fallback' && (
          <div class="form-field" style="margin-top: var(--space-md);">
            <label class="form-field__label">Schedule text (select all and copy)</label>
            <textarea
              class="input summary-textarea"
              readOnly
              rows={12}
              value={fallbackText}
              ref={(el: HTMLTextAreaElement | null) => {
                if (el) { el.select(); }
              }}
            />
            <button
              class="btn btn--secondary"
              style="margin-top: var(--space-sm);"
              onClick={() => setCopyState('idle')}
            >
              Done
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
