# LOG

## 2026-09-30 · boss
- Zaveden tým agentů (design, motion, qa, rating) podle zadání uživatele. `docs/SPEC.md` je kopie `docs/superpowers/specs/2026-09-29-opice-faze1-design.md`.
- Rozhodnutí: uživatel chce vše dokončit bez dozoru, schvalování plánu kroků proto přeskakuji a rozhoduji sám (záznamy zde).
- Rozhodnutí: kroky = SPEC §12. Krok 2 (onboarding, mapa, lekce + oslava) běží: dokončuje se Task 11 (mapa, opravy review), pak Task 12 (lekce), Task 13 (oslava), Task 14 (ověření). Pak kroky 3–6.
- Rozhodnutí: plány `docs/superpowers/plans/*` zůstávají zdrojem detailních zadání; agenti je dostávají jako brief.

## 2026-09-30 · design/impl · Task 12
- Hotovo: obrazovka lekce `app/lesson/[id].tsx` (fáze přes `logic/lessonFlow.ts`, guard proti dvojímu tapu, jedno `attemptId` na pokus, Android Zpět = dialog ukončení), `components/lesson/*`: 15 SVG siluet (dvě pózy, smyčka 900 ms, při omezení pohybu statická póza A), `useHoldTimer` + `HoldTimer` (prstenec 220, odpočet proti hodinám po 250 ms, pauza na pozadí, tik v posledních 3 s, holdDone a po 400 ms další cvik), `ExerciseCard`, `LessonProgress`. Mapa naviguje typovanou routou bez `as Href`.
- Rozhodl jsem sám: `HoldTimer` bere stav z hooku (`timer` prop) místo `seconds/onDone`, lištu kreslí rodič (brief sám doporučil hook variantu); cvik je klíčovaná komponenta `ExerciseStep`, takže odpočet začíná pro každý cvik znovu; otevřený dialog ukončení pauzne výdrž; na webu `confirm` místo `Alert` (RN Web Alert nic nezobrazí); nové texty `copy.lesson.close`, `progressA11y`, `loadTarget.lesson/lessonResult`.
- Otevřené: fáze `celebrate` zatím jen dočasný titulek + „Pokračovat“ → `router.back()` (TODO Task 13, `result` je připravený ve stavu); souřadnice siluet ponechány podle briefu (kontrolní arch `shots/t12-self/dark-poses.png`); typed routes se generují při `expo start`.
