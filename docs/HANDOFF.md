# Kde jsme skončili (2026-10-05 večer)

## Redesign „Nothing Dot“ — fáze 1 (systém + mapa + lekce + oslava)
- Spec: `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`
- Plán: `docs/superpowers/plans/2026-10-05-nothing-dot-faze1.md`
- Zadání a rozhodnutí uživatele: `docs/prompts/2026-10-05-redesign-nothing-dot.md`. Reference jsou v `images/`.
- Commity db940b8..257aafb: design, motion i QA jsou hotové (QA: SCHVÁLENO).

## Stav: rating kolo 1 = 15/100 (`docs/RATING.md`). Rozpracované opravy, ZATÍM NECOMMITNUTÉ
Ověřeno: tsc čistý, eslint čistý, jest 535/535.
Hotovo v pracovním stromu:
- `app/dev.tsx` + `components/dots/DotGallery.tsx`: dev sekce „Tečky“.
- `components/map/NodePopover.tsx`: dlaždice bez šipky, pilulka, mono údaje. Popisky uzlů v `LessonMap.tsx` mají údaje mono.
- `data/copy.ts`: „Zítra · …“ (dřív dvojtečka 2×), copy `dev.dots`/`dev.dotState`.
- `components/map/Plate.tsx`: komentář už neodkazuje na smazaný GoldenFigure.

## Zbývá pro rating kolo 2
1. Commitnout výše uvedené.
2. Boss zápis fáze 1 do `docs/LOG.md`: plán, integrace, web vstup `index.web.js` + `public/canvaskit.wasm`, smazání Barbell/XpPop/GoldenFigure, haptika CTA light.
3. `README.md`: přepsat sekci „Vzhled a odezva (R44 Teplá litina)“ na Nothing Dot (Doto, Skia/CanvasKit, `index.web.js`, `components/dots/`).
4. qa-agent: zapsat body fáze 1 jako ✅ do `docs/QA.md` a nafotit oslavu znovu. Ověřit, že rozpis XP se nezlomí uvnitř položky (oprava NBSP v `celebration.ts`; screenshot `m-done-1300` je starší než oprava).
5. rating-agent kolo 2 (max 5 kol, pokračuje se jen při 100/100).

## Potom
- Fáze 2: liga, progres, sezóna, profil/šatník, nastavení/cíle, stage-up, onboarding. Onboarding má překryv lead textu s 1. kartou a díru mezi 1. a 2. kartou (`/onboarding/path`, `/onboarding/dream`).
- Fáze 3: 15 reakcí opičky (`logic/mascotReactions.ts`).
- Nový plán napsat pro každou fázi zvlášť (superpowers:writing-plans).

## Praktické
- Metro na tomhle stroji nesleduje změny souborů spolehlivě. Po změnách restartovat `npx expo start --web --port 8081 --clear` a nejdřív zabít starý proces na 8081.
- Screenshoty: Playwright ve scratchpadu session (`tabs.js`, `shot.js`), Chrome z `C:/Program Files/Google/Chrome/Application/chrome.exe`. Demo profil se načte přes `/dev` → „Načíst demo profil“.
- Agenti design/motion nemají shell, takže tsc/jest/eslint po nich spouští boss.
