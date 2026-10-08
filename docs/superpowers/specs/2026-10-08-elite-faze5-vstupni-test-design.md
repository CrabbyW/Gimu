# Elite fáze 5 — vstupní test a bezpečnost (design spec)

Datum: 2026-10-08. Zadání uživatele: „2, 4 + výzkum na netu“ (vstupní test úrovně + bezpečnostní texty). Rešerše: `docs/research/2026-10-08-vstupni-test.md`. Otevřené volby rozhodl boss **[předpoklad]**.

## 1. Cíl
Dávky cviků odpovídají úrovni uživatele místo jednoho čísla pro všechny, a appka jasně říká, kde jsou její meze.

## 2. Vstupní test
- Dva testy: max kliků v kuse (přepínač „na kolenou“) a nejdelší forearm plank (stopky v appce i ruční zadání).
- Logika `logic/fitnessTest.ts`: dávka = 50 % maxima vůči referenci, násobek 0.5–1.5× zvlášť pro opakování a výdrže; výdrže po 5 s; spodní meze 3 opakování / 5 s. Bez testu = výchozí dávky (beze změny pro stávající uživatele).
- Kde: [předpoklad] volitelný krok po onboardingu v rámci „Finish setup“ (`/setup`) a „Retake level test“ v Nastavení. Přeskočit = výchozí dávky.
- Škálování platí v lekci, v minutách na mapě/oslavě i v připomínce; dluh z přeskočení se počítá ze škálované dávky.
- Výsledek ukáže „Lessons scaled: reps ×N, holds ×N“.

## 3. Bezpečnost
- Kontrola připravenosti: 7 otázek podle PAR-Q+ 2024 před testem. Jakékoli „ano“ = upozornění „poraďte se s lékařem“, neblokuje. Uloží se `readiness`.
- Disclaimer (není lékařská rada, přestaň při bolesti/závrati/tlaku na hrudi) v testu a v Nastavení.
- Náročné cviky (`caution: true`: handstand u zdi, pike, vrána, tuck L-sit) mají v lekci krátkou poznámku.

## 4. Testy
- jest: `logic/__tests__/fitnessTest.test.ts` (meze, monotonie, kolena, zaokrouhlení, neutrální = beze změny, PAR-Q), service testy (škálování lekce, uložení, dluh).
- jest/komponenta: obrazovka testu (krokování, přeskočení, uložení), poznámka u caution cviku.
- e2e flow `e2e/flows/fitness-test.spec.ts`: setup → připravenost → kliky → plank → výsledek → lekce má škálované dávky; přeskočení = výchozí.
- Vizuální/kolize na w320–w430, dark/light.
