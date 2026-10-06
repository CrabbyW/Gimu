# Rating — elite fáze 0 (workflow) + scrollIntent, rozsah dccba78..HEAD (ecd937c)

**Skóre: 85/85 — čeká na iPhone** (výjimka rubriky; kategorie Zařízení se doplní po potvrzení checklistu uživatelem)

## Brány
| Brána | Stav | Důkaz |
|---|---|---|
| 1. QA SCHVÁLENO pro HEAD | ano | QA kolo 2: SCHVÁLENO pro a90b51b; a90b51b..HEAD mění jen docs/LOG.md a docs/QA.md |
| 2. tsc / jest / eslint / e2e | ano | tsc 0, jest 68 sad / 682 testů, eslint 0, `npm run e2e` 80/80 (2.9 min), `e2e:perf` 4/4 |
| 3. LOG / QA / README | ano | LOG: boss (837, 850, 864), motion-agent (856), qa-agent; QA má sekci kola 2; README +Testy |
| 4. iPhone checklist + nativní log | ano | Checklist 5 bodů v QA kole 2; `$TEMP/expogo.log` 0 řádků ERROR |

## Kategorie
| Kategorie | Body | Poznámka |
|---|---|---|
| 1. Funkčnost | 20/20 | e2e/flows prošly, v QA reportu kola 2 žádné ❌ |
| 2. Vizuální kvalita | 20/20 | vizuální regrese 9 obrazovek × 4 šířky × dark/light bez diffů; UI diff jen testID a rozbalené hodnoty v Dot* |
| 3. Motion a haptika | 15/15 | fps mapa/oslava ≥ 55; scrollIntent nemění nástupy ani haptiku, RM vlnu vypíná useDotTouch |
| 4. Zařízení | čeká | uživatel zatím nepotvrdil iPhone checklist kola (QA.md, sekce kola 2) — vlastník: boss (doručit a sbírat potvrzení) |
| 5. Přístupnost | 10/10 | contrast test v jest zelený; role/popisky a touch plochy beze změny |
| 6. Výkon | 10/10 | plátna ≤ 12 na každé obrazovce, TTI 1.7 s, gesto v workletech bez setState |
| 7. Architektura a kód | 10/10 | konstanty z lib/motion (scrollIntent.slop/verticalRatio); žádné `any`/TODO v diffu; žádný disable pravidla local/no-worklet-object-capture |

## Otevřené (ne do skóre)
- Riziko pro Zařízení: app/wardrobe.tsx:164 vnořený vodorovný ScrollView uvnitř IntentScrollView (checklist bod 3). Selže-li: motion-agent.
- Doporučení k rubrice: hook mezera `npx kill-port 8082` / `kill $(lsof -ti:8082)` (boss) — mimo rubriku.
