import { formatMilestoneDate } from '../core/summary';

// ─── DatePickerField ──────────────────────────────────────────────────────────
// Renders a tappable affordance when no date is chosen (fixes Safari ghost-date
// placeholder confusion). The native <input type="date"> sits invisibly on top
// so tapping anywhere opens the OS picker.
export interface DatePickerFieldProps {
  value: string;        // ISO date string or ''
  hasError: boolean;
  onChange: (val: string) => void;
  /** Text shown when no date is chosen. Defaults to "📅 Tap to choose a date". */
  placeholder?: string;
}

export function DatePickerField({ value, hasError, onChange, placeholder = '📅 Tap to choose a date' }: DatePickerFieldProps) {
  function handleChange(e: Event) {
    onChange((e.target as HTMLInputElement).value);
  }

  return (
    <div class={['date-picker-wrapper', hasError ? 'date-picker-wrapper--error' : ''].filter(Boolean).join(' ')}>
      {value ? (
        <span class="date-picker-wrapper__chosen">
          {formatMilestoneDate(value)}
          <span class="date-picker-wrapper__change-hint">Tap to change</span>
        </span>
      ) : (
        <span class="date-picker-wrapper__placeholder">{placeholder}</span>
      )}
      {/* Native input sits invisibly on top; cursor:pointer opens OS picker */}
      <input
        class="date-picker-wrapper__native"
        type="date"
        value={value}
        aria-label="Choose date"
        onInput={handleChange}
        onChange={handleChange}
      />
    </div>
  );
}
