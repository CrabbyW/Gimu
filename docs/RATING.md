# Rating: elite fáze 3, opička 2.0, kolo 2 (kód 7bc1f5b, repo HEAD 69ee6db), 2026-10-07

**Skóre: 85/85, čeká na iPhone.** Zbylých 15 bodů za Zařízení přibude, až uživatel potvrdí iPhone checklist.

## Brány
| # | Brána | Stav |
|---|---|---|
| 1 | QA SCHVÁLENO pro HEAD | OK: QA kolo 2 schválilo 7bc1f5b. Commity 9f59f73 a 69ee6db mění jen README, LOG a QA. |
| 2 | tsc / jest / eslint / e2e | OK: tsc 0, eslint 0, jest 78 sad / 740 testů, e2e 117/117, e2e:perf 4/4. Kód se od běhu nezměnil. |
| 3 | LOG / QA / README | OK: LOG má boss Task 1, design, motion i qa. QA má kola 1 a 2. README popisuje opičku 2.0 (69ee6db). |
| 4 | iPhone checklist + nativní log | OK: checklist (5 bodů) je v QA kole 2. `$TEMP/expogo.log` se nezměnil, ERROR na ř. 225 je historický. |

## Kategorie
| Kategorie | Body | Pozn. |
|---|---|---|
| Funkčnost | 20/20 | e2e flows včetně `mascot-line` (w390, w320) prošly. QA kolo 2 nemá žádné ❌. |
| Vizuální kvalita | 20/20 | Žádné neschválené diffy. Bublina nepřekrývá text (hlídá e2e). Na w320 se nic neořezává. Podjíždění popisků pod hlavičku je závoj, který prošel i ve fázích 0–2. Kvůli konzistenci ho nepočítám jako kolizi. |
| Motion a haptika | 15/15 | `LineBubbleMotion` používá jen timing, má Reduce Motion variantu a nemá spring na klikatelném. Ťuknutí na opičku i rekord mají haptiku nebo takt přes `prideBeat`. Medián fps ≥ 55. |
| Zařízení | 0/15 | Čeká na potvrzení iPhone checklistu kola 2 (Expo Go fázi 3 zatím nespustilo). Vlastník: boss/uživatel. |
| Přístupnost | 10/10 | Opička má roli button, popisek a akci activate. Skrytý popisek je mimo čtečku. Test kontrastu je zelený. |
| Výkon | 10/10 | Žádné nové Skia plátno, perf rozpočet mapy prošel, animace jedou bez setState ve smyčce. |
| Architektura a kód | 10/10 | Logika je v `logic/mascotLines.ts`, takt v `celebration.ts`, tokeny v `theme/` a `lib/motion`. Žádné `any` ani TODO. Výjimky `exhaustive-deps` v LessonMap nejsou pravidlo workletu. |

## Co chybí do 100
- Potvrzení iPhone checklistu z QA kola 2 („ok“ nebo vyřešené screenshoty) a čistý nativní log z běhu fáze 3 v Expo Go.

## Doporučení (mimo skóre)
- Prolnout popisek uzlu při skrytí a návratu, teď mizí skokově (motion).
- Design by měl výslovně potvrdit, že popisky mají pod hlavičkou prosvítat. Rubrika by pak mohla závoj vyjmout z pravidla o kolizích.
