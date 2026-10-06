# Color system — Nothing Dot

Status: implemented in `theme/palettes.ts` (2026-10-06). CSS export: `docs/design/color-system.css`. Contrast is enforced by `theme/__tests__/contrast.test.ts`.

## 1. Grading concept

Cool graphite under daylight: almost no saturation (OKLCH chroma ≤ 0.006) with every neutral pulled a hair toward blue (hue 255). Shadows sit in cool near-black (L 0.155, never #000), midtones stay neutral-cool, and highlights are a cool paper white (L 0.96–0.995, never #FFF). The app is deliberately colorless so the warm brown monkey, the only colored object, reads as the subject of every screen. Warm subject on cool ground is the classic complementary split.

## 2. Core palette

- **Primary / secondary / accent:** none, by design. The decision was made in the Nothing Dot redesign. "Active" means the primary text tone (lit dot, filled CTA, progress); the monkey carries color. One material exception: `seasonGold #C6A15B` for seasonal badges and the stage-up surface.
- **Neutral ramp** (hue 255, chroma 0.006; 0.0036 at the extremes):

| Step | HEX | OKLCH |
|---|---|---|
| 50 | `#F8FAFD` | oklch(0.985 0.0036 255) |
| 100 | `#F1F3F5` | oklch(0.962 0.0036 255) |
| 200 | `#E0E3E7` | oklch(0.915 0.006 255) |
| 300 | `#CBCED2` | oklch(0.85 0.006 255) |
| 400 | `#A2A5A8` | oklch(0.72 0.006 255) |
| 500 | `#7E8084` | oklch(0.6 0.006 255) |
| 600 | `#616367` | oklch(0.5 0.006 255) |
| 700 | `#46484B` | oklch(0.4 0.006 255) |
| 800 | `#292B2E` | oklch(0.29 0.006 255) |
| 900 | `#16181B` | oklch(0.21 0.006 255) |
| 950 | `#0B0C0E` | oklch(0.155 0.0036 255) |

## 3. Semantic tokens

| Token | App key | Light | Dark |
|---|---|---|---|
| bg | `base` | `#F1F3F5` oklch(0.962 0.0036 255) | `#0B0C0E` oklch(0.155 0.0036 255) |
| surface1 | `tile / surface` | `#FAFBFD` oklch(0.988 0.003 255) | `#131518` oklch(0.195 0.006 255) |
| surface2 | `tilePressed / raised (light: raisedPressed)` | `#E7EAED` oklch(0.935 0.006 255) | `#1B1D20` oklch(0.23 0.006 255) |
| surface3 | `raisedPressed (sheet, popover)` | `#FCFDFF` oklch(0.995 0.002 255) | `#232528` oklch(0.265 0.006 255) |
| rule | `rule` | `#DBDEE2` oklch(0.9 0.006 255) | `#202225` oklch(0.25 0.006 255) |
| border | `edge (decorative hairline)` | `#D2D4D8` oklch(0.87 0.006 255) | `#2E3033` oklch(0.31 0.006 255) |
| borderStrong | `borderStrong (inputs, toggles)` | `#84868A` oklch(0.62 0.006 255) | `#67696C` oklch(0.52 0.006 255) |
| textPrimary | `text (also active / accent*)` | `#15171A` oklch(0.205 0.006 255) | `#E9EBEE` oklch(0.94 0.004 255) |
| textSecondary | `muted` | `#595B5E` oklch(0.47 0.006 255) | `#A2A5A8` oklch(0.72 0.006 255) |
| textTertiary | `faint` | `#67696C` oklch(0.52 0.006 255) | `#84868A` oklch(0.62 0.006 255) |
| disabled | `disabled` | `#A8ABAF` oklch(0.74 0.006 255) | `#535559` oklch(0.45 0.006 255) |
| dotOff | `dotOff` | `#D5D8DB` oklch(0.88 0.006 255) | `#292B2E` oklch(0.29 0.006 255) |
| dotDim | `dotDim` | `#A2A5A8` oklch(0.72 0.006 255) | `#4E5053` oklch(0.43 0.006 255) |
| onPrimary | `onText / onAccent` | `#F1F3F5` oklch(0.962 0.0036 255) | `#0B0C0E` oklch(0.155 0.0036 255) |
| success | `stateSuccess` | `#21763C` oklch(0.5 0.12 150) | `#7CCD8E` oklch(0.78 0.12 150) |
| warning | `stateWarning` | `#A46400` oklch(0.56 0.13 70) | `#EEC05B` oklch(0.83 0.13 85) |
| error | `danger` | `#C2272D` oklch(0.53 0.19 25) | `#F66D67` oklch(0.7 0.17 25) |
| info | `stateInfo` | `#006AA0` oklch(0.5 0.12 240) | `#7BB9E5` oklch(0.76 0.09 240) |
| focus | `focus` | `#15171A` oklch(0.205 0.006 255) | `#E9EBEE` oklch(0.94 0.004 255) |

Elevation is expressed by lightness only: base → surface1 → surface2 → surface3 step ≈ +0.035 L in dark mode. No shadows.

## 4. Contrast table (WCAG 2.2 and APCA Lc)

Minimums: 4.5:1 for body text, 3:1 for large text and UI boundaries. "Exempt" marks pairs that are decorative under WCAG 1.4.11, where the tile is identified by its content and dim dots are ornament. A lock icon or label always carries the meaning.

### Light

| Pair | FG | BG | WCAG | APCA Lc | Need | Result |
|---|---|---|---|---|---|---|
| Body text | `#15171A` | `#F1F3F5` | 16.14:1 | 97.4 | 4.5 | pass |
| Body text on tile | `#15171A` | `#FAFBFD` | 17.34:1 | 102.3 | 4.5 | pass |
| Body text on pressed tile | `#15171A` | `#E7EAED` | 14.87:1 | 92.0 | 4.5 | pass |
| Body text on sheet | `#15171A` | `#FCFDFF` | 17.64:1 | 103.5 | 4.5 | pass |
| Secondary text | `#595B5E` | `#F1F3F5` | 6.12:1 | 76.2 | 4.5 | pass |
| Secondary text on tile | `#595B5E` | `#FAFBFD` | 6.58:1 | 81.1 | 4.5 | pass |
| Secondary on pressed | `#595B5E` | `#E7EAED` | 5.64:1 | 70.9 | 4.5 | pass |
| Tertiary text | `#67696C` | `#F1F3F5` | 4.95:1 | 70.2 | 4.5 | pass |
| Tertiary on tile | `#67696C` | `#FAFBFD` | 5.32:1 | 75.1 | 4.5 | pass |
| Primary CTA label | `#F1F3F5` | `#15171A` | 16.14:1 | -98.8 | 4.5 | pass |
| Focus ring | `#15171A` | `#F1F3F5` | 16.14:1 | 97.4 | 3 | pass |
| Focus ring on tile | `#15171A` | `#FAFBFD` | 17.34:1 | 102.3 | 3 | pass |
| Control boundary | `#84868A` | `#F1F3F5` | 3.28:1 | 56.8 | 3 | pass |
| Control boundary on tile | `#84868A` | `#FAFBFD` | 3.52:1 | 61.6 | 3 | pass |
| Lit vs unlit dot | `#15171A` | `#D5D8DB` | 12.55:1 | 81.7 | 3 | pass |
| Error text | `#C2272D` | `#FAFBFD` | 5.6:1 | 74.9 | 4.5 | pass |
| Success text | `#21763C` | `#FAFBFD` | 5.45:1 | 75.4 | 4.5 | pass |
| Warning text | `#A46400` | `#FAFBFD` | 4.61:1 | 70.3 | 4.5 | pass |
| Info text | `#006AA0` | `#FAFBFD` | 5.68:1 | 76.4 | 4.5 | pass |
| Tile hairline (decorative, exempt) | `#D2D4D8` | `#FAFBFD` | 1.43:1 | 20.4 | — | exempt |
| Dim dot (decorative, exempt) | `#A2A5A8` | `#F1F3F5` | 2.23:1 | 41.4 | — | exempt |
| Disabled (exempt) | `#A8ABAF` | `#F1F3F5` | 2.07:1 | 38.2 | — | exempt |

### Dark

| Pair | FG | BG | WCAG | APCA Lc | Need | Result |
|---|---|---|---|---|---|---|
| Body text | `#E9EBEE` | `#0B0C0E` | 16.38:1 | -94.5 | 4.5 | pass |
| Body text on tile | `#E9EBEE` | `#131518` | 15.31:1 | -93.9 | 4.5 | pass |
| Body text on pressed tile | `#E9EBEE` | `#1B1D20` | 14.14:1 | -93.0 | 4.5 | pass |
| Body text on sheet | `#E9EBEE` | `#232528` | 12.86:1 | -91.8 | 4.5 | pass |
| Secondary text | `#A2A5A8` | `#0B0C0E` | 7.91:1 | -53.1 | 4.5 | pass |
| Secondary text on tile | `#A2A5A8` | `#131518` | 7.39:1 | -52.5 | 4.5 | pass |
| Secondary on pressed | `#A2A5A8` | `#1B1D20` | 6.82:1 | -51.6 | 4.5 | pass |
| Tertiary text | `#84868A` | `#0B0C0E` | 5.37:1 | -37.4 | 4.5 | pass |
| Tertiary on tile | `#84868A` | `#131518` | 5.02:1 | -36.8 | 4.5 | pass |
| Primary CTA label | `#0B0C0E` | `#E9EBEE` | 16.38:1 | 93.8 | 4.5 | pass |
| Focus ring | `#E9EBEE` | `#0B0C0E` | 16.38:1 | -94.5 | 3 | pass |
| Focus ring on tile | `#E9EBEE` | `#131518` | 15.31:1 | -93.9 | 3 | pass |
| Control boundary | `#67696C` | `#0B0C0E` | 3.55:1 | -24.0 | 3 | pass |
| Control boundary on tile | `#67696C` | `#131518` | 3.32:1 | -23.4 | 3 | pass |
| Lit vs unlit dot | `#E9EBEE` | `#292B2E` | 11.89:1 | -90.7 | 3 | pass |
| Error text | `#F66D67` | `#131518` | 6.36:1 | -46.7 | 4.5 | pass |
| Success text | `#7CCD8E` | `#131518` | 9.56:1 | -65.3 | 4.5 | pass |
| Warning text | `#EEC05B` | `#131518` | 10.74:1 | -71.6 | 4.5 | pass |
| Info text | `#7BB9E5` | `#131518` | 8.63:1 | -60.0 | 4.5 | pass |
| Tile hairline (decorative, exempt) | `#2E3033` | `#131518` | 1.38:1 | 0 | — | exempt |
| Dim dot (decorative, exempt) | `#4E5053` | `#0B0C0E` | 2.42:1 | -13.9 | — | exempt |
| Disabled (exempt) | `#535559` | `#0B0C0E` | 2.62:1 | -15.8 | — | exempt |

**Fixed during design:**

- Hairline borders were 1.3–1.5:1. They stay decorative (exempt), and a separate `borderStrong` (3.3–3.5:1) is now used on inputs and the toggle off-state.
- Light tertiary text was 4.35:1 and was darkened to L 0.52 so it passes 4.5:1. Tertiary text can now be used at any size.

## 5. Hierarchy rules

1. **Highest contrast (text on bg, ~16:1)** goes to one thing per screen: the primary CTA pill (filled `text`), the hero number (Doto), and lit dots. If everything is lit, nothing is.
2. **Secondary (~7:1)** is metadata and descriptions. **Tertiary (~5:1)** is mono labels, units and timestamps.
3. **Recedes:** tile hairlines, unlit dots (`dotOff`), the background dot field (50 % opacity), dim/ghost dots.
4. **Accent budget:** there is no hue accent. Per screen use at most one filled `text` surface (the CTA) and at most one glowing element (current plate or hero row). The monkey is the only color.
5. **State colors** (`stateSuccess/Warning/Info`, `danger`) appear only for real states, such as errors, the league zone or data, and never as decoration. Each must pair with an icon or word, never color alone.

## 6. Dark mode rules

- No pure black: base is `#0B0C0E` (L 0.155). No pure white: text is `#E9EBEE`.
- Elevation via lightness (surface1 → surface3), never shadow.
- State colors are lighter and less saturated in dark mode (L 0.70–0.83, C ≤ 0.17), so they glow without vibrating on near-black.
- Glow (blur behind lit dots) is used in dark mode only. In light mode active dots are solid `text`.

## 7. Data viz and state colors (color-blind safe)

There are separate sets for each theme so every color holds ≥ 3:1 against its background. Distinguishability is checked with the Machado 2009 CVD simulation, using the minimum pairwise distance in OKLab (≈ 0.02 is a just-noticeable difference).

### Light

| # | Name | HEX | OKLCH | vs bg |
|---|---|---|---|---|
| 1 | amber | `#CF6F19` | oklch(0.64 0.15 55) | 3.18:1 |
| 2 | sky | `#0C8BBB` | oklch(0.6 0.12 232) | 3.48:1 |
| 3 | green | `#177C52` | oklch(0.52 0.11 160) | 4.67:1 |
| 4 | lemon | `#5C5C01` | oklch(0.46 0.1 110) | 6.32:1 |
| 5 | cobalt | `#204CA4` | oklch(0.44 0.15 262) | 7.17:1 |
| 6 | vermilion | `#B71C0E` | oklch(0.5 0.19 30) | 5.93:1 |
| 7 | orchid | `#A24287` | oklch(0.53 0.15 340) | 5.15:1 |
| 8 | graphite | `#84868A` | oklch(0.62 0.006 255) | 3.28:1 |

Minimum pairwise ΔE_ok: none 0.108 (green/lemon), protan 0.062 (lemon/vermilion), deutan 0.055 (lemon/vermilion), tritan 0.083 (green/cobalt).

### Dark

| # | Name | HEX | OKLCH | vs bg |
|---|---|---|---|---|
| 1 | amber | `#F4A437` | oklch(0.78 0.15 70) | 9.52:1 |
| 2 | sky | `#64C4F0` | oklch(0.78 0.11 230) | 9.97:1 |
| 3 | green | `#44B782` | oklch(0.7 0.13 160) | 7.77:1 |
| 4 | lemon | `#EDE361` | oklch(0.9 0.15 105) | 14.69:1 |
| 5 | cobalt | `#5283E0` | oklch(0.62 0.15 262) | 5.29:1 |
| 6 | vermilion | `#EA6134` | oklch(0.66 0.18 38) | 5.83:1 |
| 7 | orchid | `#DA83BE` | oklch(0.72 0.13 340) | 7.43:1 |
| 8 | graphite | `#909296` | oklch(0.66 0.006 255) | 6.28:1 |

Minimum pairwise ΔE_ok: none 0.138 (green/graphite), protan 0.06 (orchid/graphite), deutan 0.059 (green/graphite), tritan 0.062 (amber/orchid).

Usage: plot in the order listed. Graphite is for "other / baseline". Beyond 8 series, add shape or dash patterns instead of more hues.

## 8. Code export

- App (React Native): `theme/palettes.ts`, keys listed in §3; new keys `borderStrong`, `focus`, `disabled`, `stateSuccess`, `stateWarning`, `stateInfo`.
- Web and marketing: `docs/design/color-system.css` holds CSS custom properties with a light default, `prefers-color-scheme` dark, and `[data-theme]` overrides.

