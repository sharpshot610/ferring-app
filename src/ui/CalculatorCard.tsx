import { useState } from 'preact/hooks';
import type { AnchorType, Anchor, Settings } from '../core/calc';
import { isValidISODate } from '../core/dates';

interface Props {
  anchor: Anchor | null;
  settings: Settings;
  fromSchedule: boolean;
  onCalculate: (anchor: Anchor) => void;
  onSettingsChange: (settings: Settings) => void;
  onBack?: () => void;
}

const ANCHOR_OPTIONS: { type: AnchorType; label: string }[] = [
  { type: 'retrieval', label: 'Egg retrieval / IUI' },
  { type: 'lmp', label: 'LMP' },
  { type: 'transfer_day3', label: 'Day-3 transfer' },
  { type: 'transfer_day5', label: 'Day-5 transfer' },
  { type: 'edd', label: 'Due date' },
  { type: 'ga_on_date', label: 'Weeks as of date' },
];

export function CalculatorCard({
  anchor,
  settings,
  onCalculate,
  onSettingsChange,
  onBack,
}: Props) {
  const [anchorType, setAnchorType] = useState<AnchorType>(anchor?.type ?? 'retrieval');
  const [dateValue, setDateValue] = useState(anchor?.date ?? '');
  const [gaWeeks, setGaWeeks] = useState(anchor?.ga?.weeks ?? 0);
  const [gaDays, setGaDays] = useState(anchor?.ga?.days ?? 0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dateError, setDateError] = useState('');

  function handleAnchorTypeChange(type: AnchorType) {
    setAnchorType(type);
    setDateError('');
  }

  function handleDateChange(val: string) {
    setDateValue(val);
    setDateError('');
  }

  function handleGAChange(weeks: number, days: number) {
    setGaWeeks(weeks);
    setGaDays(days);
  }

  function handleCalculate() {
    if (!dateValue) return;
    if (!isValidISODate(dateValue)) {
      setDateError('Please enter a valid date.');
      return;
    }
    if (anchorType === 'ga_on_date' && gaWeeks === 0 && gaDays === 0) {
      setDateError('Please enter gestational age (weeks and/or days).');
      return;
    }
    setDateError('');
    const newAnchor: Anchor = {
      type: anchorType,
      date: dateValue,
      ...(anchorType === 'ga_on_date' ? { ga: { weeks: gaWeeks, days: gaDays } } : {}),
    };
    onCalculate(newAnchor);
  }

  function handleSettingsChange(partial: Partial<Settings>) {
    onSettingsChange({ ...settings, ...partial });
  }

  return (
    <div class="calculator-card card">
      <h2 class="calculator-card__title">Calculate dates</h2>

      {/* Anchor type segmented control */}
      <div class="segmented-control" role="group" aria-label="Anchor type">
        {ANCHOR_OPTIONS.map(opt => (
          <button
            key={opt.type}
            class={[
              'segmented-control__btn',
              anchorType === opt.type ? 'segmented-control__btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleAnchorTypeChange(opt.type)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date input */}
      <div class="form-field">
        <label class="form-field__label">Date</label>
        <input
          class={['input', dateError ? 'input--error' : ''].filter(Boolean).join(' ')}
          type="date"
          value={dateValue}
          onInput={e => handleDateChange((e.target as HTMLInputElement).value)}
          onChange={e => handleDateChange((e.target as HTMLInputElement).value)}
        />
        {dateError && <p class="form-field__error">{dateError}</p>}
      </div>

      {/* GA inputs — only for ga_on_date */}
      {anchorType === 'ga_on_date' && (
        <div class="form-field form-field--row">
          <div class="form-field">
            <label class="form-field__label">Weeks</label>
            <input
              class="input input--narrow"
              type="number"
              min={0}
              max={42}
              value={gaWeeks}
              onInput={e =>
                handleGAChange(parseInt((e.target as HTMLInputElement).value, 10) || 0, gaDays)
              }
            />
          </div>
          <div class="form-field">
            <label class="form-field__label">Days</label>
            <input
              class="input input--narrow"
              type="number"
              min={0}
              max={6}
              value={gaDays}
              onInput={e =>
                handleGAChange(gaWeeks, parseInt((e.target as HTMLInputElement).value, 10) || 0)
              }
            />
          </div>
        </div>
      )}

      {/* Protocol settings collapsible */}
      <div class="collapsible">
        <button
          class="collapsible__trigger"
          onClick={() => setSettingsOpen(o => !o)}
          aria-expanded={settingsOpen}
        >
          Protocol settings
          <span class="collapsible__chevron">{settingsOpen ? '▲' : '▼'}</span>
        </button>
        {settingsOpen && (
          <div class="collapsible__body">
            <div class="form-field">
              <label class="form-field__label">β-hCG days after day-5 transfer</label>
              <input
                class="input input--narrow"
                type="number"
                min={1}
                value={settings.betaHcgAfterDay5}
                onInput={e =>
                  handleSettingsChange({
                    betaHcgAfterDay5: parseInt((e.target as HTMLInputElement).value, 10) || 10,
                  })
                }
              />
            </div>
            <div class="form-field">
              <label class="form-field__label">β-hCG days after day-3 transfer</label>
              <input
                class="input input--narrow"
                type="number"
                min={1}
                value={settings.betaHcgAfterDay3}
                onInput={e =>
                  handleSettingsChange({
                    betaHcgAfterDay3: parseInt((e.target as HTMLInputElement).value, 10) || 12,
                  })
                }
              />
            </div>
            <div class="form-field form-field--row">
              <div class="form-field">
                <label class="form-field__label">Last progesterone — weeks</label>
                <input
                  class="input input--narrow"
                  type="number"
                  min={0}
                  value={settings.lastProgesteroneGA.weeks}
                  onInput={e =>
                    handleSettingsChange({
                      lastProgesteroneGA: {
                        ...settings.lastProgesteroneGA,
                        weeks: parseInt((e.target as HTMLInputElement).value, 10) || 0,
                      },
                    })
                  }
                />
              </div>
              <div class="form-field">
                <label class="form-field__label">Days</label>
                <input
                  class="input input--narrow"
                  type="number"
                  min={0}
                  max={6}
                  value={settings.lastProgesteroneGA.days}
                  onInput={e =>
                    handleSettingsChange({
                      lastProgesteroneGA: {
                        ...settings.lastProgesteroneGA,
                        days: parseInt((e.target as HTMLInputElement).value, 10) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div class="form-field">
              <label class="form-field__label">Transfer kind</label>
              <select
                class="input"
                value={settings.transferKind}
                onChange={e =>
                  handleSettingsChange({
                    transferKind: (e.target as HTMLSelectElement).value as Settings['transferKind'],
                  })
                }
              >
                <option value="unknown">Unknown</option>
                <option value="fresh">Fresh</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Primary action */}
      <button
        class="btn btn--primary"
        style="width: 100%; margin-top: var(--space-md);"
        onClick={handleCalculate}
        disabled={!dateValue}
      >
        Calculate schedule
      </button>

      {/* Back button — only shown when arriving from schedule screen */}
      {onBack && (
        <button
          class="btn btn--ghost"
          style="width: 100%; margin-top: var(--space-sm);"
          onClick={onBack}
        >
          ← Back to schedule
        </button>
      )}
    </div>
  );
}
