import { useState, useEffect } from 'preact/hooks';
import { usePersistedState } from '../state/store';
import type { Theme } from '../state/store';
import type { Anchor, Pregnancy } from '../core/calc';
import type { Settings } from '../core/calc';
import { computePregnancy } from '../core/calc';
import { getMilestones } from '../core/milestones';
import { todayLocalISO } from '../core/dates';
import { TodayHeader } from './TodayHeader';
import { Timeline } from './Timeline';
import { CalculatorCard } from './CalculatorCard';

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

function applyTheme(theme: Theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function nextTheme(current: Theme): Theme {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
}

function themeLabel(t: Theme): string {
  if (t === 'system') return 'System';
  if (t === 'light') return 'Light';
  return 'Dark';
}

export function App() {
  const [state, updateState] = usePersistedState();
  const [today, setToday] = useState<string>(() => {
    try { return todayLocalISO(); } catch { return new Date().toISOString().slice(0, 10); }
  });
  const [calcCollapsed, setCalcCollapsed] = useState(!!state.anchor);
  const [error, setError] = useState<string | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);

  // Apply theme on mount and on theme change
  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  // Recompute "today" at next local midnight
  useEffect(() => {
    const ms = msUntilMidnight();
    const id = setTimeout(() => {
      try { setToday(todayLocalISO()); } catch { setToday(new Date().toISOString().slice(0, 10)); }
    }, ms);
    return () => clearTimeout(id);
  }, [today]);

  // Recompute pregnancy whenever anchor or settings change
  useEffect(() => {
    if (!state.anchor) {
      setPregnancy(null);
      setError(null);
      return;
    }
    try {
      const p = computePregnancy(state.anchor, state.settings);
      setPregnancy(p);
      setError(null);
    } catch (e) {
      setPregnancy(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [state.anchor, state.settings]);

  let milestones = null;
  if (pregnancy) {
    try {
      milestones = getMilestones(pregnancy, today);
    } catch (e) {
      // milestones optional; error already surfaced via pregnancy computation
    }
  }

  function handleAnchorChange(anchor: Anchor) {
    updateState({ anchor });
  }

  function handleSettingsChange(settings: Settings) {
    updateState({ settings });
  }

  function handleThemeToggle() {
    const next = nextTheme(state.theme);
    updateState({ theme: next });
  }

  return (
    <div class="app">
      <header class="app-header">
        <div class="app-header__brand">
          <h1 class="app-header__title">IVF Wheel</h1>
          <span class="app-header__subtitle">Gestational calculator</span>
        </div>
        <button
          class="btn btn--ghost btn--small theme-toggle"
          onClick={handleThemeToggle}
          aria-label={`Switch theme (current: ${themeLabel(state.theme)})`}
          title={`Theme: ${themeLabel(state.theme)}`}
        >
          {state.theme === 'dark' ? '☀️' : state.theme === 'light' ? '🌙' : '⚙️'} {themeLabel(state.theme)}
        </button>
      </header>

      <main class="app-main">
        {/* Error card — shown while core is stubbed or on any computation error */}
        {error && (
          <div class="error-card card" role="alert">
            <strong>Could not compute dates</strong>
            <p>{error}</p>
            <p class="error-card__hint">Date calculations are being set up — results will appear once complete.</p>
          </div>
        )}

        {/* No anchor yet → show calculator prominently */}
        {!state.anchor && (
          <CalculatorCard
            anchor={state.anchor}
            settings={state.settings}
            pregnancy={pregnancy}
            onAnchorChange={handleAnchorChange}
            onSettingsChange={handleSettingsChange}
          />
        )}

        {/* Anchor present → show today header, timeline, and collapsed calculator */}
        {state.anchor && (
          <>
            {pregnancy && !error && (
              <TodayHeader pregnancy={pregnancy} today={today} />
            )}

            {pregnancy && milestones && !error && (
              <Timeline milestones={milestones} />
            )}

            <CalculatorCard
              anchor={state.anchor}
              settings={state.settings}
              pregnancy={pregnancy}
              onAnchorChange={handleAnchorChange}
              onSettingsChange={handleSettingsChange}
              collapsed={calcCollapsed}
              onToggleCollapse={() => setCalcCollapsed(c => !c)}
            />
          </>
        )}
      </main>

      <footer class="app-footer">
        <p class="disclaimer">
          This app is not intended to offer or replace professional medical advice.
        </p>
      </footer>
    </div>
  );
}
