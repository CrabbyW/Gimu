# Elite fáze 3 — opička 2.0 Implementation Plan

**Spec:** `docs/superpowers/specs/2026-10-07-elite-faze3-opicka-design.md`

## Global Constraints
- Logika jen v `logic/`, texty v `data/copy.ts`, hodnoty pohybu v `lib/motion.ts`, tokeny z `theme/`.
- Repliky ≤ 32 znaků, žádná výčitka.

## Review Focus
- Rychlé ťukání: max 1 bublina, žádné blikání.
- Přechod půlnoci / hranice hodin.
- Retry lekce nesmí znovu hlásit rekord jinak než originál (idempotence).
- Bublina u horního okraje mapy na w320 nesmí přetéct (kolize = ❌).
- Průvodce má přednost.

### Task 1 (boss): logika + copy + testy
`logic/mascotLines.ts` + test, `copy.mascotLines`, `copy.celebration.record`, `streakRecord` v `applyLessonCompletion` + test, hook `hooks/useMascotLine.ts`.

### Task 2 (design-agent): `components/mascot/LineBubble.tsx` (mono, Nothing Dot) na mapě nad opičkou, řádek rekordu v oslavě; test komponenty.

### Task 3 (motion-agent): vstup/odchod bubliny, 2.4 s, reakce `proud` při rekordu, e2e flow `e2e/flows/mascot-line.spec.ts`.

### Task 4: QA, rating.
