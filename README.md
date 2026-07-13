# IVF Wheel

A personal-use IVF gestational calculator — a modern replacement for Ferring Pharmaceuticals' "IVF Wheel" app. Enter any one known date (egg retrieval/IUI, LMP, Day-3 or Day-5 embryo transfer, due date, or "X weeks as of a date") and it derives every milestone of the pregnancy.

**Live app:** https://sharpshot610.github.io/ferring-app/ — install via Safari → Share → Add to Home Screen. Fully offline after first load; all data stays on the device (localStorage, no accounts, no backend, nothing transmitted).

## Features

- Guided 3-step setup wizard with a custom in-app calendar date picker
- Schedule view: milestone timeline, phase banner (two-week wait → trimesters), gestational/conceptional age, week-by-week fetal size + development notes, progress bar
- Interactive inline calendar with bidirectional milestone ↔ day highlighting
- β-hCG doubling-time calculator (informational)
- Export: `.ics` calendar file with reminder alarms (Apple/Google Calendar), print/PDF, copy summary, iOS share sheet
- Clean landing on every visit with a one-tap "View my schedule" resume banner
- Dark mode; burgundy/chartreuse brand; Montserrat + Karla (self-hosted)

## Medical formulas (ACOG-based)

All anchors normalize to a canonical LMP; everything derives by exact integer day offsets (leap-year-correct UTC epoch-day arithmetic):

| Anchor | Offset to EDD |
|---|---|
| Egg retrieval / IUI | +266 days |
| LMP | +280 days |
| Day-3 transfer | +263 days |
| Day-5 transfer | +261 days |

β-hCG test: transfer +10d (Day-5) / +12d (Day-3), configurable. Last progesterone: 10w0d GA default, configurable. Trimesters end 13w6d / 27w6d. Fetal size: perinatology.com reference (weeks 10–13 weights use CRL-consistent published averages — see `src/core/fetalGrowth.ts`).

**Not medical advice.** All dates should be confirmed with a clinic.

## Development

- Stack: Vite + Preact + TypeScript, vitest, vite-plugin-pwa. Only runtime dependency is `preact`.
- `npm run dev` / `npm run check` (typecheck + 240 tests + build — the definition of done) / `npm run preview`
- `src/core/` is pure — no DOM, no localStorage, no clock ("today" is always a parameter); all day offsets are exported constants
- Deploys automatically to GitHub Pages on every push to `main`, gated by `npm run check` (`.github/workflows/deploy.yml`)
- See `CLAUDE.md` for project rules
