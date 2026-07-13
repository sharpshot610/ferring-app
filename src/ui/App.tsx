import { useState, useEffect } from 'preact/hooks';
import { usePersistedState } from '../state/store';
import type { Theme } from '../state/store';
import type { Anchor, Pregnancy } from '../core/calc';
import type { Settings } from '../core/calc';
import { computePregnancy } from '../core/calc';
import { getMilestones } from '../core/milestones';
import { todayLocalISO } from '../core/dates';
import { NavBar } from './NavBar';
import { CalculatorCard } from './CalculatorCard';
import { ScheduleScreen } from './ScheduleScreen';
import { ExportScreen } from './ExportScreen';

type Screen = 'setup' | 'schedule' | 'export';

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

function screenTitle(screen: Screen): string {
  if (screen === 'setup') return 'Calculator';
  if (screen === 'schedule') return 'Schedule';
  return 'Export';
}

export function App() {
  const [state, updateState] = usePersistedState();
  const [today, setToday] = useState<string>(() => {
    try { return todayLocalISO(); } catch { return new Date().toISOString().slice(0, 10); }
  });
  const [error, setError] = useState<string | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);

  // Derive initial screen: if there's a saved anchor, start on schedule
  const [screen, setScreen] = useState<Screen>(() => state.anchor ? 'schedule' : 'setup');
  // Track whether we navigated to setup from the schedule (for Back button)
  const [fromSchedule, setFromSchedule] = useState(false);

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
    } catch {
      // milestones optional; error surfaced via pregnancy computation
    }
  }

  function handleThemeToggle() {
    const next = nextTheme(state.theme);
    updateState({ theme: next });
  }

  function handleCalculate(anchor: Anchor) {
    updateState({ anchor });
    setFromSchedule(false);
    setScreen('schedule');
  }

  function handleSettingsChange(settings: Settings) {
    updateState({ settings });
  }

  function handleEditInputs() {
    setFromSchedule(true);
    setScreen('setup');
  }

  function handleBackToSchedule() {
    setFromSchedule(false);
    setScreen('schedule');
  }

  function handleStartOver() {
    updateState({ anchor: null });
    setFromSchedule(false);
    setScreen('setup');
  }

  function handleGoToExport() {
    setScreen('export');
  }

  function handleBackFromExport() {
    setScreen('schedule');
  }

  // NavBar back/title config per screen
  const navBackLabel =
    screen === 'setup' && fromSchedule ? 'Back' :
    screen === 'export' ? 'Back' :
    undefined;
  const navOnBack =
    screen === 'setup' && fromSchedule ? handleBackToSchedule :
    screen === 'export' ? handleBackFromExport :
    undefined;

  return (
    <div class="app">
      <header class="app-header">
        <div class="app-header__brand">
          <h1 class="app-header__title">IVF Wheel</h1>
          <span class="app-header__subtitle">Gestational calculator</span>
        </div>
      </header>

      <NavBar
        title={screenTitle(screen)}
        backLabel={navBackLabel}
        onBack={navOnBack}
        theme={state.theme}
        onThemeToggle={handleThemeToggle}
      />

      <main class="app-main">
        {error && (
          <div class="error-card card" role="alert">
            <strong>Could not compute dates</strong>
            <p>{error}</p>
          </div>
        )}

        {screen === 'setup' && (
          <CalculatorCard
            anchor={state.anchor}
            settings={state.settings}
            fromSchedule={fromSchedule}
            onCalculate={handleCalculate}
            onSettingsChange={handleSettingsChange}
            onBack={fromSchedule ? handleBackToSchedule : undefined}
          />
        )}

        {screen === 'schedule' && pregnancy && milestones && !error && (
          <ScheduleScreen
            pregnancy={pregnancy}
            milestones={milestones}
            today={today}
            onEditInputs={handleEditInputs}
            onStartOver={handleStartOver}
            onExport={handleGoToExport}
          />
        )}

        {screen === 'export' && pregnancy && milestones && !error && (
          <ExportScreen
            pregnancy={pregnancy}
            milestones={milestones}
            today={today}
            onBack={handleBackFromExport}
          />
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
