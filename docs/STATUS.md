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

## Demo (2026-10-02): hotovo

- **Hotové fáze:**
  - fáze 0: ověření stavu,
  - fáze 1: design A+B (R42),
  - fáze 2: celý průchod a plán B (Tasky 24–29, 31, 33, viz README Demo),
  - fáze 3: motion (oslava, stage-up, recap),
  - brag orchestrace všech obrazovek,
  - fáze 4: QA.
- **QA:** kolo 3 SCHVÁLENO (`docs/QA.md`).
- **Rating:** kolo 2 BOSS 100 / DESIGN 100 (`docs/RATING.md`).
- **Mock data** jsou v jednom souboru `services/mock/demoData.ts` (dev menu, „Načíst demo profil“).
- **Neudělané:** `MapBackground` a `LessonEffect` (spotřebitelé slotů kosmetiky z Tasku 28).
- **Launch video** uživatel nechce. V `video/` zůstává jen kostra a storyboard.

**K ruční kontrole (fyzické zařízení):**
- dvojtap na CTA oslavy a stage-upu,
- haptika a zvuk při dopadu kotouče,
- VoiceOver a TalkBack (recap, stage-up, Šatník, řádek ligy),
- systémové reduce motion,
- plynulost intro sekvencí na slabším Androidu,
- notifikace v Expo Go.

## Spuštění

```
npm install
npx expo start      # Expo Go
npm test
npm run typecheck
npm run lint
```
