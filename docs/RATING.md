# Rating: elite fáze 1 (vlajková linka), rozsah f471f91..HEAD (d8b8ac0)

**Skóre: 65/85 (Zařízení čeká na iPhone). NEPOUŠTÍ DÁL, výjimka platí jen při 85/85.**

## Brány (všechny splněny)
1. QA kolo 2 SCHVÁLENO pro cce1093. Po verdiktu je jen commit d8b8ac0 (README, docs/LOG.md, docs/QA.md, docs/SPEC.md), tedy jen dokumentace.
2. tsc 0 chyb, jest 71/71 sad (703 testů), eslint čistý, e2e 107/107, e2e:perf 4/4.
3. LOG obsahuje záznamy boss, design, qa (a motion z dřívějších tasků). QA.md má sekci kola 2. README je aktualizovaný v d8b8ac0.
4. iPhone checklist je v QA reportu (sekce kola 2). `$TEMP/expogo.log` za ř. 225 nemá žádný řádek s ERROR.

## Kategorie
| Kategorie | Body | Stav |
|---|---|---|
| Funkčnost | 20/20 | e2e flows projdou, QA bez ❌ |
| Vizuální kvalita | 0/20 | nesplněno, viz níže |
| Motion a haptika | 15/15 | perf mapa i oslava mají medián ≥ 55 fps, springy jen na neklikatelných prvcích (maskot, kotouč, kruh narození), RM varianty jsou v kódu |
| Zařízení | –/15 | čeká na potvrzení iPhone checklistu uživatelem |
| Přístupnost | 10/10 | contrast test zelený, role a popisky jsou v pořádku |
| Výkon | 10/10 | canvas ≤ 12, čas do [START LESSON] ≤ 3 s |
| Architektura a kód | 10/10 | TODO mají odkaz na fázi, žádné `any`, worklet pravidlo bez výjimek |

## Nesplněná kritéria
### Vizuální kvalita: „jasná hierarchie, jeden subjekt na obrazovku“ (snímek `e2e/__screenshots__/w320-{dark,light}/first-run-map.png`, baseline z cce1093)
- Za levým okrajem bubliny průvodce prosvítá useknutý popisek „SE…“ (SECTION 01 řady mapy). Je to kolize textů. Vlastník: **design**.
- Řádek „+20 XP“ se dotýká horní hrany [START LESSON] a mezi metadaty uzlu a CTA není žádný vzduch. Vlastník: **design**.
- Tečková šipka bubliny vede přes hlavu opičky, takže se subjekt (opička nebo kotouč) a ukazatel překrývají. Vlastník: **design** (pozici šipky dělá design, případný pohyb motion).
- Tyto vady QA označilo ⚠️ jako „kosmetické“. Baseline je tedy schválená, ale kritérium hierarchie na w320 to nesplňuje.

## Další poznámky (do skóre se nepočítají)
- ⚠️ copy výdrže „Hold the timer or tap Done“ zmiňuje neexistující Done (`data/copy.ts`). Vlastník: design. Do Funkčnosti se nezapočítává, protože QA ji nevede jako ❌.
- `lastRect` letu kotouče přežije zavřenou lekci. Vlastník: motion.
- Doporučení k rubrice: přidat do vizuální kategorie explicitní kritérium „žádné kolize nebo ořezy textu na w320“, aby nešlo o výklad. Dále: `eslint-disable react-hooks/exhaustive-deps` bez odůvodnění v `components/map/LessonMap.tsx` (161, 214, 224, 251, 529) a `components/map/PlateNode.tsx` (158, 219). Rubrika řeší jen worklet pravidlo, proto to do skóre nepočítám.
