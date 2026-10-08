# Elite fáze 5 — vstupní test a bezpečnost Implementation Plan

**Spec:** `docs/superpowers/specs/2026-10-08-elite-faze5-vstupni-test-design.md`

## Global Constraints
- Logika jen v `logic/fitnessTest.ts`, data přes `services.user.saveFitnessTest`, texty `copy.fitness`, tokeny z `theme/`, pohyb z `lib/motion.ts`.
- Kolize/ořez na jakékoli šířce = ❌. PAR-Q nikdy neblokuje.

## Review Focus
- Nesmyslné vstupy (0, 999, prázdné pole) — očištění, žádný pád.
- Stávající uživatel bez testu má přesně stejné dávky jako dřív.
- Stopky plank: odchod z obrazovky / zamčení telefonu nesmí rozbít čas.
- Opakovaný test přepíše starý a projeví se od další lekce.
- VoiceOver: otázky ano/ne, stopky, přepínač kolen.

### Task 1 (boss): logika, typy, service, copy, rešerše + testy — hotovo.
### Task 2 (design-agent): obrazovka `app/fitness-test.tsx` (kroky: připravenost → kliky → plank se stopkami → výsledek), vstup z `/setup` a z Nastavení, disclaimer, caution poznámka v lekci; testy komponent; e2e flow.
### Task 3 (motion-agent): přechody kroků, stopky (DotRing), haptika přes feedback.
### Task 4: QA, rating, HANDOFF.
