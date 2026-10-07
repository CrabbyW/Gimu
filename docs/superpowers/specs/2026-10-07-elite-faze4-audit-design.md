# Elite fáze 4 — audit a řemeslo (design spec)

Datum: 2026-10-07. Zdroj: prompt `docs/prompts/2026-10-06-elite-ui-workflow.md` A6–A9. Cíl uživatele „udělej to vše s testy“, otevřené volby rozhodl boss **[předpoklad]**.

## 1. Cíl
Projít celou appku jako Apple design review a opravit, co nedrží úroveň: rytmus, velké písmo, VoiceOver, stavy, výkon. Každá oprava má test, který ji drží.

## 2. Rozsah
1. **Rytmus a typografie:** svislé mezery jen z `theme` spacing škály (8pt rytmus). Tabulární číslice u všech čísel (XP, série, čas, liga). Dlouhé titulky v Doto: zkrátit obsah, ne zmenšit pod 28 pt.
2. **Velké písmo [předpoklad: web e2e simuluje 1.4× přes root font-size / `fontScale`]:** všechny hlavní obrazovky při 1.4× bez ořezu a kolize na w320 a w390. Doto titulky mají `maxFontSizeMultiplier` (zůstanou ≥ 28 pt, nepřetečou).
3. **VoiceOver:** každý ovládací prvek má roli a popisek, pořadí čtení odpovídá vizuálnímu, dekorace (tečky, kotouče na pozadí) jsou skryté. Mapa: uzel ohlásí název, stav a minuty.
4. **Stavy:** načítání = tečkový skeleton (ne spinner), chyba = opička + věta „co se pokazilo a co udělat“ + Retry, prázdné stavy (liga bez soupeřů, progres bez historie) jako pozvánka. Jedna sdílená komponenta `StateView`.
5. **Výkon:** rozpočet zachovat (≤ 12 pláten, mapa interaktivní ≤ 3 s, ≥ 55 fps). Nic nezhoršit.
6. **Drobnosti z fáze 3:** popisek uzlu pod replikou se prolne (ne skok); závoj pod hlavičkou: design potvrdí záměr nebo upraví.

## 3. Testy
- e2e `e2e/a11y/labels.spec.ts`: na každé hlavní obrazovce nemá žádný `button`/`link`/`switch` prázdný popisek; dekorativní plátna mají `aria-hidden`.
- e2e `e2e/a11y/large-text.spec.ts`: 1.4× text na w320 a w390, žádný viditelný text se nepřekrývá s jiným a nepřetéká viewport (sdílený helper z `mascot-line.spec.ts`).
- jest `StateView` (loading/error/empty, Retry zavolá handler, a11y).
- jest/grep test: čísla v definovaných komponentách používají `tabular-nums` styl z theme.
- Stávající e2e, perf a vizuální regrese zelené (nové baseline jen zdůvodněné v LOG).
