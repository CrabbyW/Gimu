# Rating: elite fáze 5, vstupní test a bezpečnost

Kód HEAD 91df126 (repo HEAD 7feabed, od 91df126 se měnily jen README, docs/LOG.md a docs/QA.md). Hodnoceno 2026-10-08.

**Skóre: 85/85, čeká na iPhone** (bez kategorie Zařízení, ta se doplní po potvrzení)

## Brány
| Brána | Stav |
|---|---|
| 1. QA SCHVÁLENO pro aktuální kód | ✅ QA kolo 2 pro 91df126, potom jen dokumentace |
| 2. tsc / jest / eslint / e2e | ✅ ověřil rating: tsc OK, eslint 0, jest 86/86 sad a 784/784 testů, `npm run e2e` 162/162 |
| 3. LOG / QA / README | ✅ LOG má design, motion a qa (boss je ve Fázi 2 plánu a commitech), QA má sekce kola 1 a 2, README (ř. 54) popisuje fázi 5 |
| 4. iPhone checklist + nativní log | ✅ checklist je v QA kola 2, `$TEMP/expogo.log` (09:18) má 0x `ERROR` |

## Kategorie
| Kategorie | Body | Poznámka |
|---|---|---|
| Funkčnost | 20/20 | flows (vč. `flows/fitness-test`) zelené, nálezy z QA kola 1 vyřešené, v reportu není žádné ❌ |
| Vizuální kvalita | 20/20 | vizuální sada 4 šířky x dark/light beze změn (nová baseline jen settings, schválená v kole 1), na w320 nejsou kolize ani ořezy (textCollisions = [] a CAUTION štítek je nad ohybem) |
| Motion a haptika | 15/15 | StepEnter (timing, bez pružiny, Reduce Motion = calmFade), count-up, haptika stopek, stepperu i uložení. e2e:perf mapa i oslava ≥ 55 fps (spustil rating, 4/4) |
| Zařízení | – (čeká) | uživatel zatím nepotvrdil iPhone checklist z QA kola 2 |
| Přístupnost | 10/10 | role a popisky stepperu podle kroku, contrast test je zelený, alert consult běží přes liveRegion |
| Výkon | 10/10 | canvas ≤ 12 a čas do START ≤ 3000 ms (e2e:perf), stopky překreslují přes interval, ne smyčkou animace |
| Architektura a kód | 10/10 | logika je v `logic/fitnessTest.ts`, hodnoty z `lib/motion`/theme, chybí `any` i TODO. Jediný `eslint-disable` (`app/fitness-test.tsx:221`, react-hooks) je odůvodněný komentářem a není to výjimka z worklet pravidla |

## Nesplněno
- Zařízení (15): je potřeba potvrzení iPhone checklistu od uživatele (patří **boss**, ten ho má vyžádat).

## Doporučení (do skóre se nepočítají)
- Řádek v Nastavení a Setupu ukazuje po nulovém testu „0 push-ups · 0 s plank“, kdežto výsledek ukazuje „Not entered · default“. Je to nekonzistentní copy (boss/design).
- Obrazovka testu zatím nemá vlastní vizuální baseline. Kolize hlídá jen flow (design).
