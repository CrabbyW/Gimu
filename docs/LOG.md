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

## 2026-09-30 · impl · Task 13
- Oslava dokončení: `LessonCompleteScene` (činka z boku, kotouč přiletí na obě strany, zacvaknutí objímek, rozkmit osy, haptika snap), `XpPop` (+XP v akcentu, count-up 500 ms, rozpis), opice idle → happy/celebrate. Pokračovat → `router.dismissTo('/(tabs)', { unlocked })` s guardem proti dvojímu tapu.
- Rozhodnuto sám: dopad = první dotek osy (ne konec pružiny); přestřel pod osu kreslen v měřítku 0,1 (plný motion.snap by kotouč propadl ~110 pt); přilétá kotouč lekce (u opakování/bosse se z nasazených ubere jeho výskyt); objímka před dopadem stojí 16 pt venku a dojede k novému kotouči; Stat dostal volitelný `tone`.
- Otevřené: zvuk `click` ze spec §7.3 (bez audio knihovny), stage-up navigace a `lessonEffect` jsou plán B; zpětný zákmit pružiny nad osu (~25 pt) posoudí motion-agent.

## 2026-09-30 · design-agent · krok 2
- **Činka v oslavě**: kotouče sedí na koncích osy za vnitřním dorazem (~45 % poloviny osy, u plné osy se doraz posune ke středu), tenký úchop uprostřed, silnější objímky. Dřív kotouče visely u středu a činka četla jako jednoručka. Kotouče z boku mají válcové světlo (gradient dělá hloubku, token `plateShade`).
- **Kompozice oslavy**: opice (M) stojí vpravo u čísla +XP místo osamocení v levém dolním rohu; titulek zůstává na jeden řádek vlevo nahoře.
- **Popover na mapě (D2)**: uzly jsou od sebe 112 pt, popover je vysoký ~165 pt, takže překryvu souseda se svisle nejde vyhnout. Popover je proto modální vrstva: závoj `scrim` přes mapu, vybraný uzel zůstává nad závojem. Překrytý uzel i opice záměrně ustoupí.
- **Siluety**: výřez viewBoxu podle obalu obou póz (s minimem 140×72, aby ležící pózy nezbytněly), zem u spodní hrany karty, čára 4. Opraveny pózy: plank na předloktích (předloktí na zemi), pushup B (lokty dozadu), handstandWall (delší paže, hlava výš nad dlaněmi).
- Otevřené: motion poznámky v `.superpowers/.../step2-design-report.md`.

## 2026-09-30 · motion-agent · krok 2
Presety v `lib/motion.ts`, haptika v `lib/haptics.ts`, zvuk v `lib/sound.ts`. Ověřeno snímkovými sekvencemi (web, light + dark): `.superpowers/.../shots/step2-motion`.

**Oslava dokončení** (`components/lesson/LessonCompleteScene.tsx`, `Barbell.tsx`), časy od zobrazení scény / od dopadu:
- Scéna: fade `motion.reveal` (480 ms).
- Přílet kotouče (+250 ms, levý +60 ms): svisle pád `motion.fall` (timing 440 ms, ease-in bezier 0.55,0,0.9,0.5 – zrychluje jako závaží), vodorovně 140 pt → 0 a rotace 18° → 0 ve stejné délce s ease-out `motion.ui.easing`. Dohromady oblouk.
- Dopad (konec pádu, callback na UI vlákně): dosednutí `motion.seat` = pružina z 0 s počáteční rychlostí 260 pt/s dolů (damping 25, stiffness 520, ζ ≈ 0.55). Kotouč se zaboří ~6 pt a vrátí s přestřelem < 1 pt. **Náhrada** původního `motion.snap` na celém pádu, který dělal odskok ~25 pt nad osu kolem 400 ms. Preset `snap` odstraněn.
- Objímka (každá strana při dopadu svého kotouče): čeká 16 pt venku **neviditelná** (průhlednost odvozená z odstupu 16 → 0 pt = 0 → 1), při dopadu dojede za 120 ms (`motion.ui.easing`) a objeví se. Nepřekrývá letící kotouč.
- Dopad: haptika Heavy (`haptics.impact`), zvuk `click` (`useClickSound`), rozkmit osy o 3 pt dolů za 50 ms a návrat pružinou `motion.rattle` (damping 22, stiffness 600, ζ ≈ 0.45, doznění ~250 ms, dřív ζ 0.15 zvonilo > 1 s).
- +120 ms: +XP pop (`motion.pop`, scale 0.6 → 1, opacity `motion.ui`, count-up 500 ms).
- +420 ms: opice nálada happy/celebrate (plán A kreslí obojí jako happy: úsměv + poskočení `motion.hop`) a haptika Success. Dřív Success 90 ms po dopadu a opice současně s +XP. Teď samostatný takt podle spec §7.3 kroky 4 → 5 → 6.
- +700 ms titulek `motion.reveal`, +900 ms CTA aktivní (beze změny).
- Omezený pohyb: objímky na místě od začátku, kotouč se prolne 200 ms na místě, pak Heavy + click, bez rozkmitu a bez pružin. Success s opicí +420 ms (bez poskoku).

