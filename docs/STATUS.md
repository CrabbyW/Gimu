# Stav práce: fáze 1

Aktualizováno: 2026-10-02. Větev `faze1/core-loop`.

- **Plán A:** `docs/superpowers/plans/2026-09-29-opice-faze1-core-loop.md`
- **Plán B:** `docs/superpowers/plans/2026-09-30-opice-faze1-planB.md`
- **Spec:** `docs/superpowers/specs/2026-09-29-opice-faze1-design.md`

## Ověření fáze 0 (2026-10-02)

`npm test` 337/337, `typecheck` a `lint` čisté.

| Task | Stav | Důkaz |
|---|---|---|
| 1–10 | hotovo | základ, logika, onboarding |
| 11 mapa | hotovo | NodePopover: `onClose`, `onAccessibilityEscape`, tlačítko Zavřít s labelem; `Plate` volí barvu čísla přes `inkOn` (test v `theme/__tests__/contrast.test.ts`); popover clampovaný k okraji (`EDGE`) |
| 12 lekce | hotovo | `app/lesson/[id].tsx`, `HoldTimer`, `lessonFlow` |
| 13 oslava | hotovo | `LessonCompleteScene`, návrat `dismissTo('/(tabs)', { unlocked })` |
| 14 ověření A | hotovo | krok 2 rating 100/100 (`d4a6dbc`) |
| 15–18 maskot 2–3, kosmetika | hotovo | krok 3 rating 100/100 (`c5d7a57`) |
| 19–21 schéma v2, liga | hotovo | `609ea36` |
| 22–23 logika sezóny | hotovo | `6661f7d` |

## Zbývá (plán B)

1. **Task 24** — služba sezóny, tab Sezóna (teď kostra), nastavení cíle.
2. **Task 25** — recap sezóny a převzetí odměny.
3. **Task 26** — stage-up a napojení na oslavu.
4. **Task 27** — `logic/progress` + tab Progres (teď kostra).
5. **Task 28** — `logic/cosmetics`, Šatník, Profil (teď kostra); `MockCosmeticsService` je `notImplemented`.
6. **Task 29** — notifikace a Nastavení; `LocalNotificationService` je `notImplemented`.
7. **Task 31** — Dev menu (podle zadání jde jako první z plánu B).
8. **Task 33** — README a závěrečné ověření.

## Demo plán (2026-10-02)

Fáze 1 design A+B (Kurogane + střídmá Instrument vrstva) → 2 průchod + plán B → 3 motion → 4 QA → 5 launch video (`video/`, Remotion). Limit 3 kola na fázi, cíl rating ≥ 95.

## Spuštění

```
npm install
npx expo start      # Expo Go
npm test
npm run typecheck
npm run lint
```
