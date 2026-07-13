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

type WizardStep = 1 | 2 | 3;

interface AnchorOption {
  type: AnchorType;
  label: string;
  caption: string;
}

const ANCHOR_OPTIONS: AnchorOption[] = [
  {
    type: 'retrieval',
    label: 'Egg retrieval / IUI',
    caption: 'The day eggs were collected or insemination took place',
  },
  {
    type: 'lmp',
    label: 'LMP',
    caption: 'First day of your last menstrual period',
  },
  {
    type: 'transfer_day3',
    label: 'Day-3 transfer',
    caption: 'Cleavage-stage embryo transfer',
  },
  {
    type: 'transfer_day5',
    label: 'Day-5 transfer',
    caption: 'Blastocyst transfer',
  },
  {
    type: 'edd',
    label: 'Due date',
    caption: 'You already know your estimated due date',
  },
  {
    type: 'ga_on_date',
    label: 'Weeks as of date',
    caption: 'You know how many weeks along you were on a certain day',
  },
];

function getLabelForType(type: AnchorType): string {
  return ANCHOR_OPTIONS.find(o => o.type === type)?.label ?? type;
}

export function SetupWizard({
  anchor,
  settings,
  fromSchedule,
  onCalculate,
  onSettingsChange,
  onBack,
}: Props) {
  // If editing (fromSchedule), pre-select the saved anchor type and date.
  // If first-time setup, start with no type selected and empty date.
  const [step, setStep] = useState<WizardStep>(fromSchedule && anchor ? 2 : 1);
  const [anchorType, setAnchorType] = useState<AnchorType | null>(
    fromSchedule && anchor ? anchor.type : null
  );
  // Date: empty on fresh setup; pre-filled when editing.
  const [dateValue, setDateValue] = useState(fromSchedule && anchor ? anchor.date : '');
  const [gaWeeks, setGaWeeks] = useState(anchor?.ga?.weeks ?? 0);
  const [gaDays, setGaDays] = useState(anchor?.ga?.days ?? 0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dateError, setDateError] = useState('');

  function handleSelectType(type: AnchorType) {
    setAnchorType(type);
    setDateError('');
    setStep(2);
  }

  function handleDateChange(val: string) {
    setDateValue(val);
    setDateError('');
  }

  function handleGAChange(weeks: number, days: number) {
    setGaWeeks(weeks);
    setGaDays(days);
  }

  function handleSettingsChange(partial: Partial<Settings>) {
    onSettingsChange({ ...settings, ...partial });
  }

  function handleContinueToConfirm() {
    if (!dateValue || !isValidISODate(dateValue)) {
      setDateError('Please enter a valid date.');
      return;
    }
    if (anchorType === 'ga_on_date' && gaWeeks === 0 && gaDays === 0) {
      setDateError('Please enter gestational age (weeks and/or days).');
      return;
    }
    setDateError('');
    setStep(3);
  }

  function handleCreate() {
    if (!anchorType || !dateValue || !isValidISODate(dateValue)) return;
    const newAnchor: Anchor = {
      type: anchorType,
      date: dateValue,
      ...(anchorType === 'ga_on_date' ? { ga: { weeks: gaWeeks, days: gaDays } } : {}),
    };
    onCalculate(newAnchor);
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  const dateIsValid = !!dateValue && isValidISODate(dateValue);
  const gaIsValid = anchorType !== 'ga_on_date' || gaWeeks > 0 || gaDays > 0;
  const canContinue = dateIsValid && gaIsValid;

  // ─── Step 1: Choose anchor type ───────────────────────────────────────────
  if (step === 1) {
    return (
      <div class="wizard-card card">
        {/* Back to schedule affordance when editing */}
        {onBack && (
          <button class="btn btn--ghost wizard-back-top" onClick={onBack}>
            ← Back to schedule
          </button>
        )}

        <div class="wizard-intro">
          <p class="wizard-intro__text">
            Welcome. Tell us one date you know, and we'll map your entire
            schedule — every appointment, test and milestone.
          </p>
        </div>

        <h2 class="wizard__step-heading">What do you know?</h2>

        <div class="anchor-grid" role="group" aria-label="Choose a date type">
          {ANCHOR_OPTIONS.map(opt => (
            <button
              key={opt.type}
              class="anchor-card"
              onClick={() => handleSelectType(opt.type)}
            >
              <span class="anchor-card__label">{opt.label}</span>
              <span class="anchor-card__caption">{opt.caption}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step 2: Enter date ───────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div class="wizard-card card">
        <div class="wizard-progress">
          <button class="wizard-progress__back" onClick={handleBack}>
            ← Back
          </button>
          <span class="wizard-progress__steps">Step 2 of 3</span>
          <span class="wizard-progress__dots" aria-hidden="true">
            <span class="wizard-progress__dot wizard-progress__dot--done" />
            <span class="wizard-progress__dot wizard-progress__dot--active" />
            <span class="wizard-progress__dot" />
          </span>
        </div>

        <h2 class="wizard__step-heading">When was it?</h2>

        {/* Chosen type with change affordance */}
        <div class="wizard-chosen">
          <span class="wizard-chosen__label">{anchorType ? getLabelForType(anchorType) : ''}</span>
          <button class="btn btn--ghost btn--small wizard-chosen__change" onClick={() => setStep(1)}>
            Change
          </button>
        </div>

        {/* Date input — starts empty for new schedules */}
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
          {!dateValue && !dateError && (
            <p class="form-field__hint">Select a date to continue</p>
          )}
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

        <button
          class="btn btn--primary wizard__cta"
          onClick={handleContinueToConfirm}
          disabled={!canContinue}
        >
          {canContinue ? 'Continue →' : 'Select a date to continue'}
        </button>
      </div>
    );
  }

  // ─── Step 3: Confirm ──────────────────────────────────────────────────────
  return (
    <div class="wizard-card card">
      <div class="wizard-progress">
        <button class="wizard-progress__back" onClick={handleBack}>
          ← Back
        </button>
        <span class="wizard-progress__steps">Step 3 of 3</span>
        <span class="wizard-progress__dots" aria-hidden="true">
          <span class="wizard-progress__dot wizard-progress__dot--done" />
          <span class="wizard-progress__dot wizard-progress__dot--done" />
          <span class="wizard-progress__dot wizard-progress__dot--active" />
        </span>
      </div>

      <h2 class="wizard__step-heading">Confirm</h2>

      <div class="wizard-summary">
        <div class="wizard-summary__row">
          <span class="wizard-summary__key">Date type</span>
          <span class="wizard-summary__val">{anchorType ? getLabelForType(anchorType) : ''}</span>
        </div>
        <div class="wizard-summary__row">
          <span class="wizard-summary__key">Date</span>
          <span class="wizard-summary__val">{dateValue}</span>
        </div>
        {anchorType === 'ga_on_date' && (
          <div class="wizard-summary__row">
            <span class="wizard-summary__key">Gestational age</span>
            <span class="wizard-summary__val">{gaWeeks}w {gaDays}d</span>
          </div>
        )}
      </div>

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

      <button
        class="btn btn--primary wizard__cta"
        onClick={handleCreate}
      >
        Create my schedule
      </button>
    </div>
  );
}
