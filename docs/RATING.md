# Rating — krok „intro animace“ (OPICE)

Kód: HEAD 7063fb3 (QA SCHVÁLENO). Následný commit 379b77a mění jen docs/QA.md, docs/LOG.md a README.md.
Datum: 2026-10-08, rating-agent.

## Skóre: 85/85, čeká na iPhone
Body: 85 ze 100. Kategorie Zařízení (15) se doplní, až uživatel potvrdí iPhone checklist.

## Brány
| Brána | Stav | Ověření |
|---|---|---|
| 1. QA SCHVÁLENO pro HEAD | ano | konec docs/QA.md, verdikt pro 7063fb3. `git diff 7063fb3 HEAD` mění jen docs a README |
| 2. tsc / jest / eslint / e2e | ano | spustil jsem je sám na HEAD: tsc 0 chyb, eslint 0, jest 88 sad / 799 testů, e2e 164/164 |
| 3. LOG, QA, README | ano | LOG obsahuje záznamy boss (Task 1), design-agent, motion-agent a qa-agent. QA má sekci kola. README ř. 55 popisuje intro |
| 4. iPhone checklist + nativní log | ano | checklist (5 bodů) je v QA reportu. `$TEMP/expogo.log` (13:19, z tohoto kola) neobsahuje žádný `ERROR` |

## Kategorie
| Kategorie | Body | Poznámka |
|---|---|---|
| 1. Funkčnost | 20/20 | e2e flows včetně `e2e/flows/intro.spec.ts` prošly, QA report je bez ❌ |
| 2. Vizuální kvalita | 20/20 | vizuální regrese 4 šířky × dark/light zelená (intro je v baseline vypnuté, beze změny). QA snímky w320/w430 ve dark i light ukazují nápis bez ořezu a kolizí. e2e geometrie na w320 (77 teček, ≤ 80 % šířky, bez překryvu). Obrazovka má jeden subjekt |
| 3. Motion a haptika | 15/15 | jeden orchestrovaný nástup (sken 640, pulz 2×130, prolnutí 300 ms). Varianta pro Reduce Motion existuje. Pulz je withTiming, ne spring. Haptika `introPulse` v klíčovém momentu. e2e:perf 5/5, fps ≥ 55 |
| 4. Zařízení | čeká (0/15) | uživatel zatím iPhone checklist kola nepotvrdil |
| 5. Přístupnost | 10/10 | jeden prvek `button` s popiskem „Opice“ a nápovědou, nápis je skrytý pro čtečku. Dotyková plocha je celá obrazovka. Bez textu, takže fontScale nehraje roli. Test kontrastu je zelený (jest) |
| 6. Výkon | 10/10 | RN View, 0 Skia pláten. TTI mapy s intrem 2.2 s (≤ 3 s, měřila QA). Animace běží na UI vlákně, setState je jen jednorázově (started, played), ne ve smyčce |
| 7. Architektura a kód | 10/10 | písmo v `logic/dotGlyphs.ts`, hodnoty z `theme` (`dots.intro`, `c.*`) a `lib/motion` (`dotIntro`). Žádné `any`, TODO ani eslint-disable. Worklety zachytávají jen sdílené hodnoty a čísla |

Nesplněná kritéria: jen kategorie 4. Chybí potvrzení iPhone checklistu (body 1–5 v docs/QA.md, sekce intro), patří uživateli. Výzvu předá **boss**.

## Otevřené body QA
- **Tmavý splash (`#0B0C0E`, app.json) ve světlém motivu.** Jde o záblesk z tmavé do světlé při studeném startu. Projeví se jen nativně, na webu ho ověřit nejde, takže patří do kategorie Zařízení (iPhone checklist bod 1), ne do Vizuální kvality. Pokud ho uživatel u bodu 1 označí za rušivý, kategorie Zařízení zůstane na 0, dokud se nevyřeší. Navrhované řešení je light `backgroundColor` + `dark.backgroundColor` v konfiguraci `expo-splash-screen`, vyžaduje nativní build. Patří **design** (barvy) a **boss** (konfigurace, build).
- **Přepnutí barvy podkladu uprostřed intra** u uživatele s ručně zvoleným motivem opačným k systému. `useTheme()` se čte před hydratací nastavení. Na webu to ověřit nejde, patří do checklistu. Doporučuji doplnit to do bodu 1 jako explicitní kontrolu. Při potvrzení vady: **motion/design** (např. podklad do hydratace nastavení držet podle systémového motivu a změnu prolnout), rozhoduje **boss**.

## Doporučení mimo rubriku (nezapočítáno)
- Rubrika nemá kritérium pro konzistenci nativního splashe s motivem. Stojí za doplnění do kategorie Zařízení nebo Vizuální kvalita.
