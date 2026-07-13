import type { Theme } from '../state/store';

interface Props {
  title: string;
  backLabel?: string;
  onBack?: () => void;
  theme: Theme;
  onThemeToggle: () => void;
}

function themeLabel(t: Theme): string {
  if (t === 'system') return 'System';
  if (t === 'light') return 'Light';
  return 'Dark';
}

export function NavBar({ title, backLabel, onBack, theme, onThemeToggle }: Props) {
  return (
    <nav class="nav-bar" aria-label="Screen navigation">
      <div class="nav-bar__left">
        {onBack && backLabel && (
          <button class="btn btn--ghost btn--small nav-back" onClick={onBack}>
            ← {backLabel}
          </button>
        )}
      </div>
      <div class="nav-bar__center">
        <span class="nav-bar__title">{title}</span>
      </div>
      <div class="nav-bar__right">
        <button
          class="btn btn--ghost btn--small theme-toggle"
          onClick={onThemeToggle}
          aria-label={`Switch theme (current: ${themeLabel(theme)})`}
          title={`Theme: ${themeLabel(theme)}`}
        >
          {theme === 'dark' ? '☀️' : theme === 'light' ? '🌙' : '⚙️'} {themeLabel(theme)}
        </button>
      </div>
    </nav>
  );
}
