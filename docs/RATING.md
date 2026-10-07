# Rating: elite fáze 4 (audit a řemeslo)

Kód: HEAD 06102e1 (QA kolo 2 SCHVÁLENO). Dokumentace: HEAD f8c653f (po verdiktu jen docs: QA.md, LOG.md, README.md).

**Skóre: 85/85, čeká na iPhone.** Kategorie Zařízení (15) se doplní, až uživatel potvrdí checklist.

## Brány
| Brána | Stav | Ověření |
|---|---|---|
| 1. QA SCHVÁLENO pro HEAD | ✅ | QA kolo 2 schválilo 06102e1. `git diff 06102e1 HEAD` mění jen docs/QA.md, docs/LOG.md a README.md |
| 2. tsc, jest, eslint, e2e | ✅ | Spustil jsem: tsc 0 chyb, eslint 0, jest 82 sad / 756 testů, `npm run e2e` 159/159 bez diffů |
| 3. LOG, QA, README | ✅ | LOG obsahuje design-agent, motion-agent, qa-agent (kola 1 a 2) a boss (oprava db). QA.md má sekce kola 1 a 2. README ř. 53: StateView, DecorCanvas, typeMaxScale, Doto ≥ 28, Reduce Motion `calmFade`, ochrana dat v `store/db.ts`, `e2e/a11y/` (popisky, velké písmo 1.4×) |
| 4. iPhone checklist + nativní log | ✅ | Checklist je v QA kole 1 (5 bodů) i v kole 2 (4 body). `$TEMP/expogo.log`: 283 řádků, poslední ERROR je na ř. 225 a je historický (SyntaxError v index.tsx z dřívějška). Od kola žádný nový |

## Kategorie
| Kategorie | Body | Poznámka |
|---|---|---|
| Funkčnost | 20/20 | e2e/flows prošly. Spec kroku je v QA bez ❌ (jen ⚠️) |
| Vizuální kvalita | 20/20 | Vizuální regrese 4 šířky × dark/light bez diffů. Prázdné a chybové stavy jsou navržené. Na w320 nejsou kolize (`textCollisions` = []), velké písmo 1.4× prošlo na w320/w390 |
| Motion a haptika | 15/15 | `calmFade` s Reduce Motion, skeleton se při omezeném pohybu nehýbe. Medián fps ≥ 55 podle `e2e:perf` 4/4 z QA kola 1 (3ced780). Sám jsem `e2e:perf` spustit nemohl, protože příkaz zablokoval klasifikátor oprávnění. Commit 06102e1 mění jen store/db a nic na animacích |
| Zařízení | čeká | Uživatel zatím nepotvrdil checklist kola |
| Přístupnost | 10/10 | e2e a11y labels jsou zelené, contrast test je zelený (součást jest), fontScale 1.4 bez přetečení |
| Výkon | 10/10 | Podle e2e:perf: počet pláten ≤ 12, [START LESSON] do 3 s. V kódu fáze jsem nenašel setState ve smyčce animací |
| Architektura a kód | 10/10 | Žádné `any`, žádné TODO bez fáze. Výjimky `eslint-disable` se týkají jen react-hooks/exhaustive-deps, nikde se nevypíná worklet pravidlo |

## Chyby
Žádná nesplněná kritéria.

## Doporučení (do skóre se nepočítají)
- Chybový stav úložiště nemá e2e regresní test. Kryje ho jen jest. Patří: boss/qa.
- `store/settings.ts` nemá ochranu proti přepsání nastavení, když selže čtení. Patří: boss.
- Test velkého písma škáluje jen 1.4×, takže zvýšení stropu `typeMaxScale` neodhalí. Doporučuju druhý běh s 2×. Patří: qa/design.
- Popisek uzlu „BOSS“ na w320-dark vykukuje 2 px nad plovoucím CTA (scrollovaný obsah pod překryvem). Patří: design.
- Rubrika by mohla vyžadovat, aby rating sám spustil `e2e:perf` (teď se opírá o QA běh).
