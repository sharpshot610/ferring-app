# IVF WHEEL — CLAUDE.md

Personal-use IVF gestational calculator PWA; quality bar = date math exactly right, verified by fixture tests.

## COMMANDS (verbatim — agents receive these exactly)

BUILD: npm run build
CHECK: npm run check

## PROJECT HARD RULES

- src/core/** is pure: no DOM, no localStorage, no Date.now()/new Date() except the todayLocalISO helper; "today" is always a parameter.
- Day offsets (266/280/263/261/−14) are exported constants in src/core/calc.ts — never inline these numbers elsewhere.
- Stack is frozen: Vite + Preact + TypeScript + vitest + vite-plugin-pwa. No other dependencies without asking.
- Medical disclaimer footer must never be removed.
- Any change touching popups, overlays, or date pickers MUST be browser-verified at BOTH a desktop viewport AND an iPhone viewport with touch (playwright `devices['iPhone 14']`, `page.tap`). The ≤480px layout has its own modal/backdrop code path desktop tests never exercise (rule encoded after the iOS backdrop-intercepts-taps bug, PR #11).
- No runtime network requests — offline-first PWA; fonts and all assets are self-hosted and precached.
- UI never does date arithmetic; everything derives from src/core. Deployed base path is /ferring-app/ — never hardcode root-absolute asset URLs.

## OVERRIDES

(none)

## ACTS-ALONE ADDITIONS

(none)

Inherits everything else from ~/Projects/CLAUDE.md.
