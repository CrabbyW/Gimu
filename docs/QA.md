# QA — krok 3 (maskot dokončit + DotLoader)

Datum: 2026-09-30 · qa-agent · větev `faze1/core-loop` · rozsah spec §12 krok 3 (commity `e2b82c0..dce977a`), regresní smoke kroků 1–2.

**Verdikt: SCHVÁLENO**

## Build a testy
- `npm test`: 30 suites, 237/237 ✅ (po doplnění případu −10 XP)
- `npm run typecheck` ✅ · `npm run lint` ✅ · `npx expo-doctor` 21/21 ✅

## Spec §12 krok 3, bod po bodu
| Bod | Stav | Důkaz |
|---|---|---|
| Stage 2 a 3 (`SvgMascot` z `STAGE_GEOMETRY`) | ✅ | snímky `r-none`: 3 čitelné siluety, hlava se zmenšuje, ramena rostou |
| Stage podle prahů 500 / 2000 | ✅ | `logic/__tests__/mascot.test.ts`: 499/500/1999/2000/99999 a nově −10 → 1 (poškozená data) |
| Nálada celebrate | ✅ | paže nahoru (120/140/160° podle stage, ruling R32), opakované poskoky, reduce motion = statická póza |
| Nálada sad | ✅ | uši dolů, pohled dolů, smutná pusa, bez pružiny. ⚠️ Zatím ji v appce nikdo nepředává (plán B: streak/liga v kroku 4) |
| Kotvy stage 1–3 | ✅ | `anchors.test.ts` prochází pro 1–3 (viewBox, ruka na konci paže, hlava = střed) |
| Kosmetika na kotvách | ✅ | tílko, mikina, šála (outfit i sezónní), čelenka, potítka, opasek ve všech stage. Šála v stage 3 nesedí v obličeji, potítka jdou s pažemi v celebrate (`m-wrist-*`) |
| Rive stub | ✅ | `RiveMascot.tsx` kompiluje, import zakomentovaný, `riveInputs.test.ts` zelený, Expo Go beze změny |
| DotLoader (požadavek uživatele) | ✅ | light a dark animuje (vlna a záře), reduce motion = statický gradient od středu; použit v `_layout`, `index`, `(tabs)/index`, `lesson/[id]`; `size.loader`/`size.loaderDot` z theme |
| Šatník UI, liga, sezóna, progres, notifikace, dev menu | ⚠️ plán B | kroky 4–5, mimo rozsah |

## Regresní smoke kroků 1–2 (flow `qa-step2.mjs`, light + dark)
✅ Onboarding validace (prázdné vstupy, nesmyslná váha) → zrození → mapa → lekce → oslava → odemčení další lekce → XP v top baru → persist po reloadu. Zamčená lekce přes URL se nedá dokončit, neznámá lekce ukáže chybu + „Zkusit znovu“, ukončení lekce dialogem neuloží aktivitu, boss dokončen.

## Architektura
✅ Žádné inline hex barvy v `components/`, `app/`, `lib/` (šála bere Winter Arc neutrály ze `SEASON_OVERRIDES`, tedy z theme). ✅ Spacing a radius jen ze škály §6.6, žádné numerické padding/margin/gap/borderRadius literály. ✅ Rozměry loaderu jsou tokeny `size.*`. Souřadnice SVG maskota jsou geometrie viewBoxu (`geometry.ts`), ne UI rozměry.

## Oprava
- `logic/__tests__/mascot.test.ts`: doplněn případ `stageForXp(-10)` → 1 (brief Task 18 Step 2). Logika už ho správně ořezávala.

## Otevřené (neblokuje)
- design / rating: v dark režimu šála (`#243039`) na pozadí málo výrazná, na srsti čitelná (R35).
- design / rating: ramenní pás stage 3 působí mírně jako límec (Task 15).
- motion / rating: `motion.hop` při opakovaných poskocích celebrate klesá ~16 pt pod klid.
- boss (krok 4): nálada sad a `cosmetics` zatím nemají zdroj v appce (liga/streak, šatník).

Snímky: `.superpowers/sdd/2026-09-29-opice-faze1-core-loop/tools/shots/qa-step3` a `qa-step3-loop`. Dočasná route `app/qa-preview.tsx` smazána, server ukončen, web-build odstraněn.
