# Rating: elite fáze 1 (vlajková linka), kolo 2. HEAD 61710d4 (kód 2c8dfb8)

**Skóre: 85/85, čeká na iPhone.** Krok smí pokračovat. Kategorie Zařízení (15) se doplní, až uživatel potvrdí checklist.

## Brány (všechny splněny)
1. QA kolo 5 dalo SCHVÁLENO pro 2c8dfb8. Po verdiktu je jen commit 61710d4 (docs/LOG.md, docs/QA.md).
2. tsc 0 chyb, jest 71/71 sad (703 testů), eslint čistý, e2e 115/115, e2e:perf 4/4.
3. LOG obsahuje záznamy agentů. QA.md má sekci kola 5. README je aktuální (d8b8ac0).
4. iPhone checklist je v QA kola 5. `$TEMP/expogo.log` za ř. 225 nemá žádný ERROR.

## Kategorie
| Kategorie | Body | Poznámka |
|---|---|---|
| Funkčnost | 20/20 | flows projdou, QA bez ❌ |
| Vizuální kvalita | 20/20 | w320 first-run mapa, lekce a oslava bez kolizí a ořezů textu; vizuální regrese bez neschválených diffů |
| Motion a haptika | 15/15 | medián fps mapa i oslava ≥ 55 |
| Zařízení | –/15 | čeká na potvrzení iPhone checklistu |
| Přístupnost | 10/10 | contrast test zelený |
| Výkon | 10/10 | canvas ≤ 12, čas do [START LESSON] ≤ 3 s |
| Architektura a kód | 10/10 | beze změny proti kolu 1 |

## Nálezy mimo skóre
- first-run-lesson w320: z tečkové šipky bubliny je nad lištou vidět jen jedna tečka. Je to dekorace, ne text, takže to kritérium kolizí textu neporušuje. Vlastník: design (na kompaktu šipku vypustit).
- `lastRect` letu kotouče přežije zavřenou lekci. Vlastník: motion, nízká priorita.
- Doporučení: `eslint-disable react-hooks/exhaustive-deps` bez odůvodnění v `components/map/LessonMap.tsx` a `components/map/PlateNode.tsx`. Rubrika to nepokrývá.