**Zvuk** `assets/sounds/click.wav`: 90 ms, 44.1 kHz mono. Vlastní syntéza (šumový úder, kovové partialy 2650/4100 Hz a těžký tón 140 Hz, deterministická), generátor `.superpowers/.../tools/gen-click.mjs`, bez cizích nahrávek. `expo-audio` (~57.0.5, v Expo Go), `setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' })`: tichý režim iOS zvuk vypne, cizí hudbu nepřeruší.

**Mapa** (`components/map/LessonMap.tsx`): závoj popoveru se prolne 0 → 1 `motion.ui` (180 ms) souběžně s popoverem, tap zavírá hned od mountu.

**Audit beze změny** (sedí se spec §6.7): zrození opice (kruh `motion.pop`, prasknutí 220 ms timing, opice `motion.hop`, Success, reduced = fade 200 ms), odemčení uzlu (`motion.unlock` + Light, čára 420 ms, fajfka 280 ms, skok opice 360 ms + `motion.hop`), zatřesení zamčeného uzlu (5 × 50 ms timing), puls aktuálního uzlu (1100 ms, reduced vypnut), odpočet výdrže (puls 2 × 180 ms `motion.ui`, tick poslední 3 s, Medium na nule), siluety (smyčka 900 ms, reduced stojí), popover (`motion.ui`, reduced bez scale). Vše je na UI vlákně přes reanimated, kromě count-upu XP (rAF na JS, 500 ms, číslo je text). Stav se ukládá před animacemi, žádná animace neblokuje logiku.

- Rozhodnuto samo: Success přesunut z dopadu k opici (spec §7.3 krok 6), Heavy zůstává při dopadu.
- Otevřené: CTA oslavy je ~1,6 s neaktivní (záměr z tasku 13, spec krok 7). Pokud má platit „animace neblokuje interakci“ doslova, může být aktivní hned. Celebrate póza až v plánu B (Task 16). Zvuk ověřen jen na webu (1× play); na zařízení k ruční kontrole (tichý režim).

## 2026-09-30 · qa-agent · krok 2
- Ověřen core loop (onboarding → mapa → lekce reps+hold → oslava → odemčení → reload) na webu v light i dark, edge cases onboardingu, dvojklik, quit, boss. Task 14 hotový: `docs/superpowers/plans/2026-09-29-opice-faze1-core-loop.review.md`.
- Opraveno samo: zamčenou lekci šlo dokončit přes URL/deep link mimo pořadí (b006c93, guard + test, 198 testů).
- `tsc --noEmit` projde i bez vygenerovaných typed routes.
- Verdikt NESCHVÁLENO. Otevřené: opakovaný onboarding smaže profil (boss), `expo-doctor` chce `expo-asset` (boss), UX zamčené lekce a quit bez historie (boss), hardcoded typografie mimo theme (design). Detail v `docs/QA.md`.
