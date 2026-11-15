# Mongli Game — "Expediente" design system

Noir case file, formal and calm. Adapted from UI/UX Pro Max (Minimalism & Swiss Style, dark).

## Color (tokens in `app/globals.css` and `tailwind.config.ts` → `noir.*`)
| Token | Hex | Use |
|---|---|---|
| `--bg` / `noir-bg` | #0B0B0C | page background |
| `--surface` / `noir-card` | #131315 | panels |
| `--raised` / `noir-raised` | #1A1A1D | hover / bars |
| `--line` / `noir-border` | #2A292D | hairlines |
| `--text` / `noir-text` | #ECE8E1 | primary text |
| `--muted` / `noir-muted` | #A29C92 | secondary text (7:1) |
| `--faint` / `noir-faint` | #77726A | captions only, never body |
| `--accent` / `noir-accent` | #E5483D | the single accent: text, borders, marks (4.8:1) |
| `--accent-fill` / `noir-fill` | #B3261E | filled primary buttons with white text (6.6:1) |
| `--ok` / `noir-ok` | #7FB685 | "real / confirmed" states only |

Identity colors (data, not decoration): Arquitecto = accent, Testigo = paper, Espejo = #8E97AB.

## Type
- Display: **Archivo** (wdth 112–118, 650–800, tight tracking) — titles and wordmark.
- Body: **IBM Plex Sans** 16 px, line-height 1.6.
- Mono: **IBM Plex Mono** — addresses, hashes, numbers, eyebrows.
- Stamp: **Special Elite** — only the "case file" stamps (`.stamp`).

## Components
`.btn` + `.btn-primary | .btn-secondary | .btn-ghost` (48 px, hard offset shadow on primary, press = translate 2px),
`.panel`, `.panel-hard`, `.chip`, `.eyebrow`, `.h-display`, `.h-section`, `.lead`, `.frame-marks` (evidence plate),
`.gx-overlay | .gx-eyebrow | .gx-title | .gx-sub | .gx-hud` for in-game screens. Icons: `components/Icons.tsx` (Lucide geometry, no emoji).

## Rules
- One accent. No glows, no glass, no neon, no scanlines, no custom cursor.
- Body ≥ 16 px; nothing under 12 px; touch targets ≥ 44 px.
- Honest labels: testnet everywhere; 0G Storage save is still simulated.
- Motion: 150–500 ms entrances, `MotionConfig reducedMotion="user"`; content visible without scroll triggers.
