# Rating: UX pass U1+U2+U4 (kód 050a784, docs fddc091), 2026-10-09, kolo 2

**Skóre: 85/85, čeká na iPhone.** Kategorie Zařízení (15) se doplní, až uživatel potvrdí iPhone checklist.

## Brány (všechny splněné)
1. Verdikt QA SCHVÁLENO platí pro 050a784. Commity eff047f a fddc091 mění jen dokumentaci (README.md, docs/).
2. tsc, eslint a jest (96 sad, 847 testů) jsou zelené, spuštěno ratingem dnes. `npm run e2e` 169/169 spustil rating v kole 1 na stejném kódu.
3. docs/LOG.md má záznamy bosse, design-agenta, motion-agenta i qa-agenta. docs/QA.md má sekci kola i doplněk. README je aktuální.
4. iPhone checklist (5 bodů) je v QA reportu. `$TEMP/expogo.log` je zapsán 2026-10-09 19:05, tedy po 050a784, obsahuje iOS bundle aktuálního kódu a nemá žádný řádek `ERROR`.

## Kategorie
| Kategorie | Body | Poznámka |
|---|---|---|
| Funkčnost | 20/20 | e2e/flows projdou včetně lesson-rest a disclosure; spec v QA reportu je bez ❌ (jen ⚠️, o kterých rozhodl boss) |
| Vizuální kvalita | 20/20 | Vizuální regrese 4 šířky × dark/light bez neschválených diffů (nové baseline zapsané v LOG); geometrie textů na w320 bez kolizí, ověřeno i záměrným rozbitím |
| Motion a haptika | 15/15 | LessonStepEnter jen withTiming s Reduce Motion variantou, bez pružiny; haptika restTick/restEnd/feelSelect; e2e:perf 4/4 s mediánem ≥ 55 fps (běh QA na stejném kódu) |
| Zařízení | – (čeká) | Uživatel zatím checklist kola nepotvrdil |
| Přístupnost | 10/10 | Role a popisky: radio/radiogroup u FeelPickeru, timer u RestStep, popisky zamčených tabů; contrast test zelený; dotykové plochy: feelChoice 48 pt, DONE 64 pt; e2e large-text zelené |
| Výkon | 10/10 | perf: plátna ≤ 12, mapa do START ≤ 3000 ms; prstenec pauzy jede z intervalu 250 ms, ne setState ve smyčce animace |
| Architektura a kód | 10/10 | Data přes services/contracts, čisté funkce (disclosureOf, returnLineOf, restCue) testované, hodnoty z theme/ a lib/motion; žádné `any`; jediné TODO má fázi (`TODO(fáze 2)`); žádná výjimka z worklet pravidla |

Nesplněná kritéria: žádná. Chybí jen potvrzení iPhone checklistu od uživatele (patří boss: předat uživateli 5 bodů z docs/QA.md).

## Doporučení (mimo skóre)
- V `components/lesson/LessonStepEnter.tsx:18` je `eslint-disable-next-line react-hooks/exhaustive-deps` bez odůvodnění přímo za `--`. Komentář je o řádek výš. Rubrika to nepostihuje (není to worklet pravidlo), ale pro konzistenci by odůvodnění mělo být za `--`.
- QA by měla do reportu zapisovat čas posledního zápisu `expogo.log`.
