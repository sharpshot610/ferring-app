# IVF WHEEL — CLAUDE.md

Personal-use IVF gestational calculator PWA; quality bar = date math exactly right, verified by fixture tests.

## COMMANDS (verbatim — agents receive these exactly)

BUILD: npm run build
CHECK: npm run check

## PROJECT HARD RULES

- src/core/** is pure: no DOM, no localStorage, no Date.now()/new Date() except the todayLocalISO helper; "today" is always a parameter.
- Day offsets (266/280/263/261/−14) are exported constants in src/core/calc.ts — never inline these numbers elsewhere.
- Stack is frozen: Vite + Preact + TypeScript + vitest (+ vite-plugin-pwa later). No other dependencies without asking.
- Medical disclaimer footer must never be removed.

## OVERRIDES

(none)

## ACTS-ALONE ADDITIONS

(none)

Inherits everything else from ~/Projects/CLAUDE.md.
