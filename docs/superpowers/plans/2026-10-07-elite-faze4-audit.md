# Elite fáze 4 — audit a řemeslo Implementation Plan

**Spec:** `docs/superpowers/specs/2026-10-07-elite-faze4-audit-design.md`

## Global Constraints
- Tokeny jen z `theme/`, pohyb z `lib/motion.ts`, texty v `data/copy.ts`, logika v `logic/`.
- Kolize nebo ořez textu na jakékoli šířce (i 320 pt) a při 1.4× = ❌.
- Výkonový rozpočet se nesmí zhoršit (`npm run e2e:perf`).

## Review Focus
- Velké písmo na w320: Doto titulky, tab bar, CTA, karty ligy.
- VoiceOver pořadí na mapě (hlavička → uzly shora dolů → CTA → tab bar).
- Chybový stav při selhání služby (AsyncStorage throw) nesmí zobrazit prázdnou obrazovku.
- Skeleton nesmí blikat při rychlém načtení (min. zpoždění před zobrazením).
- Žádná regrese dokončení lekce.

### Task 1 (design-agent): audit + opravy
Audit všech obrazovek (rytmus, tabulární číslice, Doto, velké písmo, VoiceOver popisky a pořadí, dekorace skryté), `components/ui/StateView.tsx` (loading skeleton z teček, error s opičkou + Retry, empty) napojený tam, kde dnes chybí, závoj hlavičky. e2e `e2e/a11y/*.spec.ts`, jest pro StateView. Seznam nálezů a oprav do LOG.

### Task 2 (motion-agent): prolnutí popisků pod replikou, skeleton pulz (Reduce Motion = statický), vstup StateView, kontrola, že Reduce Motion alternativy jsou hezké na všech obrazovkách.

### Task 3: QA (max 3 kola), rating, HANDOFF.
