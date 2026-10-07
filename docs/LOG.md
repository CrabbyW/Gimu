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

## 2026-09-30 · boss · QA oprava kolo 1
- Opraveno: druhý onboarding mazal profil a `activity` — `/onboarding/*` teď s existujícím profilem přesměruje na `/(tabs)` (`app/onboarding/_layout.tsx`), `MockUserService.completeOnboarding` navíc existující profil odmítne přepsat (test).
- Opraveno: `expo-doctor` hlásil chybějící peer `expo-asset` pro `expo-audio` — doinstalováno přes `npx expo install expo-asset`, `21/21 checks passed`.
- Opraveno: zamčená lekce otevřená deep linkem se rozjela a selhala až na konci — `getLesson` teď vrací i stav uzlu, `app/lesson/[id].tsx` ho čte hned na startu a zamčenou lekci ukáže přes `ErrorState` s tlačítkem zpět na mapu (test v `MockLessonService.test.ts`).
- Opraveno: Zrušit lekci deep linkem nic nedělalo, protože `router.back()` neměl historii — nahrazeno `router.canGoBack() ? router.back() : router.replace('/(tabs)')`.
- `npm test` (200 testů), `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` (21/21) — vše čisté.

## 2026-09-30 · design-agent · QA oprava kolo 1
- Odstraněny natvrdo zapsané typografické hodnoty mimo `theme/`: přidány tokeny `theme/tokens.ts` → `type.input` (20/28, `TextField`), `type.inputLarge` (22/32, `app/onboarding/dream.tsx`), `type.counter` (display 32/32, `TopBar` streak/XP), `type.badgeLabel` (mono 10/12, `TopBar` `TierBadge`). Vykreslený výsledek beze změny — jen přejmenované/centralizované hodnoty; `components/ui/Text.tsx` doplněn o `TABULAR` záznamy pro nové varianty.
- `MASCOT_COLORS` (`components/mascot/palette.ts`) přesunuty do `theme/tokens.ts` jako token `mascot` (srst/obličej jsou v obou režimech stejné, viz spec §8) a exportovány přes `theme/index.ts`; `palette.ts` je nyní jen re-export z tématu.
- Grep `app/` a `components/` na raw hex/fontSize/spacing mimo theme: nalezeno navíc `DotSteps.tsx` (`gap: 6`) a `Barbell.tsx` (`Collar` `borderRadius: 2`) — ponecháno, jde o animační/geometrické konstanty motion-agenta (reanimated), ne o statický design token; mimo scope design-agenta.
- `npm test` 200/200, `npx tsc --noEmit` čisté, `npx expo lint` čisté.

## 2026-09-30 · qa-agent · krok 2 kolo 2
- Znovu ověřeny problémy 1–5 z kola 1 (web flow `tools/flows/qa-r2.mjs`, light i dark), všechny jsou opravené: redirect onboardingu s profilem, doctor 21/21, zamčená lekce přes URL ukáže ErrorState, quit deep linkem vede na mapu, tokeny typografie.
- Regrese celého flow je čistá: `npm test` 200, tsc, lint a doctor projdou.
- Sám jsem nic neopravoval.
- Verdikt SCHVÁLENO. Otevřené a neblokující: drobné SVG a Stat literály mimo theme (design) a kontrola na zařízení (uživatel). Detail je v `docs/QA.md`.

## 2026-09-30 · boss · úklid před ratingem
- Design tokeny: zbylé SVG a Stat literály z QA kola 2 přesunuty do `theme/tokens.ts` — `svgType.label`/`svgType.plateKg` (BarbellBoss, Plate) a `statSize` (Stat), exportované přes `theme/index.ts`. Vykreslený výsledek beze změny.
- README.md přepsáno do češtiny podle aktuálního stavu repa; `docs/STATUS.md` aktualizován (krok 2 hotový a schválený QA, rating čeká).
- Oprava záznamu QA kola 1: `npm test` mělo 200 testů, ne 201.
- `npm test` 200/200, `npx tsc --noEmit`, `npx expo lint` — vše čisté.

## 2026-09-30 · design-agent · rating oprava kolo 1
Oprava tří chybějících kritérií z `docs/RATING.md` (krok 2, skóre 70/100), podle rozhodnutí boss.

- **Spacing (spec §6.6: 4 8 16 24 40 64 104).** Odstraněn `space.xs_plus` (6), zavedený bez zápisu v LOG commitem 77301b7 pro `DotSteps.tsx`. `DotSteps` mezera mezi tečkami přepnuta na `space.s` (8) — vizuálně nejbližší spec hodnota, řádek průběhu zůstává čitelný i s rozšířenou aktuální tečkou (20 pt). Toto je jediná změněná vykreslená hodnota v celé opravě.
- **Radius (spec §6.6: 8, 20, full).** Odstraněn nepoužívaný `radius.m` (12) — mrtvý token, nikde v `app/`, `components/` ani `hooks/` nebyl použit. `radius.xs` (2), použitý jen pro objímku činky (`Barbell.tsx` `Collar`), byl z `radius` odstraněn a přesunut do nového `theme/tokens.ts` → `material.collarRadius: 2`.
  **Ruling: tloušťky/poloměry materiálu činky (geometrie) nejsou UI radius §6.6; žijí v theme jako material tokeny.**
  `radius` teď obsahuje jen skutečnou UI škálu: `{ s: 8, l: 20, full: 999 }`.
- **Sizes.** Přidán `theme/tokens.ts` → `size = { hit: 44, hitLarge: 56, control: 48, actionBar: 96, pathCard: 120, topBarBadge: 32 }`, exportovaný přes `theme/index.ts` a `Theme.size` (`buildTheme.ts`). Nahrazeny natvrdo zapsané duplicity minima 44 pt a další rozměry z `docs/RATING.md` kategorie 3:
  - `LessonProgress.tsx` (`HIT`), `NodePopover.tsx` (`CLOSE_HIT`) → `size.hit`
  - `PlateNode.tsx` (`MIN_HIT`) → `size.hitLarge`
  - `MilestoneChip.tsx` (`minHeight: 44`), `app/onboarding/milestones.tsx` `CustomMilestone` (`minHeight: 44`) → `size.hit`
  - `PathCard.tsx` (`minHeight: 120`) → `size.pathCard`
  - `BigActionBar.tsx` (obě `minHeight: 96`) → `size.actionBar`
  - `Button.tsx` (`minHeight: 56`) → `size.hitLarge`
  - `SegmentedControl.tsx`, `TextField.tsx` (`minHeight: 48`) → `size.control`
  - `TopBar.tsx` (`BAR_H = 56` → `size.hitLarge`, `Cell` `height: 32` → `size.topBarBadge`)
  Doplňkový grep `app/` a `components/` na další width/height/minHeight/minWidth literály (mimo SVG geometrii a viewBox) odhalil ještě `app/onboarding/dream.tsx` (`minHeight: 32 * 3 + …`) — nahrazeno `typography.inputLarge.lineHeight * 3 + …`, aby řádek nedublovat samostatný literál vedle existujícího typografického tokenu, místo nového `size` tokenu (hodnota je odvozená od textu, ne od dotykové plochy).
- Vykreslený výsledek beze změny kromě mezery v `DotSteps` (6 → 8 px).
- `docs/QA.md`: řádek README přepnut na ✅ (repo je aktuální, viz doporučení rating-agenta).
- Ověření: `npm test` 200/200 (26 sad), `npx tsc --noEmit` čisté, `npx expo lint` čisté.

## 2026-09-30 · qa-agent · krok 2 kolo 3
- Rozsah: `git diff 6ef2b1b..HEAD -- . ':!docs'` — design-tokenový refaktor (size, material, svgType, statSize) + DotSteps gap 6→8.
- `npm test` 200/200 (26 sad), `tsc --noEmit` čisté, `expo lint` čisté, `expo-doctor` 21/21.
- Ověřeno hodnota za hodnotou, že každé nahrazení literálu tokenem zachovává původní číslo (size.hit=44, hitLarge=56, control=48, actionBar=96, pathCard=120, topBarBadge=32, material.collarRadius=2, svgType.label/plateKg, statSize M/L/XL). `dream.tsx` `typography.inputLarge.lineHeight` = 32, beze změny.
- Web smoke test (`tools/flows/qa-step2.mjs`, light+dark, `tools/shots/qa-step2-r3`): celý flow onboarding → mapa → lekce → oslava → boss proběhl bez pageerror/console.error; DotSteps mezera 8px viditelná a bez rozbití layoutu; server po testu ukončen.
- Grep na natvrdo psané UI rozměry/fontSize/hex v `app/` a `components/` mimo theme (SVG geometrie vyjmuta): 0 nálezů — problém B z kola 2 uzavřen.
- Verdikt: SCHVÁLENO.

## 2026-09-30 · boss · krok 2 uzavřen
- Rating 100/100 (kolo 2), QA SCHVÁLENO (kolo 3). Kola: QA 3, rating 2.
- Potvrzuji ruling: tloušťky/poloměry materiálu činky jsou geometrie, ne UI radius §6.6 → `material` tokeny v theme.
- Další rozhodnutí boss v tomto kroku: CTA oslavy zamčené do konce sekvence (§7.3 krok 7); impact při prvním dotyku kotouče (§7.3 „při dopadu“); popover mapy jako modální vrstva se závojem; světlý plate10 #8A867F kvůli kontrastu; label „KG“ odstraněn.
- Pokračuje plán B (`docs/superpowers/plans/2026-09-30-opice-faze1-planB.md`), krok 3: maskot.

## 2026-09-30 · boss+design · Task 15
- Boss: `components/mascot/geometry.ts` (`STAGE_GEOMETRY`, hodnoty z briefu 1:1), `ANCHORS[2]`/`ANCHORS[3]` vlastní, test `components/mascot/__tests__/anchors.test.ts` (TDD: nejdřív FAIL, pak PASS).
- Rozhodnutí sám: kotvy `handL/handR` stage 1 posunuty z (64,159)/(136,159) na konec paže (62,166)/(138,166). Brief říká „stage 1 beze změny“, ale jeho vlastní test „ruka leží na konci paže“ (tolerance 1.5) by se starými hodnotami (střed dlaně) padal; stage 2/3 kotvy z briefu leží na konci paže, takže sjednoceno. Kotvy zatím nic nespotřebovává (kosmetika až Task 17).
- Design: `SvgMascot` kreslí tělo, paže (skupina `rotate` kolem ramene), nohy, uši, ramena stage 3 (fur nahoře / furShade dole přes clip) a biceps stage 3 (r = 0.6·w ve 40 % délky) z geometrie. Obličej = skupina stage 1 se scale r/54. Světelný posun hlavy škálován s hlavou. Bříško odvozeno z trupu (rx = w/4, ry = 0.23·h). Odstraněn `useStageFallbackWarning`. Stage 1 vizuálně beze změny.
- Screenshot light+dark, S a XL: `.superpowers/sdd/planB/shots/t15`. Stage čitelné v S, stage 3 jasně silnější silueta.
- Otevřené: ramenní „jho“ stage 3 působí mírně jako límec (spodní stínová polovina); pro Task 17/rating k posouzení.

## 2026-09-30 · motion-agent · Task 16
Nálady celebrate a sad v `components/mascot/SvgMascot.tsx` (spec §8). Mapování `MOOD_POSE` (export, TDD). Presety v `lib/motion.ts` (sdílené presety projektu, `theme/motion.ts` neexistuje). Vše reanimated na UI vlákně. Ověřeno snímkovými sekvencemi (web, light + dark, stage 1–3, reduced): `.superpowers/sdd/planB/shots/t16`.
- **celebrate · paže nahoru:** `withTiming` 0 → 1, `motion.armsRaise` (220 ms, bezier 0.22,1,0.36,1). Paže se otočí z klidového `limb.angle` na zvednutý úhel. Spouští se změnou nálady na celebrate (oslava lekce: boss nebo stage-up, `LessonCompleteScene` beze změny, už předává celebrate). Při odchodu z celebrate se paže vrátí stejným timingem.
- **celebrate · opakované poskoky:** `withRepeat(withSequence(withTiming(−0.12·px, 140 ms), withSpring(0, motion.hop {damping 12, stiffness 240}), withDelay(motion.celebrateRestMs = 600, withTiming(0, 0 ms))), −1)`. Perioda ~1.3 s. Změna nálady je zruší (`cancelAnimation`) a opice dosedne `motion.moodShift`. Pružina = herní odměna.
- **happy · poskočení:** beze změny (jeden skok 140 ms + `motion.hop` při změně nálady na happy).
- **sad:** uši `+8` dolů a `±4` ven, oči a odlesky `cy +3` (pohled dolů), pusa `SAD_MOUTH` crossfade. Vše `withTiming` `motion.moodShift` (300 ms, bez pružiny). Dech `BREATH_HALF_MS_SAD` 1800 ms a `BREATH_SCALE_SAD` 0.012 (idle/happy/celebrate 1200 ms a 0.02). Spouští se náladou sad. Zatím ji v appce nikdo nepředává.
- **Pusy:** tři (idle, happy, sad) crossfade přes opacity. Do sad a ze sad `motion.moodShift`, jinak `motion.ui` (180 ms).
- **Reduce motion:** celebrate = paže nahoře staticky, bez poskoků. Sad = statická póza (uši, pohled, pusa bez přechodu), bez dechu. Dech a mrkání vypnuté ve všech náladách jako v plánu A.
- Haptika se v maskotu nespouští, patří volajícímu.
- Rozhodnuto sám: **zvednutý úhel paží podle stage 1: 120°, 2: 140°, 3: 160°**. Brief chce 160° pro všechny, ale krátká paže stage 1 by skončila uvnitř hlavy (ruka 41 od středu hlavy r 54), takže by opice vypadala bez rukou. Stage 2 by ruka jen vykukovala. Ruce jdou do V, dokud ruka nemine hlavu.
- Rozhodnuto sám: paže se kreslí jako tah s kulatými konci (vizuálně totožné s dřívějším otočeným `Rect rx=w/2`), aby šel úhel animovat přes `d` na UI vlákně. Biceps stage 3 se posouvá po paži.
- Otevřené: pružina `motion.hop` při dopadu klesne ~16 pt pod klid, než se ustálí. U opakovaných poskoků je to vidět častěji než u jednoho skoku happy. Preset a chování jsou z plánu A, rating posoudí.

## 2026-09-30 · boss+design · Task 17
- **Boss:** `data/cosmetics.ts` (12 položek přesně podle tabulky briefu), `riveInputs.ts` + test (TDD, nejdřív FAIL), `RiveMascot.tsx` stub (Rive import zakomentovaný, vykreslí `SvgMascot`), `Theme.seasonThemeId`, tokeny `seasonGold #C6A15B` a `onSeasonGold #131316` v obou paletách + kontrastní test.
- **Rozhodnutí 12 (šála):** během Winter Arc se `SeasonScarf` kreslí vždy na `neck`, kromě případu, kdy je `outfit-winter-arc-scarf` nasazená jako outfit (bez zdvojení). Pokryto testem v `SvgMascot.test.tsx`.
- **ESLint:** `cosmetics.test.ts` importuje `@/data/cosmetics`, takže UI hranice teď má `ignores: ['**/__tests__/**']` (jak brief předvídal).
- **Design:** vrstvy kreslí v souřadnicích kotvy (tvar pro stage 1 kolem 0,0). Body vrstvy jsou oříznuté na trup a čelenka na hlavu, takže sedí na všech stage bez ladění.
  - Tílko: podklad je stín srsti, aby 85% inkoust nepropouštěl bříško; akcent jen jako lem 3 px.
  - Mikina: `rule`, kapsa a šňůrky v `muted`; kapuce je zadní část na `neck`. `MascotLayer.parts` je rozšíření typu z briefu, přidané kvůli dvěma kotvám.
  - Šála: neutrály Winter Arc (`mapRule` a pruhy v `headerBase`) čte přímo z `SEASON_OVERRIDES.winterArc[scheme]`, aby šála vypadala stejně i mimo sezónu.
  - Potítka: nekreslí se v transformované skupině. Jsou to tahy po ose paže ze stejného `raise` (sdíleného přes `ArmPoseContext`) a `armPoint` (přesunuto do `geometry.ts`), takže se zvedají s celebrate. Brief chce pořadí outfit → accessory; drží se v rámci každé kotvy a kotvy jdou v pořadí zadní → ruce → trup → krk → hlava.
- Screenshoty: `.superpowers/sdd/planB/shots/t17` (každá vrstva, stage 1–3, idle a celebrate, light a dark). Dočasná route byla smazána.
- Otevřené: v dark režimu je šála (`mapRule #243039`) na pozadí málo výrazná, na srsti ale čitelná. Rozhodne rating.

## 2026-09-30 · motion-agent · DotLoader (požadavek uživatele)
- Nativní port shadcn @dotmatrix `dotm-square-11` („Echo Ring“): `components/ui/DotLoader.tsx` (`DotLoader`, `DotLoaderScreen`), čisté funkce v `lib/dotLoader.ts` (test `lib/__tests__/dotLoader.test.ts`).
- Parametry: mřížka 5×5 (vzor full, 25 teček), kruh = Manhattanova vzdálenost 0–4; cyklus 1500 ms / speed (výchozí speed 1.25); zpoždění kruhu (ring·0.14 + parita·0.03)·cyklus; keyframy 0 % 0.625·base → 28 % 0.98·peak → 56 % mid → 78 % 0.68·peak+0.32·mid → 100 %, každý úsek ease-in-out (0.42,0,0.58,1); výchozí opacity base 0.16 / mid 0.32 / peak 1 (`motion.dotLoader` v `lib/motion.ts`, ruling R33). Bloom = radiální záře (react-native-svg) mezi 14 % a 42 % cyklu, stejně jako skoková `--dmx-bloom-level` 0.9 v originále.
- Jeden sdílený čas (`withRepeat(withTiming)` 0→1) na UI threadu, každá tečka jen posouvá fázi. Omezení pohybu: statická opacita 0.2 + (1 − ring/4)·0.72 (přemapovaná, když jsou zadané opacity).
- Tokeny: `size.loader` 32, `size.loaderDot` 4; barva `c.accent` (prop `color`). A11y: `progressbar`, popisek `copy.common.loading` („Načítám“).
- Použití: hydratační brána v `app/_layout.tsx` (dřív `null`), `app/index.tsx` (načítání profilu, dřív `null`), `app/(tabs)/index.tsx` a `app/lesson/[id].tsx` (dřív prázdný View).
- Screenshoty: `.superpowers/sdd/planB/shots/dotloader` (light, dark, reduced). Dočasná route byla smazána.
- Otevřené: záře je aproximace CSS drop-shadow radiálním gradientem. Na nativu kryje hydrataci splash, takže loader v bráně je vidět jen na webu. Ukládání výsledku lekce (`busy`) loader zatím nemá (fáze 2).

## 2026-09-30 · qa-agent · krok 3
- `npm test` 237/237, typecheck, lint, expo-doctor 21/21 zelené.
- Doplněn test `stageForXp(-10)` → 1. Prahy 499/500/1999/2000 a `anchors.test.ts` pro stage 1–3 prochází.
- Snímky (web, light a dark): 3 stage × 4 nálady × kosmetika, reduce motion, potítka v celebrate, DotLoader. Regresní smoke core loopu kroků 1–2 prošel.
- Verdikt SCHVÁLENO. Otevřené pro rating: kontrast šály v dark režimu, ramenní pás stage 3, dopad `motion.hop`. Detail v `docs/QA.md`.

## 2026-09-30 · design-agent · UX1 onboarding výběr
- **R36 (vize těla):** volné pole nahrazeno výběrem. `data/dreams.ts` = 6 karet na cestu (id + glyf), texty v `copy.onboarding.dream.options`. Karty čte UI přes `useDreamOptions` (hranice UI ↛ data/). Sedmá karta „Vlastní…“ odkryje původní pole (max 140). `dreamBody` = titulek karty, nebo vlastní text; schéma beze změny. Při změně cesty se předvolená vize vymaže, vlastní text zůstává (`isDreamPreset`).
- **Komponenty:** `ChoiceCard` (kompaktní sourozenec `PathCard`: odděluje jen pozadí `surface`, výběr = 2px akcentový proužek vlevo + glyf v akcentu, `accessibilityRole="radio"`), `DreamGlyph` (14 plochých tvarů ze skládaných kruhů, tokeny `text`/`accent`/`surface`; „Vlastní…“ = přerušovaný obrys).
- **Tokeny:** `type.choiceTitle` (Bebas 26/28), `size.choiceCard` 80, `size.choiceGlyph` 40, `size.glyph` 48 (PathGlyph už nemá rozměr natvrdo).
- **Copy:** řádek karty ≤ 34 znaků, aby se každá karta vešla na jeden řádek a seznam měl stejný rytmus (hlídá test).
- **R37 (milníky):** 7 předvoleb na cestu + 2 obecné (−3 kg, +3 kg svalů). Pravidlo 2–3 a „+ vlastní“ beze změny.
- **Opice stage 3:** vodorovný ramenní pás (četl se jako límec) nahrazen dvěma deltoidy (kruhy se světlem shora jako hlava) a trapézem, který od nich šikmo stoupá ke krku pod hlavu. Geometrie `shoulders: { dx, y, r, trapY }`.
- **Šála Winter Arc:** nový token `SEASON_MATERIAL.winterArc` (dark látka `#6F8797` / pruh `#243039`, light `#5B7485` / `#BCC8CF`). Ocelová modrošedá zůstává v paletě sezóny, ale odlepí se od tmavého podkladu. Neutrály mapy (`SEASON_OVERRIDES`) beze změny.
- SPEC §7.1 kroky 2 a 3 aktualizovány. Testy: `data/__tests__/onboardingChoices.test.ts`, `components/onboarding/__tests__/dream.test.tsx`.
- Screenshoty: `.superpowers/sdd/planB/shots/ux1/r1–r3` (r3 finální). Dočasná route `mascot-preview` smazána.
- Otevřené: animace se nedotýkal (proužek `ChoiceCard` je statický, háček `selected`); glyf „half“ (kupole) opticky sedí mírně níž než ostatní.

## 2026-09-30 · motion-agent · UX2 motion overhaul (brag)
Uživatel na telefonu hodnotil pohyb jako „dost amatérský“. Systém je v `lib/motion.ts` (R33): pojmenované `ease` a `dur`, pružiny, `stagger(i)` a `enterRise(i, rise)`. Test `lib/__tests__/motion.test.ts` hlídá UI 90–300 ms, ζ odměn 0.65–0.9, víčko staggeru ≤ 500 ms a hop bez pružiny. Snímky: `.superpowers/sdd/planB/shots/ux2/r1` a `r2` (page.clock), `rt` (reálný čas pro layout animace).

**Tón:** brag `cinematic` („dramatic, trailer-scale“: každý úder dosedne, než přijde další), zkrocený na osobnost „Posilovna“. UI je krátké a rozhodné: silný ease-out, bez zákmitu. Odměny mají váhu: gravitační pád, tvrdý dopad s punchem scény, slam čísla z 1.2, pružiny ζ 0.7–0.85. Z hyperframes-animation přebírám tato pravidla: smooth beats bouncy (žádný back.out), press-release (rychlé stlačení, rozhodný návrat), sled ≤ 0.5 s, odchod a příchod současně, anticipace před velkým pohybem.

**Křivky a délky:**
- Křivky: `ease.out` (0.22,1,0.36,1), `ease.punch` (0.16,1,0.3,1), `ease.exit` (0.4,0,0.2,1), `ease.gravity` (0.55,0,0.9,0.5), `ease.press` (0.5,0,0.75,0), `ease.sine`.
- `dur`: press 90, release 220, tap 150, ui 180, enter 260, reveal 480, step 45, staggerCap 360.
- Pružiny: `pop` 21/220 (ζ 0.71), `unlock` 22/260 (ζ 0.68), `slam` 33/420 (ζ 0.80), `settle` 29/300 (ζ 0.84). `seat` a `rattle` beze změny.

**Animace (parametry · spouštěč):**
- **Stisk** (`usePressFeedback`): scale na 0.94–0.98, `motion.press` 90 ms a `motion.release` 220 ms punch · onPressIn/Out. Nově mají stisk i uzly mapy (0.94), boss (0.96), chipy milníků (0.96) a zavírací ✕ lekce (0.9). Reduced: opacita 0.7.
- **Přechody obrazovek** (Expo Router Stack): kořen `fade` 250 ms, lekce `slide_from_bottom` 350 ms (výchozí iOS 500 ms), onboarding `slide_from_right`, zrození `fade` 300 ms (střih do tmy).
- **Nástup kroku onboardingu** · mount obrazovky: titulek `enterRise(0, 16)`, lead `enterRise(1)`. Karty cest, 7 karet vize a chipy milníků jedou `enterRise(i)` = FadeInDown 260 ms punch, zdvih 12 pt (chipy 8 pt), zpoždění i·45 ms (max 360 ms). Pole „Tvoje vize“ a formulář vlastního milníku `enterRise(0, 8)` · odkrytí.
- **Výběr karty** (PathCard, ChoiceCard) · `selected`: proužek scaleY 0.3 → 1 a opacita, glyf crossfade text → akcent. Výběr `motion.ui`, zrušení `motion.uiExit`.
- **Chip milníku** · `selected`: inverze se prolne `motion.ui`/`uiExit`. Zatřesení beze změny.
- **Výběr vize:** `haptics.tick` + zvuk `select` (R40). Výběr cesty: zvuk `select`.
- **Zrození:** kruh `pop` (ζ 0.71, dřív 0.29). Anticipace 140 ms před prasknutím (scale 0.94). Prasknutí 220 ms `ease.punch`. Opice `settle` (dřív hop ζ 0.39).
- **Odemčení uzlu** · první dosažení cíle pružinou `unlock`: shock prstenec (akcent 2 px) 1 → 1.45, opacita 0.7 → 0, 420 ms punch, spolu s haptikou Light a zvukem `unlock`. Fajfka 280 ms punch. Puls aktuálního uzlu 1100 ms `ease.sine` (dřív lineární).
- **Popover** · tap uzlu: opacita, scale 0.94 → 1 a posun 8 pt od uzlu, `motion.ui`.
- **Skok opice na mapě** · fáze 5: přikrčení +4 pt (70 ms), odraz −24 pt ease-out, pád `ease.gravity`, celkem 360 ms. Bez pružiny.
- **Výměna cviku** · další cvik: FadeInRight 32 pt `motion.enter` a zároveň FadeOutLeft `motion.uiExit`. Je to builder, protože vlastní worklet na webu neběžel.
- **Výdrž:** v posledních 3 s pulzuje prstenec i číslo 1 → 1.06. Na konci 1 → 1.1 → 1 spolu s haptikou Medium.
- **Oslava** (časy od dopadu):
  - Kotouč beze změny.
  - Nově punch scény 1 → 1.018 za 60 ms, pak `release` · dopad.
  - +120 ms +XP: slam 1.2 → 1, opacita naráz (akcent se nezprůhledňuje), count-up 700 ms expo.out.
  - +480 ms opice.
  - +760 ms titulek: fade a zdvih 12 pt.
  - +1000 ms CTA vyjede 160 pt zespodu (`motion.reveal`, bez průhlednosti) a zaktivní se.
  - Reduced: fade 200 ms.
- **Maskot:**
  - Poskok: squash 70 ms → odraz 150 ms ease-out → pád 170 ms gravity → dopad squash 60 ms → 180 ms narovnání. Squash scaleY −6 %, chodidla drží.
  - **Oprava:** pružina ζ 0.39 dřív klesala ~16 pt pod klid, teď opice pod klid nikdy neklesne.
  - Stage 3: deltoidy s pažemi +6 nahoru a +2 ven (viewBox 200).
- **DotLoader:** beze změny.

**Zvuky:** Kenney (kenney.nl), CC0, ze `brag/0.3.0/skills/brag/assets/sfx`. Převod přes ffmpeg na WAV 44.1 kHz mono 16 bit. Hrají přes `lib/sound.ts` `useSfx` (expo-audio, `playsInSilentMode: false`, `mixWithOthers`).
- `plate-snap.wav` · dopad kotouče: `impact/impactPlate_heavy_003.ogg` ×0.85 + `impact/impactSoft_medium_001.ogg` ×0.9, lowpass 9 kHz, fade-out, limiter. Nahrazuje `click.wav` (smazán).
- `select.wav` · výběr cesty a vize: `ui/click2.ogg` ×0.6, lowpass 8 kHz.
- `unlock.wav` · odemčení uzlu: `interface/bong_001.ogg` ×0.7.

**Rozhodnuto samo:**
- CTA oslavy je do nástupu schované pod okrajem, jako u zrození.
- Zvuk výběru hraje jen u cesty a vize, ne u chipů.
- Poskok je bez pružiny.

**QA a úklid:** `qa-step2.mjs` a `qa-r2.mjs` pracují s kartami vize a polem „Tvoje vize“. Dočasná route smazána, server zastaven.

**Otevřené:**
- Zvuky jsem neslyšel na zařízení.
- Count-up +XP běží na JS (rAF).
- Opice na mapě pořád dělá dvojitý poskok, jako dřív.

## 2026-09-30 · qa-agent · krok 3 A2
**Udělal:** re-check kroku 3 po UX1 a UX2. Testy 257/257, typecheck, lint, expo-doctor 21/21. Core loop na webu light i dark, každá cesta, karty vize, „Vlastní…“ (prázdné, >140), změna cesty, milníky, váha, reload, rychlé klepání, reduce motion. Ověřeno, že click.wav nikde nezůstal a expo-audio chyby polyká. Verdikt SCHVÁLENO (docs/QA.md).
**Rozhodl sám:** dvojité posunutí onboardingu rychlým klepnutím hodnotím jako neblokující (bez neplatného stavu).
**Otevřené:** zámek navigace v OnboardingFrame (boss), count-up na JS a dvojitý poskok (motion), zvuky na zařízení (ruční kontrola), dreamBody titulek vs. věta (design).

## 2026-09-30 · boss+motion · opravy před ratingem A2
**Udělal:**
1. `OnboardingFrame` (boss): rychlé dvojité/trojité ťuknutí na Pokračovat přeskakovalo krok (milníky → váha → zrození bez zastavení na váze). `onContinue` je teď za bránou `firedRef`, kterou otevírá/zavírá `useFocusEffect` z `expo-router` (SDK 57) — projde nejvýš jedno volání na zaostřenou obrazovku, další ťuknutí se ignorují, dokud se krok nerozostří a znovu nezaostří. Kroky cesty, vize, milníků a váhy sdílejí `OnboardingFrame`, takže je oprava pokrývá všechny; krok zrození má vlastní `submitting.current` zámek a nebyl dotčen.
2. Mapa (motion): opice při odemčení uzlu skákala dvakrát — `<Mascot />` už hraje vlastní poskok (přikrčení → odraz → pád s gravitací → dopad se squashem, `motion.hop`) při změně nálady na „happy“, a `LessonMap` navíc přehrával vlastní svislý `lift` (stejné konstanty, druhá vrstva). Svislý `lift` v `LessonMap` je pryč (`HOP_LIFT`/`HOP_CROUCH` smazány), zůstal jen vodorovný přejezd mezi uzly; jediný skok teď hraje maskot sám.
3. R41 (boss): `dreamBody` u karty ukládá `"<Titulek>. <Řádek>"` (např. „Muscle-up. Přes hrazdu čistě, bez kopání.“), ne jen titulek — Progres zobrazuje `dreamBody` celý nahoře. `useDreamOptions` (hooks/useOnboardingDraft.ts) skládá větu přes novou `composeDreamSentence` z `logic/onboarding.ts`; `isDreamPreset` porovnává proti větám, ne titulkům. Krok vize (`app/onboarding/dream.tsx`) ukládá `o.sentence` a obnovu vlastního režimu i výběru karty po návratu na krok poznává podle věty. Vlastní text uživatele zůstává beze změny.

**Testy:** nový `components/onboarding/__tests__/OnboardingFrame.test.tsx` (brána onContinue: trojité ťuknutí = 1 volání, rozostření+zaostření ji znovu otevře). `dream.test.tsx` přepsán na věty a doplněn test obnovy výběru karty po návratu. `data/__tests__/onboardingChoices.test.ts` doplněn o unikátnost/délku/validitu složených vět (R41). `npm test` 261/261, `npx tsc --noEmit` čisto, `npx expo lint` čisto.

**Otevřené:** žádné z těchto tří položek.

## 2026-09-30 · qa-agent · krok 3 A3
**Udělal:** kompletní re-check kroku 3 (RATING 65/100, kolo 1, reasons 1.1 a 1.2). `docs/QA.md` je teď jedna tabulka pro celý spec §12 krok 3 + UX1 + UX2 + R41 — vrátil a znovu ověřil řádky z `eccd914` (stage 2–3, prahy 500/2000, celebrate/sad, kotvy, kosmetika, Rive stub, DotLoader), místo pouhého zkopírování je ověřil proti aktuálním testům a souborům. `0d24483` ověřen samostatně: nový flow `qa-a3.mjs` (mimo repo, `.superpowers/sdd/.../tools/flows/`) na webu (light+dark, port 8099) — trojklik na Pokračovat posune vždy přesně o jeden krok (cesta→vize, vize→milníky, milníky→váha), karta vize „Muscle-up“ zůstává vybraná po `goBack()` na krok, vlastní text „Deset čistých shybů.“ zůstává po návratu. Jeden poskok na mapě ověřen v kódu (`git show 0d24483`): `lift`/`HOP_LIFT`/`HOP_CROUCH` v `LessonMap.tsx` smazány, `mascotStyle` už `lift.value` nepřičítá — svislý pohyb hraje jen `<Mascot />`. `npm test` 261/261, `tsc --noEmit` čisto, `expo lint` čisto, `expo-doctor` 21/21. Server po testu ukončen, `web-build` smazán.
**Rozhodl sám:** žádnou opravu appky nevracel — logika i testy v pořádku, nález RATING byl dokumentační (QA.md neúplné) a procesní (0d24483 neschváleno), oboje řešeno tímto QA.
**Otevřené:** design (šála dark kontrast, stage 3 ramena na displeji), motion (count-up JS na slabším Androidu), boss (zvuky na zařízení, sad/cosmetics zdroj v kroku 4, SPEC §7.1 dreamBody věta vs. titulek, README stav — mimo rozsah QA).

## 2026-09-30 · boss · krok 3 uzavřen
- Rating 100/100 (kolo 2, c5d7a57), QA SCHVÁLENO (A3). Kola: QA 4 (A, A2, A3), rating 2.
- Boss: README „Stav“ a SPEC §7.1 (dreamBody jako věta, R41) aktualizovány v db69d21.
- Rozhodnutí v kroku 3: kotvy rukou stage 1 na konec paže (R31), úhel paží celebrate po stage 120/140/160 (R32), presety pohybu v `lib/motion.ts` (R33), DotLoader jako nativní port (R34), odchylky T17 přijaty (R35), onboarding s výběrem (R36, R37), brag pro pohyb v appce (R38, R39), tick při výběru vize (R40), dreamBody věta (R41).
- Pokračuje krok 4: liga, progres, sezóna + recap, šatník, notifikace.

## 2026-09-30 · boss · Task 19
- Hotovo: schéma DB v2 (`leagueWeek`, `lastLeagueResult`, `badges`, `seasonClaims`, milestone cíl sezóny se `start`), migrace v1 → v2 (zachová všechna v1 pole vč. `dreamBody` věty R41, doplní výchozí hodnoty, `leagueWeek` = pondělí týdne `createdAt`), `sanitizeEquipped` (zatím filtr neznámých id/špatného slotu proti `COSMETICS`). Contracts plánu B (MilestoneUpdateResult, grantDevXp, LeagueWeekView + dismissLastResult, SeasonProgress/Status/Recap s `beforeAfter`, getLatest, Wardrobe, BuyCheck). `logic/activity.ts` (dev-xp není lekce), `activeDays` a „první lekce dne“ ignorují dev-xp. Settings v2 (`reminderEnabled`, `reminderHour`, `stageOverride` + `migrateSettings`). Hooky `useNow`, `useDisplayStage`. Tab bar zapnutý, 5 tabů, 4 kostry.
- Rozhodnuto samostatně: `updateMilestone` v mocku vrací `completed` jen při překročení cíle a hlásí milestone kosmetiku podle počtu splněných milníků (Task 28 převezme logic/cosmetics). `grantDevXp` odmítá nekladná/necelá čísla. Poškozené `createdAt` u v1 profilu → profil se zahodí (jako jiná poškozená data). Hlavička kosterních tabů je sdílená `components/ui/TabHeader.tsx` (jazyk TopBaru). Ověřeno i živě na webu: v1 localStorage → v2, neznámé `equipped` zahozeno.
- Otevřené: mocky liga/sezóna/šatník zůstávají `notImplemented` (Tasky 20–28); obsah tabů dodají Tasky 21, 24, 27, 28.

## 2026-09-30 · boss · Task 20
- Hotovo: `logic/league.ts` (TDD, 19 testů): deterministické XP soupeřů (týdenní + denní šum přes mulberry32), `standings` (remíza → uživatel výš), `resolveWeek` (top 5 postup, poslední 3 sestup; Dřevo bez sestupu, Diamant bez postupu), `nextTier`, `settleLeague` (idempotentní, vyhodnotí jen poslední týden účasti, max ±1 stupeň), `formatCountdown`. `data/leagueUsers.ts` s 15 soupeři dle briefu, `LEAGUE_RULES` rozšířeno o `tierXpStep` 0.03 a `weeklyNoise` 0.08.
- Rozhodnuto sám: `Rival` a `LeagueRules` žijí v `logic/league.ts` (data je importuje jen jako typ); kosmetika: 9 soupeřů něco má, 6 nic. Kalibrace prošla bez úpravy `weeklyBase`.
- Otevřené: nic.

## 2026-09-30 · boss+design+motion · Task 21
- Hotovo (boss): `MockLeagueService.getCurrentWeek` (settleLeague → zápis profilu jen při změně, standings aktuálního týdne, „Ty“, stage z celkového XP, `promoteCount`/`demoteCount` podle Dřevo/Diamant, `endsAt = weekEndsAt`), `dismissLastResult`. `hooks/useLeague.ts` (klíč = `weekStart(now())`). Test `services/__tests__/MockLeagueService.test.ts` (postup o stupeň, druhé volání nemění `revision`, Dřevo/Diamant, dismiss). TopBar na mapě bere úroveň z `useLeague` (vyhodnocení týdne proběhne i bez otevření Ligy); API TopBaru beze změny.
- Hotovo (design): `components/league/{TierBadge,Countdown,ZoneDivider,LeagueRow}` podle §7.5. Hlavička: TierBadge 72 pt + obří Stat pozice (L, `/ 16`) + Stat XP týdne (M) + odpočet v Bebas. Vlastní řádek = `raised` + akcentový proužek 3 pt (jediný akcent na obrazovce). Zóny: barva jen v trojúhelníku, slovo `muted`, vlasová linka. Prázdný stav (0 XP tento týden) = výzva pod odpočtem; loading `DotLoaderScreen`; chyba `ErrorState` „Nepodařilo se načíst ligu.“.
- Hotovo (motion): nástup řádků (fade + zdvih 8 pt, `stagger(i)`, `motion.enter`), `LeagueResultBanner` (vysunutí `motion.ui`, zavření `motion.uiExit` → `dismissLastResult`; u postupu odznak pružinou `motion.pop` + `haptics.success`; omezený pohyb = 200ms fade bez pružiny), `Countdown` přes `useNow(30_000)`, auto-scroll na vlastní řádek (`scrollToIndex`, `viewPosition 0.5`). Mini opice s dechem, obalená `pointerEvents="none"`.
- Rozhodnuto sám:
  - Nástup řádků přes vlastní shared value, ne `entering` (layout animace ve virtualizovaných buňkách FlatListu se na webu rozjela, řádky se překrývaly).
  - Banner výsledku stojí nad seznamem, ne v jeho hlavičce, aby ho auto-scroll neodvezl.
  - S 0 XP se neauto-scrolluje (přednost má výzva v hlavičce).
  - Tokeny `size.leagueRow/rankCol/rowMascot/tierBadge/ownStripe` a typ `tierName` (Bebas 20, „DIAMANT“ se vejde do kruhu 72).
  - Kontrast trojúhelníku zóny testován jako grafický symbol ≥ 3:1 (light `success` z §6.2 má na base 4.36:1; význam nese slovo v `muted`).
  - Copy `explainer` a `result.stay` mají nezlomitelnou mezeru po „a“/„v“ (test sirotků).
  - Doplňková copy: odpočet, a11y řádku, `emptyWeek`, `lastWeek`, `dismiss`, `rank`, `myXp`.
- Otevřené (K ruční kontrole): FPS s 16 dýchajícími opicemi na slabším zařízení; haptika banneru na zařízení.

## 2026-09-30 · boss · Task 22
- Hotovo: `logic/season.ts` (`SeasonSpan`, `seasonDays`, `repairableDays`, `repairTarget`) TDD; `SEASON_RULES.repairWindowDays = 3` v `data/seasons.ts`; `applyLessonCompletion` má volitelné `season`/`repairWindowDays` a u nového pokusu (ne retry) zapíše `repairsDate` nejstaršího zameškaného dne okna; `MockLessonService.completeLesson` předává aktivní sezónu podle `toISODate(now)`.
- Pravidla (rozhodnutí 4–6): oprava jen pro cíl sezóny, streak beze změny (test); opravuje druhá a další lekce dne včetně replay, `dev-xp` ne; dny před `startDate` a před `createdAt` profilu nejsou v okně.
- Rozhodnuto sám: `repairTarget` vrací `null` i když dnešek leží mimo rozsah sezóny (test navíc); completion testy používají fixture s `createdAt` 2026-09-29 (≤ oknu), takže přepis `createdAt` nebyl potřeba.
- Otevřené: dev posun času (`seasonEndOffset`, Task 31) zatím výběr aktivní sezóny v mocku neovlivňuje, bere reálné `now` předané službě.

## 2026-09-30 · boss · Task 23
- Hotovo: `logic/season.ts` rozšířen o `SeasonCtx`, `goalTarget`, `goalValue` (4 typy), `weightBaseline`/`weightLatest`, `dayStates`, `seasonProgress` (met, reachable, daysLeft vč. dneška), `buildRecap`, `rewardFor`, `participationBadgeId`, `applyClaim` (idempotentní). Testy v `logic/__tests__/season.test.ts`.
- Rozhodnuto samo: typy `DayState`, `SeasonProgress`, `RecapBeforeAfter`, `SeasonRecap` přesunuty z `services/contracts.ts` do `logic/season.ts` (logic smí importovat jen `@/types`), contracts je re-exportuje (stejný vzor jako `NodeState`). Recap `beforeAfter` pro váhu (cíl weight nebo weightGoal lose/gain) vrací `null`, když chybí baseline nebo latest → slide se vynechá (ruling 8). Opravy (`repairsDate`) se do activeDays počítají jen v sezóně a ≤ dnes.
- Otevřené: mock `SeasonService` (getProgress/getRecap/claimReward) má tyto funkce napojit (Task 24).

## 2026-10-02 · design-agent · R42 design systém + mapa
- Hotovo: display font Inter 300 Light (`Inter_300Light` v `useFonts`, Bebas se už nenačítá), tracking −0.03 em přes `tracking` + `ls()` v `theme/tokens.ts`; přeškálované `displayXL 104/108`, `display 48/52`, `title 32/36`, `choiceTitle 24/28`, `counter 26/32`, `tierName 13/16`, `svgType.plateKg 20`. Nový typ `telemetry` (JetBrains Mono 11/16, verzálky, 0.2 em, tabulární). Kurogane tmavá paleta (base `#0B0B0C`, surface `#141416`, raised `#1C1C1F`, rule `#26262A`, text `#EDEDEF`, muted `#8A8A90`), monochromní ocelové kotouče, nový token `shadow` (stín uzlu a stínová strana kotouče, dřív zneužitý `onAccent`). Spacing doplněn o `xxxxl: 168`; radiusy `s 6`, `l 12`. Tokeny `size.tick/regMark/icon`, `stroke.icon/measure`.
- Nové komponenty: `components/ui/Telemetry.tsx`, `MeasureLine.tsx`, `RegMark.tsx`. TopBar přestavěn: streak (plamen v obrysu + číslo v `title`), telemetrie `XP: … · LIGA: …`, měřicí linka aktuální sekce jako dělítko hlavičky; vážený vlevo (pravý okraj `xl`).
- Akcent podle R42 pryč z mapy a primitiv: prstenec aktuálního uzlu, shock kruh odemčení, fajfky kotouče a bosse, plamen → `text`; primární `Button`/`RoundCta` → plná `text` plocha s tónem `inverse` (nový tón v `Text`); `DotLoader` výchozí barva `text`; navigační téma `primary` → `text`. `LessonCompleteScene`/`XpPop` beze změny.
- Rozhodl jsem sám: TierBadge kruh v TopBaru nahrazen hodnotou v telemetrii (R42 přebíjí §7.2); streak v `title` (32), ne v `display` — nejdůležitější na obrazovce je aktuální uzel, hlavička ho nesmí přehlušit; radius karet 12 (obrobený kov, ne bublina), pilulky a kruhy zůstávají `full`; `counter` zmenšen na 26, aby se pořadí „12“ vešlo do sloupce 32 pt v lize; `Stat` přepočítán pro Inter (lineHeight 1.05 em, optický inset 0.04/0.12 em — odhad); `TierBadge` (liga) dostal `adjustsFontSizeToFit`. Splash v `app.json` na `#0B0B0C`. Nové texty `copy.map.tier/sectionProgress/sectionProgressA11y`.
- Otevřené: akcent ještě zůstává mimo mapu (onboarding `ChoiceCard`/`PathCard` proužek a glyf, `DotSteps`, `TextField` a `dream.tsx` fokus, `HoldTimer` prstenec, `LeagueRow` proužek vlastního řádku, `birth.tsx` kruh, `OutfitTank` lem) — k rozhodnutí, zda R42 platí i tam. `RegMark` zatím nikde použitý (mapa nemá hero kartu). Optický inset a účaří jednotky ve `Stat`, kg na kotouči (Inter Light ~11 pt na 56pt kotouči) a „DIAMANT“ v `TierBadge` ověřit na screenshotu.

## 2026-10-02 · design-agent · R42 na onboarding, lekci a ligu
- Hotovo: ember (`accent`/`accentText`) pryč ze všeho mimo oslavu lekce (`LessonCompleteScene`/`XpPop` beze změny). Výběr karet (`ChoiceCard`, `PathCard`): proužek `stroke.focus` v `text` + glyf crossfade `muted → text` (dřív `text → accent`, animace beze změny). `DotSteps` aktuální pilulka v `text` (tvar nese stav). `TextField` a `dream.tsx` fokus: spodní linka 1 → `stroke.focus` v `text` (kompenzace `marginBottom`, aby layout neposkočil), kurzor `text`, výběr `muted`. `HoldTimer`: prstenec `text` na stopě `rule`, tloušťka `stroke.ring` 3 (dřív 6), konec `butt`, zarovnán vlevo. `LeagueRow` proužek v `text`. `birth.tsx` kruh v `text` (světelný objekt v černé). Počítadlo milníků při limitu `muted → text` (dřív akcent).
- Instrument vrstva: `MeasureLine` v `LessonProgress` (místo teček; `CVIK 02/05`, linka = odcvičený podíl) a v `OnboardingFrame` (`KROK 02/05`), jedna gramatika průběhu. `Telemetry` v lize (`KONEC TÝDNE: 3D 14H 22M`, karta výsledku `MINULÝ TÝDEN: 3. MÍSTO`). `RegMark` jen na hero kartách: panel siluety v `ExerciseCard`, karta výsledku ligy (odsazená `space.l`, aby `+` byly celé). Vzduch: karta cviku `gap xl` mezi siluetou a textem, onboarding nad titulkem `xxl`, hlavička ligy `paddingTop xl`.
- Tokeny: `stroke.focus 2`, `stroke.ring 3`, `mascot.tankRim #B4532A`; `stroke` exportován z `theme/index.ts`. `TierBadge` obrys `stroke.icon`. Copy: `onboarding.stepKey/stepValue/stepA11y`, `lesson.progressLabel/progressValue`, `league.lastWeekKey/placeUnit/lastWeekA11y` (NBSP u „z 5“, „3. místo“).
- Rozhodl jsem sám: **tílko Ember** (`OutfitTank`) nebere UI akcent, ale vlastní materiálovou barvu opice `mascot.tankRim` (pálená siena z rodiny srsti, tlumenější než ember, nesleduje sezónní přepis akcentu). Opice je jediný barevný objekt a tílko je její součást; kdyby lem zůstal na `c.accent`, objevil by se UI signál všude, kde opice stojí (mapa, liga), a rozmělnil by jedinečnost emberu v oslavě. Úplné odbarvení by zase zničilo identitu předmětu, který se jmenuje „Ember“. `DotSteps` po výměně za `MeasureLine` nikde nepoužitý, ponechán (bez akcentu) — smazat může boss. Zónové trojúhelníky v lize (`success`/`danger`) ponechány: jsou to stavové barvy, ne akcent. Ikona ✕ v lekci 24 → `size.icon` 20 (jako TopBar, hit 44 zůstává).
- Otevřené / ke screenshotu: kontrast `muted` glyfu nevybrané karty na `surface` (≥ 3:1 pro grafiku), čitelnost výběru karet bez barvy, prstenec 3 pt na 220 pt, odsazená karta výsledku ligy a `+` značky u siluety (přesah 4 pt do okraje ScrollView), `KROK`/`CVIK` linka na 320 pt šířce. Motion: prasknutí kruhu ve `birth.tsx` je teď světlé místo emberu — motion-agent posoudí, zda záblesk není moc ostrý.

## 2026-10-02 · design-agent · Task 27–29 (Progres, Profil, Šatník, Nastavení)
- Hotovo: `app/(tabs)/progress.tsx` + `components/progress/{ActivityGrid,DreamBodyCard,MilestoneRow,MilestoneSheet,NumberSheet,WeightChart}.tsx`; `app/(tabs)/profile.tsx` + `components/cosmetics/{ProfileFrame,CosmeticTile,SourceBadge}.tsx`; `app/wardrobe.tsx`; `app/settings.tsx` + `components/ui/Toggle.tsx`. Copy `copy.progress/wardrobe/profile`. Tokeny: `size.meter/chartHeight/chartAxis/chartPoint/chartPointLast/chartPointRing/toggleWidth/toggleHeight/toggleKnob/slotSegment/wardrobePreview/tileMascot/frameRing/badgeIcon`, `stroke.chart`, `svgType.axis`, `dash.target`, `opacity.locked/disabled` (export z `theme/index.ts`).
- R42 místo akcentu: dnešek v mřížce = obrys `text` 2 pt; splněný milník = plná stopa + Check + „Splněno.“; poslední bod grafu = větší plný bod + obrysový prstenec; cílová linie přerušovaná `muted`; nasazená dlaždice = obrys `text` 2 pt (+ štítek NASAZENO místo SourceBadge); Toggle zapnutý = stopa `text`, knoflík `base`. Ember rám (`frame-ember-ring`) = materiál `mascot.tankRim` (stejná logika jako tílko Ember). Zlatá `seasonGold` jen na sezónním SourceBadge a na odznacích v profilu (prestiž, §7.8).
- Rozhodl jsem sám: vlastní `ActivityGrid` (ne `DotGrid`, souběh) s hlavičkou PO–NE. Mřížka nad milníky, graf až pod nimi; nad grafem `Stat` posledního zápisu a telemetrie `CÍL`. Celebrate overlay bez nové kosmetiky zmizí po 1.8 s, s kosmetikou čeká na tap (odkaz do Šatníku by jinak utekl). Binární milník (`done`) nemá pole, jen tlačítko „Označit jako splněné“/„Vrátit“. Milník kg přijímá jedno desetinné místo. Šatník: tap na odemčenou položku nasadí/sundá, na shop položku potvrzení nákupu a po koupi rovnou nasadí; `insufficient` ukáže větu místo dialogu; zamčená milníková/sezónní položka je neaktivní. Náhled položek na dlaždici: opice s položkou (oblečení, doplněk), mini rám, vzorek mapy, Lucide `Sparkles`/`Cloud` pro efekt. Název sezóny pro SourceBadge přes `useSeasonStatus` (jen když id sedí, jinak „sezóny“). Nastavení: emoji ze `copy.notifications` se v UI nezobrazuje (jen v systémové notifikaci); stepper hodiny je neaktivní, když je připomínka vypnutá; test tlačítko jen při `granted`.
- Otevřené / ke kontrole: typed routes `/wardrobe` a `/settings` (nové soubory, vygenerovat typy spuštěním dev serveru), `ErrorState`/`DotLoaderScreen` uvnitř `Screen` v modalech (zdvojený safe-area inset při chybě), Toggle bez animace (motion-agent), náhled opice v Šatníku bez poskoku `happy` (motion), `CosmeticTile` u `map-*` a `fx-*` ověřit na screenshotu, popisek `CÍL 78 KG` při cíli u horní hrany grafu, zalomení SegmentedControl 5 slotů (520 pt, horizontální scroll). `MapBackground`/`LessonEffect` nedělány (zadání).

## 2026-10-02 · design-agent · Task 24–26 (Sezóna, cíl, recap, stage-up)
- Hotovo: `app/(tabs)/season.tsx` (loading/error/žádná sezóna/bez cíle → Lock in/s cílem/po konci → „Tvůj recap“), `app/season-goal.tsx` (2×2 dlaždice typů, pole s chybou z `validateSeasonGoal`, milníky z profilu jen reps/seconds + vlastní, `router.back()` po uložení), `app/season-recap.tsx` (4–5 slidů, tap levá třetina zpět / zbytek dál, swipe > 44 pt, MeasureLine `RECAP 02/05`, šipky 44 pt pro čtečku, Převzít → Převzato + haptika, Sdílet → Alert / web `alert`), `app/stage-up.tsx` (neplatné parametry → `dismissTo('/(tabs)')`, sekvence §7.4, CTA po 1.5 s, reduce motion = fade 200 ms). Komponenty `components/season/{SeasonHeader,SeasonGoalCard,SeasonDays,ComebackCard,RewardCard,SeasonBadge,RecapSlide,format}`, `components/ui/{DotGrid,ProgressBar}`. Copy `copy.season`, `copy.recap`, `copy.stageUp`. Tokeny `size.dot 10/dotGap 6/seasonBadge 56/seasonBadgeLarge 88/shard 12` (ProgressBar sdílí `size.meter`).
- Akcentová plocha: `Button`, `RoundCta`/`BigActionBar` (přes `CtaAction.onAccent`), `MeasureLine` a `Stat` (tón `onAccent` přebarví i štítek a jednotku) dostaly variantu `onAccent`: primární = plocha `onAccent` s popiskem v `accent` (pár s testovaným kontrastem), sekundární/neaktivní = obrys `onAccent`. Bez ní by na emberu zůstal `text`/`muted` s kontrastem < 3:1.
- Rozhodl jsem sám: `DotGrid` stav **`today`** místo plánovaného `accent` (R42): prstenec `text` 2 pt s jádrem; `soft` = plná `muted`, `outline` = obrys `muted`, budoucí = třetinová tečka `rule` (rastr, ne stav). Vedle mřížky legenda v telemetrii. Hierarchie tabu: Stat progresu L (88) > odpočet v hlavičce M (56). Odpočet bez cíle počítá obrazovka z `diffDays` stejně jako ruling 11. Typ cíle je telemetrie nad číslem, ne nadpis. Comeback: okno jako telemetrie s daty; nedosažitelný cíl = věta „nestihneš… počítá se do recapu“, nikdy „prohráno“. Odznak sezóny = kruh se `seasonGold` lemem a iniciálami; na emberu lem `onAccent`. Váha v cíli: směr Shodit/Nabrat (předvolba z `weightGoal`), hodnota s čárkou; nečíselný vstup jde jako NaN do `validateSeasonGoal` (jediný zdroj rozsahů). Vlastní milník drží původní `start`, když se nemění název. Recap: obří údaj Stat XL vlevo; růst opice = dvě opice M na střed (výjimka §6.8); odměna = opice L celebrate v šále + velký odznak, ember plošně jen při splnění. Stage-up: kruh r = 0.35 × XL/2 kolem smrštěné opice, 8 úlomků z obvodu, text pod opicí vlevo.
- Otevřené / ke kontrole: motion-agent — sekvence stage-up (časy jsou z plánu, konstanty lokálně v souboru), přechody slidů recapu (teď bez animace), count-up Statu, vjezd karty po Lock in. Screenshoty dark/light: tab bez cíle / s cílem / nedosažitelný / po konci, modal cíle na 320 pt (dlaždice 2×2), všechny slidy recapu, 3 snímky stage-up. Opice XL (280) ve stage-up na 320 pt displeji přesahuje sloupec obsahu o ~8 pt (centrovaná, ořez nehrozí). typecheck/lint/test jsem nespouštěl (bez shellu).

## 2026-10-02 · motion-agent · fáze 3 (oslava, stage-up, recap, sezóna, progres, šatník, toggle, birth)
- Hotovo:
  - **Oslava lekce:** ember přichází jako událost. Do dopadu je scéna monochromní; v rámu dotyku (callback konce pádu na UI vlákně, stejný snímek jako Heavy haptika a `plate-snap`) se přilétající kotouč rozžhaví emberem (`heat` 0 → 0.85 hned, chladne 640 ms ease.out do oceli), +XP v emberu barvu převezme o 120 ms později. Časová osa v `lib/motion.ts` jako `celebration` (launch 250, leftLag 60, xp +120, cheer + Success +480, title +760, CTA +1000 od dopadu). Reduced: žádný žár (byl by to puls), kotouč se prolne 200 ms, +XP fade.
  - **Stage-up:** konstanty do `lib/motion.ts` (`stageUp`). Smrštění 300–600 ms (plán 380 → 300, aby se vešel nádech), nádech kruhu i opice ×0.92 600–700 (ease.press), prasknutí 700 (kruh → 1.4 + fade 420 ms punch, 8 úlomků), nová opice 720 `motion.pop` + Success, text 1300 fade `motion.ui`, CTA 1500. Reduced se rozhodne jednou při vstupu.
  - **Recap:** nový slide nastoupí ve směru listování (posun 24 pt + fade, timing 200 ms ease.out, bez pružiny), první slide bez nástupu; plocha base ↔ ember se prolne 200 ms (`interpolateColor`). Reduced: jen fade 200 ms.
  - **Sezóna:** `hooks/useCountUp.ts` (čistě motion hook) — Stat progresu napočítá 0 → hodnota 400 ms při prvním zobrazení (a11y label nese vždy konečnou hodnotu). Karta cíle vjede (`enterSafe`: FadeInDown 16 pt, 260 ms punch; reduced fade 200 ms) jen při přechodu „bez cíle → s cílem“. Dnešní tečka nepulzuje (ověřeno).
  - **Progres:** overlay milníku se prolne (in 200 / out 150 ms), opice dosedne pružinou `motion.settle` ze 0.6, pak své celebrate poskoky. Reduced: jen fade.
  - **Šatník:** po nasazení položky opice v náhledu jednou poskočí (`happy` na `hopMs()` + 200 ms, pak idle). Sundání bez poskoku.
  - **Toggle:** knoflík translateX + barvy stopy/knoflíku interpolací, 180 ms timing ease.out (`motion.toggle`); reduced = okamžitě.
  - **Birth:** světlý kruh při prasknutí dohasíná souběžně s otevřením díry (220 ms ease.out) místo tvrdého střihu; odstraní ostrý světlý obrys na OLED černé. Inflace beze změny.
  - `lib/motion.ts`: `motion.calmFade/toggle/slide/slideShift/countFirstMs`, `celebration`, `stageUp`, `hopMs()`, `enterSafe()`.
- Rozhodl jsem sám: ember v oslavě = žár kotouče (fyzický význam: kotouč „vydřený“), ne nový prvek; stage-up zůstává celý v emberu od začátku (navazuje na ember konec oslavy, je to odvozená oslava). Stage-up smrštění zkráceno na 300 ms kvůli nádechu.
- Ověřeno: `npm test` 391/391, typecheck a lint čisté. Snímky `.superpowers/sdd/2026-09-29-opice-faze1-core-loop/shots/demo-f3/` (flow `flows/demo-f3.mjs`, `REDUCED=1` pro reduced, `demo-f3-ui.mjs`).
- Otevřené / K ruční kontrole: synchron haptiky a zvuku s rámem dopadu na zařízení (expo-audio latence); rozpis XP („… STREAK +14“) se během slamu 1.2× ořízne o pravý okraj a +XP s 3 ciframi se blíží opici (layout, design-agent); count-up běží na JS vlákně (slabší Android); Toggle v Nastavení na webu byl neaktivní (bez povolení notifikací), animaci jsem vizuálně neověřil; birth jsem nefotil.

## 2026-10-02 · qa-agent · Demo fáze 4, kolo 1
- Hotovo: test/typecheck/lint/expo-doctor zelené, boundary grep čistý; Playwright průchod celé appky ve 4 viewportech (320/375/390/430) × light/dark, všech 7 akcí dev menu, aria snapshoty, dvojí tapy. Report `docs/QA.md` (Demo fáze 4, kolo 1), snímky `shots/demo-f4/`, flowy `tools/flows/qa-f4*.mjs`, harness `tools/shoot-vp.mjs`.
- Opravil jsem: zdvojený safe-area u `ErrorState` v tabech (prop `edges`), plochu „Zpět“ v dev menu na 44 pt.
- Verdikt NESCHVÁLENO. Otevřené: dvojí tap na „Pokračovat“ v oslavě propadne na tab Sezóna; liga odroluje hlavičku; oslava a tab bar na 320 pt (překryvy, ořezy); drobnosti v QA.md.

## 2026-10-02 · design-agent · Demo fáze 4, kolo 1 (bugy 2, 3, 4, 5, 6, 8, 9)
- Hotovo:
  - **2 Liga:** hlavička (odznak, pozice, XP, odpočet, věta prázdného týdne) vyjmuta z `ListHeaderComponent` nad FlatList (sticky, spodní vlasová linka `rule`). Auto-scroll na vlastní řádek zůstal (viewPosition 0.5), ale roluje už jen tabulka. `app/(tabs)/league.tsx`.
  - **3 Oslava:** opice už není absolutně přes číslo; `XpPop` má řádek číslo | opice v toku a rozpis pod ním přes celou šířku. `xpPopFit()` volí z konečné hodnoty (počet cifer + „+“), šířky obsahu a slamu 1.2 kombinaci Stat XL/L/M × opice M/S (pořadí: XL+M, L+M, XL+S, L+S, M+S). Odhad šířky glyfu je token `glyph.displayDigit` 0.62 em (+ `glyph.statUnit` 32 pt). Rozpis se zalamuje jen mezi položkami (nezlomitelné mezery uvnitř „první dnes +10“). Na < 375 pt titulek `title` místo `display` a těsnější rytmus (l/m místo xl). Časování nedotčeno.
  - **9 CTA:** ponechána asymetrie vpravo. Všechny BigActionBar obrazovky (lekce, onboarding, cíl sezóny, stage-up) mají CTA v pravé buňce s prázdnou/vedlejší levou: oslava je tím konzistentní, pravá polovina je zóna palce a prázdná levá buňka je záměrný rytmus R42 (ref. 3). Plná šířka jen tady by rozbila systém.
  - **4 320 pt:** token `breakpoint.compact` 375 + hook `useCompact()` v `theme/`. Tab bar pod zlomem `type.tabLabelCompact` (mono 10, rozpal 0.05 em, „TRÉNINK“ ≈ 46 pt v buňce 64). Popisky zůstávají (ikony samotné by u Sezóna/Progres byly nejednoznačné). Název sezóny pod zlomem `title` (adjustsFontSizeToFit na webu nefunguje).
  - **5 Telemetrie:** `copy.dev.offsetValue` s  ; `Telemetry` spojuje klíč–hodnotu–jednotku nezlomitelnou mezerou, zalamuje se jen mezi položkami (platí pro celou appku).
  - **6 A11y ligy:** `MascotProps.decorative` (skryje opici pro čtečku vč. `aria-hidden`); v `LeagueRow` opice dekorativní, wrapper navíc skrytý. `ZoneDivider` už není `header` (jediný nadpis tabu je „LIGA“).
  - **8 Recap Odměna:** opice nese `equipped` z `useProfile()`, při splnění přes slot outfit šálu odměny.
- Otevřené / K ruční kontrole: snímky 320/375/430 oslavy s 2 a 3 ciframi (odhad 0.62 em ověřit proti renderu; na 375 se pro dvojciferné XP volí L + opice S, na 430 L + M). Opice v oslavě je teď uvnitř accessible kontejneru +XP (čte se label +XP, opice samostatně ne). Web sloučení řádku ligy (`accessible` na Animated.View) dál k ověření. Bug 1 (dvojí tap) je bossův. typecheck/test nespuštěny (bez shellu); `celebration.test.ts` beze změny, `xpBreakdownLabel` nezměněn.

## 2026-10-02 · motion-agent · orchestrace obrazovek (brag)
- Hotovo: na každé obrazovce je jeden řízený sled. Časy jsou v `lib/motion.ts` → `intro`. Primitiva v `components/ui/choreo.tsx`: `useFirstShow(key)` (sled jen při prvním zobrazení v relaci), `useReveal` a `Reveal` (fade + zdvih, timing, reduced = 200 ms fade). Animace běží na shared values. setState za snímek mají jen count-upy (`useCountUp` má nově `delayMs` a `enabled`).
  - **Mapa:** streak 0 ms (count-up 600) → telemetrie 70 ms (XP count-up) → linka sekce se natáhne 140 ms (520 ms ease.out) → kotouče od 220 ms po 55 ms (okno 6 uzlů nad aktuálním): pád 28 pt a dosednutí pružinou `motion.settle`. Uzly pod aktuálním se jen prolnou. Opice přijde poslední, 180 ms po aktuálním uzlu, s pádem 20 pt (`settle`). Úvodní scroll je při sledu bez animace. Sled se nehraje přes odemykací sekvenci.
  - **MeasureLine:** prošlý úsek je shared value (`drawFrom/drawDelay/drawMs`). Změny se posouvají 260 ms punch: lekce, onboarding (dotažení z předchozího kroku po 220 ms) a cíl sezóny (souběžně s count-upem 400 ms).
  - **Lekce:** uvnitř karty běží sled silueta → název → množství → popis po 50 ms (zdvih 10). Start výdrže = nádech 0.97 (press 90 / release 220) a „připraven“ zmizí 150 ms.
  - **Liga:** hlavička + XP count-up, řádky po 45 ms. Vlastní řádek přijde poslední (360 + 140 ms, zdvih 16) a pak mu vyroste proužek (scaleY, 260 ms). Oddělovače zón jdou ve sledu.
  - **Progres:** sekce po 70 ms. Mřížka se vyplní po dnech (po 12 ms, 180 ms, scale 0.6 → 1). Lišty milníků se natáhnou (od 260 ms, po 70 ms, 520 ms). Graf váhy se vykreslí čarou (380 ms, 900 ms ease.out), body naskočí, když je čára mine, a prstenec posledního bodu se rozevře.
  - **Profil:** rám 0.88 → 1 (520 ms punch), opice v něm `settle` z 0.85, XP count-up 700 ms od 160 ms, pak bloky po 70 ms. **Sezóna:** hlavička, pak obsah o 140 ms později.
  - **Modaly** (hrají při každém otevření): Šatník (náhled → přepínač → dlaždice po 35 ms; změna slotu přehraje jen mřížku po 30 ms, `motion.ui`; dlaždice má stisk 0.97 a obrys nasazení se prolne). Nastavení (řádky po 50 ms, stisk stepperu 0.92). Cíl sezóny (hlavička → dlaždice 2×2; proužek výběru scaleY; jádro radia 0.4 → 1; pole hodnoty při změně typu). Dev (skupiny po 50 ms).
  - **lib/sound.ts:** expo-audio na webu volá `media.play()` bez `.catch`, takže vzniká unhandled rejection (pageerror). Na webu je zvuk proto vypnutý, nativ beze změny.
- Rozhodl jsem sám: pružiny mají jen kotouče, opice a rám profilu (opice). Text, řádky a dlaždice jedou timingem. Modaly hrají sled při každém otevření, taby jen poprvé.
- Ověřeno: test 391/391, typecheck a lint čisté. Snímky jsou v `shots/motion-brag/` (light normální, dark-rm reduced). Flow `tools/flows/motion-brag.mjs`. Bez pageerror.
- K ruční kontrole: na webu v dev režimu se sledy po studeném načtení zpožďují (JS vlákno). Plynulost okna 6 kotoučů je potřeba ověřit na slabším Androidu. Count-upy běží na JS vlákně. Prstenec sezóny/hodnota cíle pomocí `Reveal` remountuje TextField při změně typu, takže se ztratí fokus.

## qa-agent · Demo fáze 4, kolo 2 (2026-10-02)
- Test/typecheck/lint zelené. Bugy 2, 4, 5, 6, 7 opravené; 3 až na zalomení rozpisu XP. Motion orchestrace bez neviditelných prvků, návrat na tab nepřehrává, reduce motion okamžitě, žádný pageerror.
- Otevřené: bug 1 (dvojí tap po dismissTo propadá do tab baru → Sezóna, i ze stage-upu) — boss; nový bug 10 (ořez TVOJE XP v lize na 320) — design-agent.
- Nic jsem neopravoval. Verdikt NESCHVÁLENO.

## 2026-10-02 · boss · Demo: opravy po QA kole 2 a ratingu kola 1
- **Hotovo:**
  - bug 1: guard proti propadnutí druhého tapu do tab baru. `lib/navGuard.ts` (600 ms), `markNavigation()` v oslavě (`app/lesson/[id].tsx`) a ve stage-upu, `screenListeners.tabPress` v `app/(tabs)/_layout.tsx`. Ověřeno Playwrightem na 320×568: dva tapy 120 ms po sobě skončí v obou případech na mapě.
  - bug 10: hlavička ligy na kompaktním displeji. Pozice je Stat M, mezery užší a řádek se zalamuje, takže čtyřciferné XP spadne pod pozici a neořízne se.
- **Rozhodl sám:**
  - Rozpis XP v oslavě se na 320 pt zalamuje mezi položkami. Je to záměr design-agenta, ne bug.
  - Video (Remotion) uživatel nechce. Zůstává jen kostra v `video/`, appka na ní nezávisí.
- **Otevřené:** dvojtap, haptika a zvuk na fyzickém zařízení, VoiceOver a TalkBack (K ruční kontrole).

- qa-agent (demo f4, kolo 3): ověřen bug 1 (dvojtap na oslavě i stage-upu končí na mapě, 320 i 390, dark) a bug 10 (4ciferné XP v lize na 320 pt bez ořezu). Testy/typecheck/lint zelené. Přidán flow `tools/flows/bug10.mjs`. Verdikt SCHVÁLENO. Otevřené: nic.

## 2026-10-03 · motion-agent · R43 figura oslavy
- **Hotovo:** `components/lesson/GoldenFigure.tsx` (kružnice R, R/φ, R/φ², R/φ³ přes `PLATE_R/PLATE_HUB/PLATE_HOLE`, zlatá spirála z 5 čtvrtkruhů s limitou ve středu pravého kotouče, obrys zlatého obdélníku R·φ × R; vlasová linka 1 pt `c.rule`, bez výplně, pointerEvents none, skrytá čtečce). Zapojeno v `LessonCompleteScene` za osou (v rámci rozkmitu osy). Start v `onImpact`: strokeDashoffset 600 ms `ease.out`, kružnice od nejmenší s odstupem 60 ms, spirála současně; calm = jen fade `motion.calmFade` (200 ms). Test `components/lesson/__tests__/GoldenFigure.test.tsx`.
- **Rozhodl sám:** R = (šířka obsahu)/φ/2 (průměr největší kružnice = šířka/φ), na 320 pt ještě /φ, aby figura zůstala v pásu činky. Plátno figury přesahuje rodiče o R·φ (bez ořezu na Androidu), ořez dělá kořen scény. Obrys obdélníku je kreslený hned (nedokresluje se), viditelný až s fade/dopadem. Test mockuje `lucide-react-native` (Plate.tsx tahá ESM ikony).
- **Otevřené:** vizuální kontrola na zařízení (390 i 320 pt, dark/light), zda vlasové linky nekolidují s XP pod osou; obdélník je posunutý podle limity spirály, ne symetricky k ose (K ruční kontrole).

## 2026-10-03 · design-agent · R43 Chalk & Iron sweep
- **Hotovo:**
  - Rozpočty na 320 pt přepočítány pro φ stupně. Všechny Stat stupně (53/87/110) a `display` 42 jsou menší než dřív, takže nic neroste; rostou jen `title` 32 → 33, `choiceTitle` 24 → 26 a `displayXL` 104 → 110 (nikde v UI přímo nepoužitý). Ověřeno: liga compact (TierBadge 72 + Stat M „12 / 20“ ≈ 102 pt se vejde, XP dál zalamuje), LeagueRow (`counter` 26 „12“ ≈ 31 pt ve sloupci 40), XpPop (`xpPopFit` počítá z tokenů: „+20 XP“ na 320 pt padne na M + opice S, jako dřív), SeasonHeader compact (`title` 33 „WINTER ARC“ ≈ 205 pt < 272), SeasonBadge (rozpočet doplněn do komentáře), kotouč 56 pt (kg 11 pt mezi lemem 40 a nábojem 18.3, účaří 30 ve viewBoxu).
  - Zastaralé komentáře opraveny: LeagueRow (Bebas, sloupec 32 → `counter` 26 / `rankCol` 40), TierBadge (Bebas → Inter Light 13), SeasonBadge, Barbell, stage-up, season-recap, birth, DotSteps (ember → akcent / IWF červená).
  - Natvrdo `borderWidth: 2` → `stroke.focus` (PulseRing, ShockRing v `PlateNode`, BossPulse v `BarbellBoss`); pilulka RoundCta 64 → `space.xxl`.
  - SPEC §6.1–6.6 a 6.8 přepsán na Chalk & Iron + R43, nová §6.9 Posvátná geometrie (figura oslavy).
- **Rozhodl sám:**
  - RoundCta kruh 88 nechávám (ne φ 87): spec §6.6 a rozpočet popisku 7 znaků; φ by ubral 1 pt bez přínosu.
  - Slop audit: žádný prvek nemá stín + linku + pozadí zároveň (stíny v UI nejsou vůbec, tab bar má jen linku), karty se oddělují jen pozadím, výběr proužkem. RegMark nad kartou Sezóny ponechán — je to registrační značka bloku (instrument vrstva), ne druhé oddělení. Nic dalšího jsem neodstraňoval.
  - Akcent ověřen: `c.accent`/`tone="accent"` jen v XpPop + žáru kotouče (oslava lekce), stage-up a recapu; Button/RoundCta/MeasureLine/BigActionBar ho berou jen přes `onAccent` větev oslav.
  - Materiálové rx 2–3 v `Barbell` a velikosti uzlů 56–80 nechány: fyzický tvar, ne UI škála (viz SPEC §6.6).
- **Chyby v souborech bosse (needitováno, jen popis):**
  - `theme/tokens.ts`: komentář u `size` „sloupec pořadí 32“ neodpovídá `rankCol: 40`; komentář u `counter` „vejde se do sloupce pořadí 32 pt“ taky (sloupec je 40); komentáře u `type`/`svgType.plateKg` srovnávají s Bebas (historické, ne chyba hodnot); `mascot.tankRim` komentář „R42: ember jen v oslavě lekce“ → dnes akcent IWF červená.
  - `components/map/Plate.tsx`: zámek `strokeWidth={1.5}` a obrys `strokeWidth={2}` natvrdo (mají být `stroke.icon` / `stroke.focus`).
  - Chybí tokeny `size.roundCta` (88) a `size.ctaPill` (64) — RoundCta drží 88 v lokální konstantě.
- **Otevřené (K ruční kontrole):** krok mapy 104 s uzlem 80 + pulzující prstenec (scale 1.08) nechává ~16 pt mezi sousedy — zkontrolovat na zařízení, že se prstenec nedotýká dalšího kotouče; účaří kg 30 je 1.7 jednotky nad nábojem 18.3 (těsné, ověřit na 56 pt kotouči v light); SeasonBadge se 3 iniciálami na webu (adjustsFontSizeToFit nefunguje).

## 2026-10-03 · qa-agent · R43 kolo 1

**Verdikt: SCHVÁLENO** (s položkami k ruční kontrole).

- tsc čisté, jest 47 sad / 395 testů zelených (+1 nový), eslint na změněných souborech bez chyb.
- Palety: `theme/palettes.ts` = SPEC §6.2 do posledního hexu (dark i light). Kontrastní testy pokrývají text/muted/accentText/danger × base/surface/raised, onAccent/accent, seasonGold, success/danger ≥ 3:1, inkOn na všech 5 kotoučích. Staré hexy (#FF6B35, #0B0B0C, #131316, #EFEEEA, #0E0D0C) v kódu, app.json ani SPEC nejsou; zůstávají jen v archivních briefech `.superpowers/sdd/2026-09-29-*` (historie, neměněno) a jako zmínka „nahrazen“ v SPEC §6.8.
- φ tokeny: typová škála 20·26·33·42·53·68·87·110, statSize 53/87/110, radius 5/8, krok `space.xxxl` 104, amplituda w/φ³ (max 120) — kód, komentáře i SPEC §6.4–6.6 sedí.
- Kotouč (viewBox 100): lem vrchol y = 10 (+0.6 tah), čísla kg 20 j., účaří 30, horní dotah ≈ 15.5 → u „25“ (x 38–62) lem v rohu y ≈ 11.8, mezera ≈ 3.7. Náboj vrchol 50 − 18.3 = 31.7 (− 0.6 tah = 31.1), účaří 30 → mezera ≈ 1.1 j. Nekoliduje, ale je těsné (K ruční kontrole).
- Pulz prstence: uzel 80, prstenec 94 × 1.08 = 101.5 → poloměr 50.8; + soused 40 = 90.8 < krok 104 (rezerva 13). Boss (+24 posun, půlvýška 44): 94.8 < 128. Doplněn test v `logic/__tests__/geometry.test.ts`.
- GoldenFigure: střed = střed pravého kotouče (contentWidth/2 + flying.offset + w/2, cy AXIS.mid), poloměry R, R/φ, R/φ², R/φ³ (= proporce Plate), spirála konverguje do středu (test). Start jen v `onImpact` (setFigureDrawn, guard `impacted`). Calm cesta: fade `motion.calmFade`, dashoffset 0. Pod osou (render před Barbell), `pointerEvents none`, a11y skrytá, barva jen `c.rule`, žádný akcent ani hardcoded barva.
- Compact 320: contentWidth 272 → R = 272/φ/2/φ ≈ 51.9 → svisle 90 ± 52 = 38…142, celé uvnitř pásu činky 0…180 → titulek ani XP nepřekrývá. Spirálový obdélník (84 × 52) má výšku R, také uvnitř.
- Akcent: jen Barbell heat (oslava), XpPop, stage-up, season-recap a `onAccent` varianty Button/RoundCta (používané na akcentních plochách). OK.

**Drobnosti (neopraveno, neblokuje):**
- GoldenFigure při unmountu explicitně neruší `withTiming` (cancelAnimation). Reanimated je při uvolnění shared values zahodí, únik nevzniká; motion-agent může doplnit pro konzistenci s PlateNode.
- Necompact šířky: R = contentWidth/φ/2 (390 pt → 105.7) přesahuje pás činky 180 o ≈ 16 nahoru i dolů. Dolů kryje marginBottom 40; nahoru závisí na volném místě ve flex středu (design-agent, K ruční kontrole na 375 × 667).

**K ruční kontrole (zařízení):**
1. Oslava na 375 × 667 a 390 × 844: horní kružnice figury nesahá do titulku; vlasové linky `rule` jsou čitelné, ne rušivé, v dark i light.
2. Android: figura s negativním absolutním odsazením se nevykreslí oříznutá rodičem.
3. Kotouč 25 kg v obou režimech: číslo kg vizuálně nedotýká náboje (mezera ≈ 1 j. viewBoxu).
4. Reduce motion: figura jen prolne, bez dokreslování.
5. Pulz aktuálního uzlu u kotouče 80 vedle souseda — opticky rezerva.

## 2026-10-03 · boss · R43 Chalk & Iron + posvátná geometrie
- Zadání uživatele: méně „AI slop“, studium barev, směr 1 Chalk & Iron, „holy geometry“ varianta C, light režim A. Spec `docs/superpowers/specs/2026-10-03-chalk-iron-geometry-design.md`.
- Základ: `theme/palettes.ts` přepočítané v OKLCH (železo h 65°, křída h 95°, rovnoměrné ΔL; akcent = IWF červená 25kg kotouče `#EF3E31`), `PHI` a φ typová škála 16·√φⁿ, statSize 53/87/110, radius 5/8, `stroke.plate/check/hairline`; `Plate` náboj R/φ², otvor R/φ³; mapa krok `space.xxxl` (104), amplituda w/φ³; `app.json` pozadí `#100E0D`; testy s pevnými hexy aktualizované.
- Opravy po QA kolo 1: `GoldenFigure` ruší animace při unmountu (`cancelAnimation`); poloměr figury `min(šířka/φ/2, AXIS.mid)`, aby na 390 pt nesahala nad pás činky k titulku; účaří kg na kotouči z y 30 na 29 (víc vzduchu nad nábojem, hodnoty v QA záznamu jsou pro 30).
- Opravy po rating kolo 1: natvrdo tloušťky v `Plate`, `GoldenFigure`, `ExerciseSilhouette` → `stroke` tokeny; README bez „ember“.
- Otevřené: vizuální kontrola na zařízení (viz K ruční kontrole v QA a RATING).

## 2026-10-03 · design-agent · DRAFT spec Teplá litina
- Napsán draft `docs/superpowers/specs/2026-10-03-tepla-litina-redesign-design.md` (jen dokument, žádný kód): paleta dark/light s kontrasty, typová škála, komponenty, 5 obrazovek s prázdnými stavy, denní cíl + připomínka, 3 varianty opičky, mapování na kód.
- Rozhodl sám: liga pro nového uživatele zamčená („Odemkne se po první lekci“ + 3 ghost řádky), ne top 3 + vlastní řádek; nový token `faint` #6E665D pro ghost data a zamčené prvky; tab bar label Inter 600 11 sentence case (ruší kompaktní variantu); aktivní tab = 4 pt akcentová tečka; prstenec aktuálního uzlu v akcentu; opička sedí na kotouči; Profil maskot M 96 + stat grid 2×2; legenda dnů 2×2 rozlišená tvarem; RegMark/Telemetry/MeasureLine pryč z hlavních obrazovek.
- Otevřené: zdroj modrého ozubeného kola (v kódu tabů nenalezen, potřeba screenshot); `seasonGold` vs. jantar; přepis SPEC §6 a zrušení R43 „akcent jen v oslavě“; denní cíl chybí v SPEC (logika boss); odhad minut lekce v `data/`; emoji v notifikaci; render kontrola palety.

## motion-agent – DRAFT spec pohybu, haptiky a zvuku (2026-10-03)
- Napsán dokument `docs/superpowers/specs/2026-10-03-motion-haptics-sound-design.md` (bez kódu v repu).
- Rozhodl sám: pružiny Kotouč/Šál/Cvak a mapování na `lib/motion.ts` (`seat` ponechán jako výjimka ζ 0.55); `error` haptika nikde; CTA oslavy 1000 → 2000 ms se skipem; nové stavy `curious/focused/sleeping`; strop 8 XP ticků; `play(id)` s Expo Go aproximací AHAP.
- Otevřené: pořadí rigid/heavy u dopadu (AHAP vs. scénář), výroba zvuků ring/gong/tick, implementace `logic/mascotMood.ts` (boss), barva jantaru podle spec „Teplá litina“.

## qa-agent: recenze draftu Teplá litina (2026-10-03)
- Jen čtení, kód ani spec neměněny. Kontrasty přepočítány: light `faint` 2.0:1 (draft 3.0), light jantar jako výplň/progress 1.8:1 na base, light `accentText` 4.25:1 na surface; několik dark hodnot uvedeno výš, než vychází.
- Data: chybí délka lekce (min), katalog odznaků (14) i flag přerušeného streaku; boss se odemyká po 8 lekcích, ne po 6.
- Otevřené: opravit kontrasty a čísla v draftu, rozhodnout odchylky od SPEC (liga zamčená, opička na kotouči, denní cíl, profil M).

## qa-agent — recenze DRAFT motion/haptics/sound spec (2026-10-03)
- Jen čtení, kód ani spec neměněny. API ověřena v node_modules (reanimated 4.5.1, worklets 0.10.1, expo-haptics 57.0.3, expo-audio 57.0.5): existují.
- Hlavní nálezy: chybí implementace skipu/AppState v LessonCompleteScene; `tapLight` není v FeedbackId; XpPop count-up běží přes setState+rAF (JS re-rendery); ±10 ms z JS setTimeout nereálné; tichý režim vs. haptika jako primární kanál neřešen pro `duckOthers` přepínání; AHAP posun t=0 dle rozhodnutí bosse.
- Otevřené: měření na iPhone SE, zvuky ring/gong/tick neexistují.

## design-agent — recenze DRAFT motion spec vůči Teplé litině (2026-10-03)
- Jen čtení, spec ani kód neměněny.
- Hlavní nálezy: nekonečný jantarový glow aktivního uzlu porušuje „jantar vzácný“; konfety ze 70 % jantarové působí jako párty; token `textMuted` neexistuje (je `muted`); stín na řádku ligy a shimmer jdou proti pravidlům vizuální spec; stisk tlačítka je definovaný dvakrát (2 pt vs. světlejší výplň); scéna oslavy nemá sloty pro Denní cíl a kartu připomínky.
- Otevřené: barvy ringu, jisker a shock kruhu jako tokeny (`celebrate.*`), rozhodnutí bosse o konfetách.

## motion-agent – recenze vizuální spec „Teplá litina“ vs. motion spec (2026-10-03)
- Jen čtení, bez změn kódu. 10 nálezů předáno bossovi (glow aktivního uzlu chybí ve vizuálu, dvojí dech opičky na kotouči, přeskok opičky mezi uzly, done uzel bez prstence pro trim, tečka tabu bez pohybu, sheet s kolečkem chybí ve vizuálu, `textMuted` → `muted`, scrim 0.76 vs dim 0.6, celebrate vs. kývnutí v oslavě (a), konfety jantar na jantarové ploše stage-up).
- Otevřené: rozhodnutí bosse k nálezům 1–3 a 6.

## motion-agent – motion/haptics/sound spec kolo 2 (2026-10-03)
- Přepsán jen `docs/superpowers/specs/2026-10-03-motion-haptics-sound-design.md` (sekce „Změny v kole 2“). Kód beze změn.
- Zapracováno: série = činka s kotouči (plamen a jiskry pryč, nový moment nacvaknutí kotouče série), AHAP/APPROX t=0 = dopad, oslava (a) s CTA v 1200 ms a řádkem „Zítra“, redukce haptiky, konfety v litinových tónech, nálady MVP idle/celebrate/sad, nálezy QA (sync ±1 snímek přes UI vlákno, idempotentní skipToEnd, jediný aktivní vzor, ducking, nezávislé přepínače, perfTier při startu, lokální chyba XP), nálezy review (opička jako sourozenec, přeskok, odemčení, fajfka, tečka tabu, prázdná liga/progres).
- Rozhodl sám: kotouč série v (a) v t=900; titulek 1000, „Zítra“ 1100; (b) CTA 1600, (c) CTA 1800; zvuky ring ~900 ms, gong ~1.8 s; `tapLight` = bez haptiky.
- Otevřené: výběr Kenney souborů, text „Zítra“, heuristika perfTier, ověření TextInput na Fabric, odstíny plate* pro konfety.

## design-agent – spec Teplá litina kolo 2 (2026-10-03)
- Přepsán jen `docs/superpowers/specs/2026-10-03-tepla-litina-redesign-design.md` (sekce „Změny v kole 2“). Kód beze změn.
- Zapracováno: plamen → `StreakBarbell` (sm 6 slotů, lg 14, prázdný, dnes čeká, přetečení ×K, přerušený se spadlými kotouči), denní cíl → `TodayStatus`, připomínka v onboardingu, řádek „Zítra“ na oslavě, light `faint` #857B6E / `accentGraphic` #B86F12 / `accentText` #8A500C, všechny kontrasty přepočítány vzorcem WCAG + páry pro `theme/__tests__`, tokeny scrim×3, pressed×2, celebrate.ring/spark, `ValueWheelSheet`, z-order opičky (MonkeyBack/MonkeyFront jako sourozenci kotouče), mezistav odemčení, Dynamic Type, data místo konstant (estMinutes, bossUnlockAfter, xpBreakdown, badges).
- Rozhodl sám: QA navrhované #8F8577 nestačí na surface (2.8:1) → #857B6E; dark `faint` se nesmí na `raised` (2.8:1); `accentPressed` #E8952A tmavší v obou režimech; smutná karta jen při longestStreak ≥ 2.
- Otevřené: ozubené kolo (screenshot), seasonGold vs. jantar 1.1:1, emoji v notifikaci (SPEC §7.9), render plate* tónů.

## 2026-10-03 · boss · Teplá litina fáze 1 (základ)
- Paleta Teplá litina (dark i light) podle design spec §2: jantar #F2A33A nahrazuje IWF červenou; nové tokeny `faint`, `raisedPressed`, `accentPressed`, `accentGraphic`, `scrimSoft/scrim/scrimDeep`. Light `accentGraphic` #B26A10 (o krok tmavší než #B86F12 ze spec kvůli rezervě 3:1 na surface). Dark `plate5` #6A6662 (křídové kg číslo ≥ 4.5:1 na světlejší křídě). Kontrastní testy rozšířené o páry spec §2.3.
- Typografie §2.4: nové `hero`, `headline`, `stat`, `tab`; `title` Inter 600 24, `display` 40, `caption` 13; `maxFontSizeMultiplier` podle tokenu v `Text`. Radius s 8 / l 14. Nové velikosti (`button`, `node`, `tabBar`, StreakBarbell…) a `layout.narrow`.
- `lib/motion.ts`: `spring.kotouc`, `spring.sal`, `motion.cvak`, `dur.micro/standard/celebrate`; `release`/`toggle` → Cvak, `pop`/`unlock` → Kotouč.
- `lib/haptics.ts`: `fire`, `APPROX` (t=0 = dopad), `play()` s jedním aktivním vzorem, `stopPattern()`, `registerNativeHaptics()` pro budoucí dev build; přepínač `hapticsEnabled`. `lib/feedback.ts`: `feedback(id)` haptika + zvuk. `lib/sound.ts`: singletony `createAudioPlayer` při startu, `playSfx`, `setDucking`, přepínač `soundEnabled`.
- Zvuky Kenney CC0 (brag SFX): `tick.wav` = impactWood_light_002 60 ms lowpass 7 kHz −3 dB; `ring.wav` = impactBell_heavy_003 ořez + fade-out, lowpass 7 kHz −6 dB; `gong.wav` = impactBell_heavy_000 asetrate 0.7, 1.8 s, lowpass 3.5 kHz −4 dB. WAV 44.1 kHz mono 16 bit.
- Settings v3: `hapticsEnabled`, `soundEnabled` (nezávislé).
- Logika: `estMinutes` (odvozeno z cviků: příprava 20 s + výdrž / 3 s na opakování), `mascotMood` + `todayStatus`, `isLeagueLocked`, katalog `data/badges.ts` (12 odznaků) + `badgeProgress`/`badgeCondition`.
- Opice: detail obličeje má vlastní `mascot.ink` (onAccent se teď liší podle režimu).
- Otevřené: AHAP soubory (motion-agent), obrazovky (design-agent), ozubené kolo (čeká na screenshot), katalog odznaků ke schválení uživatelem.

## motion-agent — R44 kolo 2: AHAP + haptika odpočtu a výdrže (2026-10-03)
- Přidány `assets/haptics/lesson-complete.ahap`, `milestone.ahap`, `section-unlock.ahap`, `gong.ahap` (validní JSON, t=0 = heavy dopad 1.0/0.5). (b) pruh 0.16 s / 1.1 s, 0.8 × křivka 0.25→1.0→0, údery 1.26 (1.0) a 1.38 (0.5), success 1.46; section-unlock = (b) bez dvou úderů; (c) ticho 600 ms, úder 0.6 s (1.0/0.35), dozvuk 0.62–2.82 s s IntensityControl 1→0.55→0.2→0 a SharpnessControl 0→-0.3. Časy sedí s `APPROX` v `lib/haptics.ts`.
- `useHoldTimer`: nový stav `countdown` a pole `countdown` (3,2,1 po 1000 ms) před prvním startem; haptika přes `feedback()`: countdown3/2/1, `go` při startu výdrže, `holdTick` na celých desítkách, `holdLast5..1` po 1000 ms bez zrychlení, `holdDone`. Ref brání opakování po pokračování z pauzy. Pauza během odpočtu vrací do `ready`.
- `HoldTimer`: číslo odpočtu nastoupí scale 1.2→1 `motion.slam`; Reduce Motion = prolnutí `motion.calmFade` 200 ms. Nadechnutí měřidla teď po odpočtu (countdown→running).
- `app/lesson/[id].tsx`: během odpočtu je primární tlačítko Pauza.
- Rozhodnuto samostatně: při startu výdrže hraje `go` místo holdTick/holdLast (u výdrže 10 s nebo ≤5 s se první cue nezdvojí); odpočet jen u prvního startu, ne u pokračování z pauzy.
- Otevřené: `haptics.holdDone/tick` v `lib/haptics.ts` už lekce nevolá (lib nesahám). Odpočet posouvá start výdrže o 3 s — ověřit s QA/specem UX.

## 2026-10-03 · design-agent · Teplá litina část A (komponenty, tab bar, Trénink)
- Komponenty: Button (accent/accentPressed, raised/raisedPressed, ghost; 52, radius s, 2 řádky, loading, `feedback` cta/tapLight), Card (padding 24, `compact`), ProgressBar (stopa raised 6, výplň accentGraphic). Nové: StreakBarbell (+ čistá `streakBarbellState`), StreakPill, TodayStatus, LockedPreview, ValueWheelSheet, SectionLabel, StatGrid, BadgeTile, DayLegend (+ DayDot), EmptyHint.
- Tab bar: vlastní ikona s tečkou 4 pt accentGraphic nad ikonou (jen při focused), label `tab` přes Text bez numberOfLines, explicitní barvy, `feedback('tab')` na tabPress. `useCompact`/`tabLabelCompact` z tab baru pryč.
- Ozubené kolo: v kódu nebylo v žádné hlavičce (navigátory mají headerShown false, TabHeader ikonu neměl); jediné Settings je LinkRow v profile.tsx. TabHeader dostal `onSettings` (outline Settings v `text`, hit 44) a nadpis `title` sentence case.
- Trénink: TopBar = StreakPill + XP + liga + TodayStatus (bez plamene/Telemetry/MeasureLine). Uzly 72 / aktuální 88, prstenec 2 pt accentGraphic s mezerou 4, zamčený obrys faint + Lock 12. Popisky pod uzly z dat (`nodeInfo`, `useLessonMinutes` → `estMinutes`), primary „Začít lekci“ pod aktuálním, tap na aktuální kotouč otevře lekci, popover jen pro zamčené/hotové nad scrimSoft. Boss „Odemkne se po N lekcích“, N = počet lekcí sekce z dat. Karta první lekce (nový uživatel) a karta přerušené série (mood sad z `logic/mascotMood`). Kostra načítání 3 uzlů.
- Rozhodl sám: layout mapy počítá krok z výšky popisků (min. 64·φ), test geometrie upraven (krok už není pevný, velikost uzlu nese stav místo kg); `plateSize` zůstává kvůli oslavě. `useProfileStats` rozšířen o longestStreak/todayDone/isNew/mood. BadgeTile zamčený = obrys, ne plná faint silueta (zámek muted na faint by neměl kontrast). Nové tokeny: size.nodeLabel/previewPlate/badgeTile/ghostRow/wheelVisible/lockIcon/sheetGripH, stroke.streakAxisLg/todayDot/slot, material.streakPlateSm/Lg, size.meter 4 → 6.
- Otevřené: opička je zatím jedna vrstva nad kotoučem (kotva horní hrana, sedí 30 % své výšky přes hranu), rozdělení na MonkeyBack/MonkeyFront nehotové. Profil musí předat `onSettings` do TabHeader a smazat LinkRow Nastavení (profile.tsx není v mém kole). Výšky popisků mapy počítané pro 1.0× písmo; při velkém Dynamic Type se mohou dotknout dalšího uzlu. Pulz prstence a ShockRing (bílý) jsou pohyb, nechávám motion-agentovi.

## 2026-10-03 · design-agent · Teplá litina část B (Liga, Progres, Sezóna, Profil, Nastavení, onboarding Připomínka)
- Liga: zamčeno při `isLeagueLocked(activity)` → TierBadge `dim` (faint) + odpočet + LockedPreview bez maskota + primary „Začít první lekci“ (→ mapa). Řádek min. 56, pořadí a XP `stat` tabulárně, XP v pevném sloupci `leagueXpCol × min(fontScale, layout.statMaxScale)`, tisíce s NBSP; vlastní řádek raised + proužek 3 pt accentGraphic. Zóny: ChevronUp/Down 12 muted + „POSTUP/SESTUP“ (zelená/červená pryč). Secondary „Jedna lekce tě posune nahoru“ jen mimo postupovou zónu. Logika ani pořadí položek nezměněny.
- Progres: mřížka aktivity jako tečky (plná text / prstenec accentGraphic dnes / obrys faint / budoucí nevykreslené), hlavička Po–Ne, vlevo datum pondělí týdne. Prázdný stav = jen aktuální týden + věta. Milníky: binární = 0 / 1, název body, číslo caption tabulárně, stopa raised + výplň accentGraphic.
- Sezóna: hlavička mono název + termín caption, vpravo hero dní + „dní do konce“; pod `layout.narrow` / fontScale > `layout.fontScale` pod sebe. Cíl v Card: display hodnota + ProgressBar, „Zapsat hodnotu“ plné primary přes šířku → ValueWheelSheet. DayLegend 2×2 pod mřížkou (už ne vedle → neořezává se); Dot v DotGridu sjednocen s DayDot, budoucí faint na `opacity.future`.
- Profil: opička M, karta série (StreakBarbell lg + display v accentText + caption), StatGrid XP/Stage, odznaky z `badgeProgress` přes nový `hooks/useBadgeProgress` (získané první, zamčené s `badgeCondition`), počet „N / total“ v SectionLabel. Ozubené kolo jen v TabHeaderu Profilu, LinkRow Nastavení smazán.
- Nastavení: nadpis `title`, sekce Odezva se dvěma Toggle (haptika, zvuky) na `useSettings`, čas připomínky přes ValueWheelSheet místo stepperu.
- Onboarding: nový krok `app/onboarding/reminder.tsx` (krok 5/5, TOTAL_STEPS už bylo 5), weight → reminder → birth. `logic/onboarding.ts` beze změny (pořadí kroků řídí routy). Oprávnění žádá existující `useSettingsPrefs.setEnabled`.
- Notifikace: text bez emoji podle §3.7, `copy.notifications.reminder(streak, minutes?)`; test `data/__tests__/copy.test.ts` přepsán (starý ověřoval text s 🐒 ze spec §7.9).
- Systémový modrý tint: nenalezen (Switch/ActivityIndicator/Link/RefreshControl se nepoužívají, navigační téma už má primary = text).
- Tokeny: layout.statMaxScale 1.4, size.weekCol 48, opacity.future 0.4.
- Rozhodl sám: Profil podle spec §3.5 (karta série + StatGrid 2×1 + počet odznaků v nadpisu sekce), ne StatGrid 2×2 ze zadání: StreakBarbell lg má 160 pt a do poloviční buňky na 320 pt se nevejde, a série dvakrát by byla duplicita. Sloupec pořadí ligy ponechán `rankCol` 40 místo 32 (stat 20 při 1.4× by „12“ ořízl).
- Otevřené: `GridCell` má dnešek jen jako `today` (bez informace, zda je odcvičený) → dnes se vždy kreslí prstencem; pro plnou tečku „dnes hotovo“ by `logic/progress` musel vracet obě. Služba notifikací volá `reminder(streak)` bez minut → při sérii 0 zní „Opice čeká na dnešní lekci.“ (bez „Stačí N minut“), doplnění minut je práce pro boss/services. Typed routes: `/onboarding/reminder` se objeví po regeneraci typů. Hlavička ligy (Stat/Telemetry) zatím původní, TierBadge 72 místo 56.

## motion-agent: MVP pohyb Teplá litina (motion spec kolo 2, §9)
**Hotovo**
- Button: vtlačení translateY 2 pt (`motion.press` 90 ms), návrat `motion.cvak` 120 ms, bez pružiny; Reduce Motion bez posunu (stisk nese výplň).
- Tab bar: tečka aktivního tabu entering/exiting scale+opacita 0↔1, `motion.cvak` 120 ms (layout animace, UI vlákno).
- Oslava (a) `LessonCompleteScene`: pád/dosednutí/rattle/punch/žár zachovány. t=0 (onImpact) `play('lesson-complete', uiScheduler)` (withDelay + scheduleOnRN), plateSnap; dim `scrim` 240 ms; činka posune nový kotouč do středu `spring.kotouc` (+120); ring `accentGraphic` trim+opacita 160–860 ms ease.out + `ring` zvuk; +XP slam a count-up 650 ms od 500 ms, max 8 ticků `feedback('xpTick')` (re-render jen při ticku); kotouč série na StreakBarbell sm 900 ms (`seriesPlate`, drop 12 pt, seat {25,520}, rattle 1 pt; jen při firstOfDay > 0); opička `celebrate` bez poskoku 950 ms; titulek 1000 ms (rise 8); „Zítra: …“ 1100 ms (nextLessonId + estMinutes, bez další lekce se nevykreslí); CTA 1200 ms. Všechny kroky z UI vlákna, žádný setTimeout. `skipToEnd()` idempotentní (tap kamkoli, AppState background, přerušený pád): ruší kroky, stopPattern, setDucking(false), konečné hodnoty za 150 ms, bez haptiky. setDucking(true) při vstupu, false v cleanupu. Reduce Motion: calm fade, konečné stavy hned, haptika a zvuky zachované. Staré haptics.impact/success odstraněny.
- Mapa: dech jen prstence (opacita 1↔0.6, scale 1→1.03, půlperioda 1200 ms ease.sine, RM statický 0.8), i boss; opička na uzlu bez dechu (`breathe={false}`). Odemčení: obrys faint fade-out 200, litina fade-in 200, Lock fade 120, trim prstence 400 ms ease.out, scale 0.92→1 `spring.kotouc`, na konci trimu `haptics.unlock()` (rigid, soft +90) + zvuk unlock; ShockRing z uzlu odstraněn. Přeskok opičky: +120 ms, přikrčení 70 ms, oblouk 440 ms (parabola 28 pt), dosednutí dip 3 pt + `motion.settle`, `feedback('monkeyHop')`; RM crossfade 200 ms. Zamčený tap: 3 pt, 4×60 ms (RM opacita 1→0.5→1 / 240 ms); `feedback('locked')` na onPressIn ověřen. Fajfka trim 300 ms ease.out.
- Maskot: nové props `breathe`, `hop` (výchozí true).
- Testy: `components/lesson/__tests__/celebrationMotion.test.ts` (strop 8 ticků, idempotence brány `once`).
- copy: `copy.lesson.tomorrow` (jediná změna v copy).

**Rozhodnutí**
- „Kotouč do středu“ = posun celé činky (scale 2.2 by rozbil osu a přetekl obsah).
- Časová osa (a) je zatím `TIMELINE_A` v `components/lesson/celebration.ts` (lib/* nesahám); boss ji může přesunout do `lib/motion` jako `celebration.a`.
- XP count-up: fallback re-render při ticku místo TextInput s animovaným `text` (neověřeno na Fabric, zachová `Stat`).

**Otevřené**
- Jantarová hrana šálu (fade 200 ms): SvgMascot zatím žádný šál nemá (MonkeyBack/MonkeyFront chybí), nelze animovat.
- Řádek bez další lekce: spec design §3.6 chce „Sekce hotová. Další se odemkne v mapě.“, boss zadal nevykreslit; text v copy chybí.
- Kotouč série při prvním zobrazení mapy po přeskočené oslavě (§3.6) není; hotový uzel bez následující lekce (konec cesty) trim fajfky nedostane (není odemykací pár).
- Pilulka série v oslavě je jen řádek činka + číslo; vzhled pilulky patří design-agentovi.
- K ruční kontrole na zařízení: sync haptiky s ringem, ducking hudby, AppState skip.

## 2026-10-03 qa-agent: R44 kolo 1
- tsc/lint/jest zelené (445 testů). Verdikt SCHVÁLENO.
- Opraveno: dvojí tap v onboarding kroku připomínky (guard + reset při focusu).
- Otevřené: tab label bez numberOfLines (design), AppState `inactive` (motion), ruční kontrola haptiky/duckingu na zařízení.

## 2026-10-03 · boss · Přeskočení cviku s adaptivním dluhem (R44, zadání uživatele)
- Uživatel: skip cviku → přeskočený objem se rozloží do dalších lekcí („v dalších 5 lekcích o 10 s delší“), aby se plnil dlouhodobý cíl, se stropem. Lekce platí (série, odemčení), když je odcvičená aspoň polovina cviků.
- `logic/adaptive.ts`: dluh `{holdS, reps, share}`; `share` = dluh / 5 (min 5 s / 1 opak.) zafixovaný při skipu → rovnoměrně 5 × 10 s. Stropy: dluh 150 s / 40 opak., navýšení cviku min(15 s / 4 opak., 25 % základu). Odcvičené navýšení se odečte, přeskočený cvik přidá svůj základ. `canSkip` pustí skip jen dokud jde lekci započítat (žádná slepá ulička).
- XP: základ lekce poměrně k odcvičeným cvikům, bonus dne a série beze změny.
- `UserProfile.trainingDebt?` (volitelné, bez migrace verze); poškozený dluh se při načtení zahodí.
- Služba: `getLesson` vrací navýšené `exercises` + `extras` + `baseAmounts`; `completeLesson(…, done?)`.
- UI: v lekci sekundární „Přeskočit“ (ne během běžící výdrže), pod kartou „+N s za přeskočené cviky“.
- Rozhodl boss: konkrétní stropy a min. podíl; navýšení jde na cviky stejného typu (výdrž/opakování), ne nutně na tentýž cvik.

### qa-agent — R44 kolo 2 (přeskočení)
- tsc/jest (458) zelené, lint změněných souborů čistý. Dluh, stropy, retry idempotence, canSkip, migrace, XP poměr ověřeny; přidány testy (retry, boss XP, migrace dluhu, smíšené typy).
- Opraveno: kontrola délky `done`/`extras` v applyLessonCompletion; tautologický test XP.
- Otevřené: retry XP z aktuálního done místo prior.xp (drobnost); skip skrytý při běžící výdrži (UX). Verdikt SCHVÁLENO.

## 2026-10-03 · design-agent · R44 nálezy hodnocení (opička ve dvou vrstvách, šál, hlavička ligy, dnešek v aktivitě)
- Maskot: `SvgMascot` kreslí přes interní `layer` (`all`/`back`/`front`); export `MonkeyBack`, `MonkeyFront`, `mascotSeatY`. `<Mascot>` = `all`, beze změny API. Přední vrstva kreslí nohy oříznuté evenodd cestou „plátno minus trup“ (stejné pixely jako celá opice) + konec šálu; je vždy dekorativní. Obě vrstvy mají stejný viewBox i animaci těla.
- Kotva sezení = spodní hrana trupu (`seatY`), na mapě leží na středu horní hrany kotouče (nahradilo odhad `MASCOT_SEAT 0.3`). LessonMap kreslí pro sedící opičku MonkeyBack + MonkeyFront v jednom pohyblivém kontejneru nad uzly, `pointerEvents none`; smutná/u bosse dál celá `<Mascot>` vedle uzlu.
- Šál: tokeny `mascot.scarf #6F7C86`, `mascot.scarfShade #56626B` (studená ocel proti jantaru, akcent zůstává jen na hraně). Ovinutí pod bradou (zadní vrstva), konec visí přes kotvu sezení (přední). `celebrate` konec vlaje do strany, `sad` omotaný až k bradě (kreslí se přes hlavu) s krátkým koncem. Prop `scarfEdge` = horní hrana v `accentGraphic` (bool; prolnutí je na motion-agentovi). Při sezónní/nasazené zimní šále se vlastní šál nekreslí.
- Liga: hlavička = TierBadge 56 (`size.tierBadge` 72 → 56, platí i v banneru) bez štítku + `title` „Liga {tier}“ + `caption muted` „Týden končí za …“ (Countdown bez Telemetry). Stat pozice/XP a napočítání XP odstraněno: nese je vlastní řádek. Pod 360 pt / fontScale > 1.3 odpočet pod názvem; textový sloupec `flex 1, minWidth 0`, takže na 320 pt nic nepřetéká.
- Progres: `ActivityGrid` prop `todayDone` (z `useProfileStats.todayDone`, tj. `todayStatus`), dnešek = plná tečka `text` + absolutní prstenec `accentGraphic` (nový token `size.todayRingGap 2`), počet aktivních dnů a prázdný stav dnešek započítají.
- Testy maskota: nové testy šálu ve všech náladách, hrany, náhrady sezónní šálou a složení vrstev (proč: změnila se struktura SVG).
- Otevřené: ověřit vizuálně sezení na všech stage (konec šálu přes čelo kotouče S 56); copy `league.headerTitle` / `endsInLine` přidal design (boss zkontroluje znění); jantarová hrana se v oslavě musí zapnout (`scarfEdge`) – motion-agent.

## motion-agent — R44 nálezy ratingu (tokeny pohybu, hrana šálu)
- Nový token `motion.breath { low 0.6, scale 1.03, still 0.8, periodMs 2400 }` v `lib/motion.ts`; PlateNode (`PULSE_MS = periodMs/2`) i BarbellBoss (BossPulse) ho čtou, žádná duplicitní čísla.
- Další magická čísla pohybu přesunuta do `lib/motion.ts`: `motion.checkMs` (300), `lockedShake` (3 pt, 60/120 ms, dim 0.5), `nodeUnlock` (200/120/400 ms, z 0.92), `bossUnlock.from` (0.8), `mapHop` (120 ms, oblouk 28, přikrčení/propad 3 pt), `pathDrawMs` (420), `popover` (scale 0.94, posun 8 pt), `holdPulse` (posl. 3 s, 1.1, 90 ms), `slamFrom` (1.2), nový export `lessonDone` (titulek 8 pt, přílet x140/18°, objímka 120 ms, prohnutí 3 pt/50 ms, kotouč série 12 pt, rozkmit 1 pt/40 ms, seat pružina).
- Hrana šálu v oslavě: `LessonCompleteScene` předává `scarfEdge={mood === 'celebrate'}` (zapne se s pózou ~950 ms). V `SvgMascot` je hrana malá komponenta `ScarfEdge`, která se při připojení prolne 0 → 1 (`motion.scarfEdge`, 200 ms ease.out, UI vlákno); prop zůstal boolean. Reduce Motion: opacita rovnou 1.
- Rozhodnuto samo: rozměry (PW, GAP, ARROW, SIZE…) ponechány lokálně, nejsou to pohybové hodnoty; přesun do `theme/tokens.ts` nechávám design-agentovi.
- Otevřené: nic. tsc, eslint (0 chyb), jest 466/466 OK.

- qa-agent, R44 kolo 3: tsc a jest zelené, eslint 0 chyb (13 varování). Ověřeno, že přesun konstant do lib/motion zachoval hodnoty, a zkontrolovány useNow, scarfEdge + Reduce Motion, z-order a pointerEvents opičky, todayDone a hlavička ligy. Nic jsem neopravoval. SCHVÁLENO. Otevřené: vizuální kontrola na 320 pt, úklid lint varování.

## 2026-10-03 · design-agent · Nastavení → Cíle (úprava cílů po onboardingu)
- `app/settings.tsx`: nová sekce „Cíle“ jako první řádek (Reveal i=0, ostatní posunuty o 1). Čtyři řádky `GoalRow` (název `bodyStrong`, hodnota `caption muted` max 2 řádky, chevron, min. `hitLarge`, stisk = `raised`). Načítání = „Načítám“ a řádky zakázané; chyba = věta + Zkusit znovu jen v sekci, zbytek Nastavení běží.
- Editory `app/goals/{milestones,weight,dream,path}.tsx`, registrované v `app/_layout.tsx` jako `presentation: 'modal'` (další modal nad Nastavením, bez `_layout` ve složce). Uložit → `router.back()` na Nastavení.
- Sdílený rám `components/goals/GoalEditorFrame.tsx`: `GoalEditorGate` (loading/error/bez profilu), `useGoalSubmit` (jeden zápis i při dvojitém ťuknutí, chyba z `useGoals.save` → česká věta z `copy.goals.errors`, inline nad lištou, `accessibilityRole alert`), `GoalEditorFrame` (kicker „Cíle“ + křížek, `display` titulek, lead, BigActionBar Zrušit / Uložit; Uložit zakázané, dokud není změna).
- Vytaženo z onboardingu (místo kopírování): `components/onboarding/CustomMilestoneForm.tsx`, `CustomDreamField.tsx`; onboarding je používá. Při přesunu natvrdo psané 20 / 1.5 / 0.4 / 1 nahrazeny `size.icon`, `stroke.icon`, `opacity.disabled`, `stroke.hairline`.
- Milníky: seznam řádků (název, pokrok `Pokrok 4 / 10 ×`, křížek 44 pt, pole Cíl u jednotek s číslem), pod tím „Přidat milník“ = chipy předvoleb cesty, které ještě nemáš, + vlastní milník. Limit 2–3 vysvětluje věta u počítadla (při 4. pokusu zesílí muted → text a chip zatřese, jako v onboardingu). Název předvolby sleduje cíl („10 shybů“ → „15 shybů“).
- Váha: SegmentedControl směru + pole „Výchozí váha“ / „Cílová váha“ (výchozí, ne aktuální: jde o začátek cíle), validace `weightFieldErrors` při opuštění pole a při Uložit, hodnoty s desetinnou čárkou.
- Vize: karty aktuální cesty + Vlastní (CustomDreamField); vize, která nesedí na kartu cesty, se otevře jako vlastní text.
- Cesta: PathCard ×3; po výběru jiné cesty se ukáže věta „Mapa se přepne na novou cestu. Hotové lekce zůstanou.“ v `bodyStrong` s proužkem `text` vlevo (stejná gramatika jako vybraná karta, žádná varovná barva: změna není chyba).
- Texty `copy.goals.*` (nbsp po u, s, v).
- Otevřené: (1) `retarget` (přepis čísla v názvu předvolby) je pure funkce v `app/goals/milestones.tsx`, patří do `logic/goals.ts`; u cíle 1 vznikne „1 shybů“ (skloňování). (2) typedRoutes: nové routy `/goals/*` potřebují regeneraci `.expo/types` (expo start), jinak tsc hlásí `router.push`. (3) Předvolby a cesty čtu přes `hooks/useOnboardingDraft` (`useMilestonePresets`, `usePathOptions`, `useDreamOptions`) – fungují, ale název souboru je onboardingový; zvážit přesun do `hooks/useGoalOptions`. (4) Vstupní animace editorů a řádků nechávám motion-agentovi.

## 2026-10-03 · design-agent · Hloubka a materiál (zpětná vazba „vypadá levně / prázdně“)
- Diagnóza: plochy byly ploché obdélníky jednoho tónu bez materiálu a horní třetina tabů neměla subjekt (TabHeader → hned obsah). Akcent, typografie a paleta Teplé litiny zůstávají; přidávám jen hmotu a kotvy.
- 1 Materiál: `components/ui/Grain.tsx` = zrno lité litiny (SVG Pattern, dlaždice `size.grainTile` 96, 92 deterministických zrn, světlá `text` / tmavá `shadow`, celá vrstva `opacity.grain` 5 %). Rozhodl jsem sám: zrno leží NAD obsahem (pointerEvents none, skryté čtečce), ne pod ním — hlavičky a karty mají plné pozadí a zrno pod nimi by zmizelo; materiál má procházet celým povrchem stejně. Světlá a tmavá zrna se vyruší, tón ani kontrast textu se neposune. Je v `Screen` a v kořeni všech 5 tabů (taby `Screen` nepoužívají). Karty: nový token `c.edge` (dark #3D352D, light #FFFDF8) jako vlasová horní hrana světla na Card, LockedPreview, StatGrid, StreakPill, LeagueResultBanner, NodePopover, panel cviku. Odchylka od zadání: zadání říká `rule`, ale ve světlém režimu je `rule` tmavší než karta a četl by se jako stín, ne světlo — proto samostatný token. Card má nový prop `tone: 'surface' | 'raised'`.
- 2 Kotouč (`components/map/Plate.tsx`): soustružené drážky na vnějším lemu (`material.plateLipGrooves`, střídavě stín/světlo), odlesk hrany nahoře vlevo (`text` na `opacity.glint` 24 %) a stín dole vpravo, zapuštěná čelní plocha (stín pod horní hranou lemu, světlo nad dolní), vystouplý náboj (`plateHighlight`) se dvěma drážkami, zkosený otvor, číslo kg vyražené (světlý otisk dole + tmavý nahoře pod plnou barvou, posun `material.plateStamp`), od průměru 72 i ražené „KG“ (`svgType.plateUnit`). Geometrie R/φ a font čísla (spec §6.5, SPEC.md ř. 337) beze změny; kontrast čísla (inkOn) beze změny.
- 3 Hero na každém tabu: Trénink `components/map/SectionHero.tsx` (štítek SEKCE 01, název `title`, číslo hotových lekcí `hero` + „/ 8“, malá činka se sloty: hotová lekce = kotouč v tónu své litiny, nehotová = obrys `faint`, bez akcentu). Rozhodl jsem: číslo počítá všechny lekce sekce včetně bosse, činka jen kotoučové lekce (boss je činka sama). Liga `components/league/Podium.tsx` nad tabulkou (2·1·3, stupně = `components/ui/PlateStack.tsx` stohy 5/3/2 kotoučů z boku, mini opička 48, vítěz `happy`); top 3 zůstávají i v tabulce (pódium je obraz, tabulka je data). Progres: štítek „POSLEDNÍCH 5 TÝDNŮ“ + `Stat L` aktivních dní + nejdelší série; telemetrie „AKTIVNÍ“ pod mřížkou odstraněna (duplikát hera). Vize těla v Card a v `title`. Sezóna: odpočet `displayXL` (pod 360 pt `hero`) s „dní do konce“ na účaří, hlavička vždy pod sebou. Profil: opička v rámu na podstavci `PlateStack` (3 kotouče, 176), na střed, cesta pod ní.
- 4 Lekce: panel siluety 200 → `size.silhouettePanel` 240 s perspektivní mřížkou podlahy (`rule` na `opacity.floor`, horizont 1/φ, `size.floorRows` 5, rozestup `floorStep`×2), linka země ve `faint`. Pořadí textu: číslo (Stat L / HoldTimer) → název `title` (dřív `display`, soupeřil s číslem) → popis; mezera panel–text xl → l.
- 5 Rytmus: nové prvky na mřížce 8 (okraje `space.l` 24, mezi sekcemi `space.xl` 40, uvnitř `s`/`m`). Stávající layouty jsem nepřeskupoval mimo zmíněné.
- 6 Prázdné stavy: ghost řádky LockedPreview mají stavbu řádku ligy ve `faint` (pořadí 1–3 `stat`, obrys kruhu místo opičky, pruh jména, „—“ místo XP — žádná vymyšlená čísla).
- Tokeny: `c.edge`, `size.{grainTile, heroBarbellW/H, podium*, pedestal*, silhouettePanel, floorStep, floorRows, plateUnitMin}`, `opacity.{grain, floor, glint}`, `stroke.{groove, glint, bevel}`, `material.{plateLipGrooves, plateHubGrooves, plateGlint, plateStamp, heroPlateW, heroPlateGap, heroBar}`, `svgType.plateUnit`. Texty `copy.map.{plateUnit, sectionKicker, sectionTotal, sectionCaption}`, `copy.league.podiumXp`, `copy.progress.hero*`.
- Otevřené: (1) nové prvky (SectionHero, Podium, podstavec, mřížka podlahy) nemají nástupové animace — motion-agent. (2) 5 % zrna je na hranici viditelnosti, ověřit na zařízení (případně 6–8 %). (3) SectionHero ubírá mapě ~110 pt výšky; na 320×568 ověřit, že aktuální uzel s CTA zůstane po scrollu vidět. (4) Pódium při 0 XP všech ukazuje nuly — zvážit skrytí do první lekce týdne. (5) Testy na vzhled nebyly; nové komponenty test nemají.

## 2026-10-05 · design-agent · Polish (dotažení Teplé litiny, bez nového směru)
- `retarget` už byl v `logic/goals.ts`; v `app/goals/milestones.tsx` jsem smazal zastaralý komentář „OTEVŘENÉ“. `retarget` nově skloňuje název předvolby po číslovce (1 / 2–4 / 5+, stejné pravidlo jako `czPlural`): „1 shyb“, „3 shyby“, „5 shybů“, „1 tleskací klik“. Číslo hledá jako samostatné slovo (dřív `replace` první shody, takže „110“ nebo „-3“ mohly selhat), znaménko u kg zůstává. Tvary slov z předvoleb jsou tabulka v logic/ (logic nemá importovat data/copy). Test `test.each` s 9 případy v `logic/__tests__/goals.test.ts`.
- Liga: Podium vrací `null`, když nikdo nemá XP tento týden (pořadí by bylo náhodné). Prázdný stav nese hlavička ligy větou `copy.league.podiumEmpty`, která v tu chvíli nahradí `emptyWeek` (bez dvojí zprávy).
- SectionHero na 320×568: odhad plné verze ~150 pt + karta první lekce ~100 pt + TopBar + tab bar nechávaly mapě ~170 pt na uzel 88 pt s opičkou. Kompaktní varianta přes `useCompact()`: název 1 řádek, bez činky (pokrok nese číslo), číslo `display` místo `hero`. Šetří ~90 pt. Rozhodl jsem sám: jde o ořez informace duplikované číslem, ne o změnu hierarchie.
- Audit app/ a components/: žádné hex/rgba barvy, natvrdo `fontSize` ani číselný padding/margin mimo theme (výjimka `Stat.tsx` počítá velikost z tokenů); plné ikony nenalezeny; jediné centrování textu (profil pod opičkou na středu) má důvod.
- Otevřené: (1) `npx tsc --noEmit`, `npx jest`, `npx eslint .` jsem nemohl spustit (agent nemá shell) — musí spustit boss/qa. (2) Kompaktní SectionHero ověřit na zařízení 320×568. (3) Audit byl grep a čtení klíčových obrazovek, ne vizuální průchod každou obrazovkou se screenshoty.

## 2026-10-05 · motion-agent · Polish: nástupy nových prvků
- Tokeny v `lib/motion.ts` (`intro.*`), všechny nové nástupy `motion.reveal` (480 ms, ease.out = cubic-bezier(0.22,1,0.36,1)), timing, žádná pružina; Reduce Motion = 200ms prolnutí bez posunu (přes `useReveal`/`Reveal`).
- SectionHero (`intro.hero` at 40, step 60, rise 8): štítek+název → číslo → činka; zapadá do sledu mapy mezi hlavičku (0–70) a linku (140), hraje jen s `intro` mapy. Kompaktní varianta bez činky.
- PlateStack: nové props `play`, `delay`; stoh vyroste z podlahy (výřez, posun o celou výšku). Profil: podstavec `intro.pedestal.at` 0, souběžně s rámem.
- Podium (`intro.podium` at 120, step 90, mascotLag 160, mascotRise 10, labelLag 120, rise 6): stupně 1 → 2 → 3, opička dosedne, pak popisky. Hraje při prvním zobrazení tabu, nebo když se pódium objeví během relace (z prázdného stavu). Věta hlavičky ligy (podiumEmpty / emptyWeek) se při změně prolne místo skoku. Vnější Reveal pódia v league.tsx odstraněn (nahrazen vnitřním sledem).
- Mřížka podlahy v panelu lekce (`intro.floor` at 0, rise 6): prolne se před siluetou při každé kartě.
- Editory Cílů (`intro.goals` at 60, step 70, rise 10): kicker → titulek+lead → obsah; lišta Zrušit/Uložit stojí.
- Nastavení, řádky Cílů (`intro.goalRows.step` 40): po řádcích za nástupem sekce; hodnota, která dorazí po načtení, se prolne.
- Statický vzhled beze změny (obaly přebírají původní styly). tsc, eslint, jest 481/481 zelené.
- Otevřené: ověřit na zařízení plynulost výřezu PlateStack na pódiu (3 stohy + 3 opičky souběžně) a délku celého sledu pódia (~1,1 s).

## 2026-10-05 · qa-agent · Polish
- tsc, eslint, jest (52 sad, 482 testů) zelené. Doplněn test okrajů `retarget` (110, 0, znaménko, název bez čísla).
- Vstup 0 / záporný / prázdný UI odmítne už `parseMilestoneTarget` (1–9999), do `retarget` se nedostane.
- Podium se při 0 XP skrývá (`return null`), hlavička ligy se přepíná přes `Reveal` s klíčem, nástupy (choreo) respektují Reduce Motion (200ms fade), časování z `lib/motion`, v nových souborech nejsou pružiny ani hardcoded hodnoty.
- Verdikt: SCHVÁLENO. K ruční kontrole na zařízení: vzhled kompaktního SectionHero, přechod hlavičky ligy.

## 2026-10-05 · design-agent · Nothing Dot fáze 1, úkoly 5–9 (statický vzhled)
- Nové: `components/dots/` (SkiaGuard, DotPlate, DotRing, DotRow, DotMatrix, DotField, ink, index), `components/ui/` Tile, PillButton, StatusLine, ScreenHeader, FloatingTabBar. Card/Button/BigActionBar/RoundCta/TabHeader převedeny na dlaždice a pilulky, Grain odstraněn ze Screen a všech tabů.
- Tokeny: `dots.*` (rozteče, poloměry, záře, strop pole 600), `type.pill` (mono 13 pro CTA), `size.liveDot/holdRing/heroTile`, `opacity.edgeLit`.
- Mapa: uzly = DotPlate, cesta = tečky (SVG čárka nulové délky s kulatým koncem; zachová animaci dokreslení), boss = tečková činka, hero = dlaždice s Doto číslem a DotRow, hlavička = stavový řádek „SEKCE 01 · ● N DNÍ“ + Doto titulek sekce, tečkové pole za hlavičkou doznívá dolů, plovoucí pilulka `[ZAČÍT LEKCI]`. Opička sedí na `plateOuterRadius` (= size/2, vnější hrana teček).
- Lekce: LessonProgress = DotRow + mono „02/05“, ExerciseCard = Tile s podlahou z teček (pole doznívá nahoru), HoldTimer = DotRing 260 s Doto sekundami, BigActionBar = dvě pilulky.
- Rozhodnutí sám:
  - kg na uzlu mapy (72/88) je mono štítek, ne Doto: Doto je povolené až od 28 pt a do náboje R/φ² se nevejde. Doto až od průměru 144 (`dots.plate.dotoMin`, oslava).
  - Aktuální vs. dokončený kotouč: aktuální má záři (dark) a kometu, dokončený plný `text` bez záře + fajfka místo čísla. Plný prstenec aktuálního uzlu (PulseRing) a stín kotouče odstraněny: rozbíjely tečkový jazyk; aktuální nese velikost 88 + kometa + opička.
  - Tlačítko „Začít lekci“ pod aktuálním uzlem odstraněno, akce je plovoucí pilulka obrazovky (spec §6) a tap na kotouč; `labelHeight` current upraven.
  - Mapa už nemá TopBar (XP, liga): spec §6 je na mapě nemá; `useLeague()` zůstává kvůli vyhodnocení týdne.
  - Živá tečka stavového řádku svítí jen když dnes ještě nic nebylo (údaj „série čeká“), jinak chybí.
  - DotField: spec chce rozteč 14 i strop ~600 teček; celé pole přes obrazovku má ~1700. Řešení: pole jen za hlavičkou, řádky nad strop se utnou a 4 pásma ho nechají doznít.
  - Lekce: spec §6 říká „DotRing progresu nahoře“, plán úkol 9 „DotRow“. Držím plán (DotRow), ring je u výdrže.
  - Jest: `lib/commonjs/mock` Skia exportuje jen továrnu `Mock(CanvasKit)`, takže `jest.setup.ts` mock by shodil každý render s Canvas. Nahrazen vlastní atrapou (komponenty = View s props).
  - Button: jen tvar pilulky (výška 56, radius full, hrana u sekundárního), popisky zůstávají Inter sentence case (vedlejší akce v obsahu); `[ZÁVORKY]` nese PillButton.
- Otevřené: haptika primární pilulky je `cta` (medium), spec chce light (FeedbackId v `lib/` patří bossovi). Dev obrazovka „Tečky“ (plán úkol 5 krok 5) nepřidána. Popover uzlu a NodeLabel zůstaly Inter/Card. Ověřit na zařízení: Doto s diakritikou v titulku sekce, čitelnost `dotOff` pole v light.

## 2026-10-05 · design-agent · Nothing Dot fáze 1, opravy po screenshotu bosse
- Hero: pod dlaždicí mezera `space.m`, ScrollView mapy `overflow: hidden` (kotouč se ořízne hranou výřezu, ne hranou dlaždice).
- Cesta: PathLine dostala `labelBottoms` a `ends`; úsek začíná pod popiskem uzlu a končí nad opičkou, u začátku sekce nad mono nadpisem sekce (tam se přeruší).
- „Shluky teček“ nad CTA nebyly tečkové pole, ale vršky tečkové činky bosse pod pilulkou. Pilulka má teď pod sebou plnou plochu `base` (mapa pod ní mizí čistou hranou), `footerSpace` mapy = pilulka + 2 × `space.m`.
- Tab bar: podložka je kulatá (průměr výška pilulky − 2 × vnitřní okraj), vystředěná ve slotu. Popisek pod ikonou zrušen (do podložky se nevešel), název nese čtečka.
- Onboarding: Doto varianty dostaly řádek 1.3 em (`display` 52, `hero` 84, `dotStat` 36, `displayXL` 143), protože háčky a čárky nad verzálkami přetékaly box. Je to hypotéza příčiny překryvu leadu; díru mezi kartami v kódu nevidím (PathCard/ChoiceCard jsem neměnil). Potřebuje nový screenshot.

## 2026-10-06 · design-agent · Opravy po ratingu a QA (N3, N4, úkol 3)
- N3 HoldTimer: prstenec vystředěný (`alignSelf: center`), uvnitř jen Doto číslo; štítek PŘIPRAV SE / SEKUND stojí pod prstencem v řádku pevné výšky (přepnutí nic neposune).
- N4 závoj popoveru: žádný viditelný závoj, jen průhledná plocha, která zachytí tap mimo. Popover je dlaždice s hranou, nic víc ho oddělovat nemusí; závoj jen přes výřez mapy působil jako chyba.
- NodePopover: obsah v `Tile`, nahoře mono stav uzlu (AKTUÁLNÍ / ZAMČENÁ / DOKONČENÁ) a zavírací X (stroke 1.5 z tokenu), název Inter (Doto jen ≥ 28 pt), metadata mono, akce PillButton. Popisky uzlů už měly mono metadata.
- `components/map/Plate.tsx`: litinový SVG kotouč smazán (nikde se nepoužíval), zůstaly jen `CHECK_PATH`/`CHECK_LENGTH` pro PlateNode. Testy na něj žádné nebyly.
- Úkol 3: rozhodnuto, že `hero`/`display`/`displayXL`/`dotStat` JSOU Doto varianty, plánované `dotHero`/`dotDisplay` se nezavádí (dva názvy pro jeden styl). Plán úkol 3 upraven.
- Copy „Zítra · …“ a dev sekci Tečky už opravil boss, nesahal jsem.

## 2026-10-05 · motion-agent · Nothing Dot fáze 1, pohyb a interaktivita (úkoly 5, 7, 8, 10)
- Ambient mapy (`components/map/ambient.tsx`, `PlateNode`): jedna hodina `useFrameCallback` 0→1 za `motion.ambient.clockMs` 120 s (společný násobek 40 s / 24 s / 8 s / 2.4 s, smyčka bez skoku), běží jen se zaostřenou mapou. Kotouče lineárně 360°/40 s, aktuální 360°/24 s, kometa aktuálního obíhá navíc 8 s/otáčka, záře aktuálního dýchá cos 1 ↔ 0.6 za 2.4 s (`motion.breath`). Odemykaný kotouč dostane stejné natočení (výměna bez skoku). Reduce Motion: stojí, záře `breath.still` 0.8.
- Živá tečka (`StatusLine`): opacita 1 ↔ 0.15, sinus, cyklus `liveBlinkMs` 1200, nekonečně; Reduce Motion plná.
- Dotyková vlna (`components/dots/useDotTouch.ts`, `animate.ts`): `Gesture.Manual`, nikdy se neaktivuje, takže nebere scroll, tap ani roztočení. Dotyk → síla 1 za 90 ms, puštění/převzetí scrollem → 0 za `ripple.decayMs` 500 ease-out quad. Tečky v okruhu 64 se odsunou max 4 pt (`rippleOffset`) a nad `boost` 0.3 se překreslí v `text` (opacita síla × `ripple.lit` 0.85); po puštění se okruh rozšíří až 1.6× (vlna se rozběhne a dozní). Napojeno: DotField za hlavičkou mapy, DotField oslavy, DotMatrix (vlastní gesto, nebo `touch` zvenku), DotPlate (přes gesto roztočení; prst převeden do soustavy otočeného kotouče). Reduce Motion: vypnuto.
- Roztočení kotouče (`components/map/usePlateSpin.ts`): Pan `activeOffsetX ±8`, `failOffsetY ±12`, úhel prstu vůči středu (mrtvá zóna 18 % poloměru), úhlová rychlost z tečné složky, `withDecay(deceleration 0.997)`, strop 2 otáčky/s, k ambientu se přičítá (po doběhu plynule zůstane ambient). Haptika `selection` po 30° (`ticksCrossed`), nejvýš 1 za 45 ms. Po švihu se tap neotevře (`dragged`). Jen `current`/`done`. Test `angleDelta(3.1, −3.1) ≈ 0.083`, `ticksCrossed(0, 65, 30) = 2`.
- Tile (`components/ui/useTilePress.ts`): stisk scale 0.97 + rotateX/rotateY k bodu dotyku max 6° (perspective 600; bod přes `measure` + pageX, ne locationX vnořeného prvku) za 90 ms, hrana `text` × `opacity.edgeLit` prolnutím; puštění 200 ms ease.out. Žádná pružina. Reduce Motion jen hrana. PillButton: scale 0.97 (`usePressFeedback`).
- FloatingTabBar: podložka translateX za aktivním tabem 260 ms ease.out (změna šířky lišty bez animace, Reduce Motion skok).
- Nástupy: DotRow sken zleva (celá řada za `dotScanMs` 600, stálá rychlost), další změny počtu (série +1, další cvik, odpočet) doběhnou 280–600 ms, rozsvěcovaná tečka prolnutím. DotRing: vnější rastr spirálou od středu ven 600 ms + vnitřní prstenec od 12 h. DotMatrix sken zleva. DotPlate spirála (`spiralOrder`) volitelně `intro`. Reduce Motion: 200 ms fade. Mapa: hlavička `Reveal` 0 ms (480 ms ease.out, zdvih 12) → hero 80 (`intro.hero.at` 40 → 80; číslo, tečky se skenem, název po 60) → kotouče se spirálou s usazením (`intro.map`).
- Vlajková loď (`LessonCompleteScene` přepsaná, `celebration.ts` `celebrationTimeline` + `fieldGrid` + `gatherSources`, `motion.lessonDone` nová osa): 0 celoplošné pole (`fieldMax` 2000) vlna od středu 640 ms (pásmo 56, odsun 4) · 200 tečky vzlétnou z teček pole (mezikruží mezi 1.3 R a okrajem) a po spirále (twist 1.6 rad, starty rozložené 40 % podle `spiralOrder`, každá ease-out cubic) se slétnou do prstenců 700 ms; od 55 % letu nádech na 1.08 · 900 nacvaknutí: 1.08 → 1 `spring.kotouc`, tečkový shock prstenec 1 → 1.45 / 0.7 → 0 za 520 ms, `fire('success')` + `plateSnap`, kotouč 360°/24 s s kometou, Doto kg · 1000 opička celebrate (`motion.settle`, zdvih 16) + scarfEdge, titulek a XP (napočítání 700 ms, ≤ 8 ticků) · série DotRow sken a po něm +1 (`seriesPlate`) · 1600 CTA `[POKRAČOVAT]` zdola 24 pt `motion.reveal`. Vše plánované z UI vlákna (`uiAt`). Tap kamkoli / pozadí = konečný stav za 150 ms. Reduce Motion: konečný stav jedním 200 ms prolnutím (CTA s ním), haptika success zůstává.
- Rozhodnul jsem sám:
  - Křivky `easeSafe` (bezier s ořezaným vstupem) pro animace spouštěné z efektů/handlerů: na webu první snímek dostal záporný čas a podložka tabu uskočila o −90 pt. Použito v tab baru, stisku dlaždice a `usePressFeedback`.
  - Nástup hlavičky mapy přes `Reveal` (shared value), ne layout `entering`: ten na webu nechal obal `position: absolute` a hlavička zmizela pod hero.
  - Kotouč oslavy je `state="current"` (záře + kometa) a dekorativní: oslava chce světlo; význam nese titulek. Scéna nepoužívá `Screen` (plná `base` by schovala pole), safe area ručně.
  - DotField dostal `wave` a `max`, DotPlate `touch`, `breath`, `intro`, DotRow/DotRing/DotMatrix `intro` (výchozí zapnuto), PlateNode `intro`. Test HoldTimer počká na doběh nástupu (fake timers).
  - Řada série v oslavě: celé týdny po 7 (1–3 řádky), popisek `copy.status.streak`.
- Otevřené: `Barbell.tsx`, `XpPop.tsx`, `GoldenFigure.tsx` a `TIMELINE_A` už scéna nepoužívá (smazání nechávám bossovi, GoldenFigure má test). Reakce opičky 15 (točí hlavou za kotoučem) a ostatní z §4.4 nejsou v tomto kroku. Haptika primární pilulky dál `cta` (medium).
- K ruční kontrole na zařízení: 60 fps oslavy (≈1 700 teček pole + ~250 v letu, derived na UI vlákně) na slabším Androidu; že svislý scroll mapy začatý na kotouči vyhraje a vodorovný švih kotouč roztočí (RN ScrollView + RNGH Pan); hmatový tik 30° při roztočení; vlna pod prstem v hlavičce mapy na iOS/Androidu (Manual gesto souběžně se scrollem a Pressable); 3D naklopení dlaždice (zatím žádná dlaždice s `onPress` na mapě, ověřit na obrazovkách fáze 2).

## qa-agent — QA fáze 1 Nothing Dot (db940b8..b1dac1b)
- tsc čisté, eslint čistý, jest 535/535 (po smazání mrtvých testů GoldenFigure).
- Smazáno mrtvé: components/lesson/Barbell.tsx, XpPop.tsx, GoldenFigure.tsx (+ test), TIMELINE_A z celebration.ts (nikdo neimportoval).
- Opraveno: haptika primární pilulky `cta` medium -> light (spec §2), test upraven.
- Ověřeno screenshoty: mapa light/dark, oslava dokončení dark/light/RM; SkiaGuard obaluje všechny dot komponenty; žádné hardcoded barvy v app/components.
- Otevřené: withSpring v profile/progress/birth/stage-up (neklikací prvky, OK); rozpis XP na oslavě se láme na 2 řádky (design-agent); na zařízení ověřit scroll mapy vs. roztočení kotouče a tick haptiku 30°.
- Verdikt: SCHVÁLENO s položkami k ruční kontrole.

## 2026-10-06 · boss · Nothing Dot fáze 1 (plán, integrace, rozhodnutí)
- Brainstorming s uživatelem → zadání `docs/prompts/2026-10-05-redesign-nothing-dot.md`, spec `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`, plán `docs/superpowers/plans/2026-10-05-nothing-dot-faze1.md`. Rozhodnutí uživatele: směr Nothing Dot + prvky widget dlaždic, opička zůstává barevná, žádný akcent, dark i light, tečkový kotouč se pomalu točí, interaktivita (vlna teček, roztočení kotouče, opička ~15 reakcí ve fázi 3), Skia.
- Základ (úkoly 1–4) psal boss: Skia + Doto, monochromní palety se zachovanými klíči (stávající komponenty se přebarvily bez přepisu), tokeny Doto/dlaždic/pohybu, `components/dots/geometry.ts` (TDD).
- Integrace: web nejel (Skia při importu sahá na CanvasKit) → `index.web.js` načte `LoadSkiaWeb` z `public/canvaskit.wasm` a appku vyžádá až potom; `package.json` `main` = `index`. Jest: oficiální mock Skia neexportuje komponenty → vlastní atrapa (design-agent); lucide v jestu globální Proxy mock. Po odebrání Grain zůstaly v 4 tabech text nody `}    </View>` → opraveno.
- Rozhodnuto bossem: Skia install skript schválen (`allowScripts` v package.json, na pokyn uživatele); QA smazala mrtvý kód staré oslavy (Barbell, XpPop, GoldenFigure, TIMELINE_A); haptika `cta` = light podle spec (sdílí ji i tap na kotouč); rozpis XP v oslavě s nezlomitelnými mezerami uvnitř položek.
- Rating kolo 1 = 15/100. Opraveno: dev sekce Tečky, popover uzlu v tečkovém jazyce, copy „Zítra · …“, komentář Plate.tsx, README sekce vzhledu, tento zápis.
- Otevřené: onboarding (překryv lead textu a díra mezi kartami) → fáze 2; reakce opičky → fáze 3. Metro na tomto stroji nesleduje změny spolehlivě (restart `--clear`).

## qa-agent — QA Nothing Dot fáze 1 po ratingu kola 1 (2026-10-06)
- Udělal: `docs/QA.md` přepsán (úkoly 1–10 a Review Focus bod po bodu se spec), tsc/jest (535)/eslint zelené, snímky oslavy, `/dev` Tečky a popoveru v dark i light.
- Opravil sám: `components/map/LessonMap.tsx` — popover uzlu se schovával pod pruh s CTA (výřez nepočítal `footerSpace`, chyběl posun mapy, když se nevejde).
- Verdikt NESCHVÁLENO: dev Tečky „ZAMČENÝ“ rozbité na webu (limit WebGL kontextů?), HoldTimer „PŘIPRAV SE“ přes číslici a prstenec mimo střed, šedý závoj popoveru v light → design-agent.
- Otevřené: Metro :8081 nesleduje změny, ověřováno na čerstvém serveru :8099.

## qa-agent — QA kolo 2 Nothing Dot fáze 1 (2026-10-06)
- Ověřeno `f63ac3c` na čerstvém :8081: dev Tečky OK, HoldTimer na středu se štítkem pod prstencem, popover bez závoje celý viditelný (dark i light). tsc/jest 535/eslint zelené. QA.md aktualizováno (úkoly 3, 5, 9, nálezy).
- Verdikt SCHVÁLENO. Otevřené pro fázi 2: limit WebGL kontextů na webu u mapy s více sekcemi/taby (nativ bez limitu).

## 2026-10-06 · design-agent · Nothing Dot fáze 2, Task 2 (Onboarding) a Task 7 (Nastavení a cíle), statika
- Onboarding rám: `StatusLine` KROK · 01/05 + `DotRow` 5 teček (rozsvícené = aktuální a hotové kroky) místo MeasureLine; Doto titulek, lead `muted`, obsah o `space.l` níž, pilulky ZPĚT/POKRAČOVAT (BigActionBar beze změny).
- Bug fáze 1 (lead přes 1. kartu, díra mezi kartami): všechny layout `entering={enterRise}` v onboardingu (rám, path, dream, milestones, CustomMilestoneForm) nahrazeny `Reveal` (choreo). Reveal animuje jen opacity/transform, obal zůstává ve flow. Zpoždění `stagger(i + 2)` navazuje na titulek a lead. Ověřit screenshotem 320×568.
- Karty volby: nový `components/onboarding/SelectTile.tsx` (plocha a hrana jako Tile, role `radio` + `checked`; Tile je `button`, proto vlastní Pressable s `useTilePress`). Výběr = hrana `text` `stroke.focus` jako vrstva + mono VYBRÁNO; štítek má řádek vyhrazený i nevybraný (průhledný), výběr nehýbe layoutem. ChoiceCard titulek `headline` místo `choiceTitle` (7 karet na 320 pt).
- Glyfy cest/vizí tečkové: `components/onboarding/dotGlyph.ts` (čistá geometrie: výplň na mřížce, obrys po obvodu, otvor), vykresleno jako jedna SVG cesta. Rozhodnutí: SVG, ne Skia, protože 7 karet + DotRow by na webu žraly rozpočet 12 pláten. Token `dots.glyph`.
- MilestoneChip: pilulka `tile` + `edge`, vybraný inverzní `text`/`onText` (checkbox s více volbami, proto výplň, ne hrana). Reminder: čas v dlaždici, Doto `hero` (jediné rozhodnutí kroku).
- Toggle: vypnutý `dotOff` + knoflík `muted`, zapnutý `text` + `onText`. SegmentedControl: pilulka `tile` + `edge`, vnitřní výběr `text`/`onText` odsazený `space.xs`, výška 56 = `size.pill`; popisek se smí zmenšit na 0.8 (4 jednotky na 320 pt). TextField: pilulka `tile` + `edge` výšky `size.pill`, fokus = hrana `text`, chyba = hrana `danger` (vrstva, bez posunu). CustomDreamField: víceřádková dlaždice radius `tile`.
- Nastavení: ScreenHeader (Doto + kulatý křížek 44), sekce CÍLE / VZHLED / PŘIPOMÍNKA / ODEZVA s mono štítky, řádky sekce v jedné dlaždici s vlasovou `rule`. Vzhled = SegmentedControl bez dlaždice (pilulka je sama plocha, dvojí oddělení by porušilo „jedno oddělení“). Test notifikace je řádek dlaždice, ne samostatné tlačítko. Chyba cílů = dlaždice s větou a [ZKUSIT ZNOVU].
- Cíle: GoalEditorFrame kicker mono + kulatý křížek 44; milníky v jedné dlaždici; upozornění na změnu cesty = statická dlaždice `raised` místo proužku.
- Otevřené / pro motion-agenta: rozsvícení nové tečky kroku po přechodu; crossfade hrany výběru a glyfu `muted → text` v SelectTile (dřív useSelectionProgress, teď staticky); zrození (birth.tsx) zůstalo plný kruh v `text`, převod na rozpad `DotRing` je pohybová práce. Tile nemá `selected`/`accessibilityRole` — pokud je chce i liga/sezóna, sjednotit později se SelectTile.

## 2026-10-06 · design-agent · Nothing Dot fáze 2, Task 3–6 a 8 (Liga, Progres, Sezóna, Profil a šatník, Stage-up), statika
- Tokeny: `size.tierRing` 72, `seasonRing` 120, `profileField` 248; `dots.podium/rule/activity/season/chart/pedestal/stageUp`; `dash.dots` (SVG tečkovaná linka); palety `goldDotOff/goldDotDim` (tečky na zlaté ploše). Nová primitiva `components/ui/DotRule.tsx` (tečková linka z View, bez plátna). `DotRing` dostal `onGold`.
- Liga: ScreenHeader „Liga“ + StatusLine (LIGA BRONZ · ● 6 D 2 H živě). Hero dlaždice: tvoje pozice Doto `hero` + „/ 30“, TierBadge vpravo, věta týdne. TierBadge = `DotRing` 72 s mono iniciálou, rozsvícený podíl = pořadí úrovně (1/7 … 7/7), ne ozdoba. Pódium = dlaždice se sloupci `DotRow` 3 tečky široké (podiumColumns 9/6/4), jen pro existující hráče, nikdo s XP = skryté. Řádky na `base` s vlasovou `rule` (ne před zónou/na konci), vlastní řádek = dlaždice s hranou `text` 2 pt (proužek zrušen). Zóny: šipka + mono + DotRule. LockedPreview a výsledek týdne jako dlaždice s pilulkami. CTA „Odcvičit lekci“ (původní věta by v pilulce přetekla 320 pt; věta zůstává jako hint).
- Progres: mřížka dlaždic přes `tileColumns`. Hero: aktivní dny (jediné Doto `hero`) + nejdelší série (`display`). Aktivita: dlaždice s `DotMatrix` 7×5 (activityCells), mono osa dnů, součet „N / 35“, prázdný stav = zhasnutá matice + věta. Milníky jako klikací dlaždice s DotRow 2×5 (1 tečka = 10 %). Váha: Doto hodnota, tečkový SVG graf bez spojnice, poslední bod větší se září (dark), cíl tečkovanou linií. Vize: dlaždice VIZE.
- Sezóna: hero dlaždice = odpočet Doto `displayXL` (pod 360 `hero`) + `DotRing` uplynulé části sezóny s mono %. Cíl: Doto hodnota + DotRow 2×10. Dny sezóny: `DotGrid` z View 14 na řádek (5 stavů dne DotRow neumí; bez plátna), legenda sdílí kresbu s mřížkou. Odměna dlaždice, zamčená do splnění (opacity.locked + „ODMĚNA · ZAMČENO“). SeasonBadge = jediné zlato (lem); iniciály v `text`, zlato jako písmo by v light nemělo AA. Cíl sezóny: volby jako dlaždice s hranou `text` + VYBRÁNO. Recap: DotField za snímky (mimo oslavnou inverzi), Doto čísla, pozice jako tečky z View (na inverzi se barvy obrací).
- Profil: opička na `DotField` (dotyková vlna) stojí na stohu tří `DotPlate` zploštělých scaleY 0.35 s podložkou `base` (vyšší kotouč zakryje nižší, stoh čte jako hmota). Statistiky 2×N (XP, stage / 3, série, nejdelší série) Doto `dotStat`; StreakBarbell z profilu odstraněn (série je dlaždice a živý údaj ve stavovém řádku). Odznaky v dlaždici, získaný = plný `text` kruh. Šatník: Doto titulek + kulatý křížek, náhled na DotField v dlaždici, dlaždice položek radius 28 s hranou, zamčené „ZAMČENO“, SourceBadge sezónní `seasonGold`. ProfileFrame tečkový (SVG).
- Stage-up: plocha `seasonGold`, `DotRing` 240 onGold rozsvícený do stage/3 s Doto `displayXL` číslem, opička celebrate sedí na spodní hraně, inkoust `onSeasonGold`. Stávající sekvence (smrštění, prasknutí, nástup) beze změny, jen na nových vrstvách.
- Mapa: popisek uzlu dostal nezlomitelné mezery uvnitř položek („+20 XP“ se nerozdělí).
- Rozpočet pláten: liga ≤ 5, progres ≤ 4, sezóna 2, profil 4, šatník 1, recap 1, stage-up 2. Mini opičky SVG.
- Pro motion-agenta: pódium sken sloupců zdola (DotRow intro je zleva), TierBadge spirála, rozpad starého DotRing ve stage-up na tečky (teď stávající prasknutí kruhu), crossfade hrany výběru v KindTile (season-goal) a vlastní dlaždici ligy, recap přechody (layout `entering` FadeIn* — na webu riziko jako onboarding), `justLocked` v sezóně taky přes `entering`. Tile nepodporuje `flex` na vnějším obalu (milníky v řádku můžou mít různou výšku).
- K ruční kontrole: stage-up kontrast bílých/černých teček na zlaté v obou režimech; podstavec profilu (překryv elips) na 320 pt; hero sezóny na 360 pt (displayXL + prstenec těsně vedle sebe).

## 2026-10-06 · design-agent · Nothing Dot fáze 2, QA ⚠️ N1–N3
- N1 Liga: pódium je první blok pod hlavičkou, dlaždice pozice + TierBadge pod ním a bez `minHeight` (kompaktnější). Odhad polohy vlastního řádku (`headerH` = výška celé hlavičky seznamu) a `intro.leagueScroll` motion-agenta beze změny: měří součet bloků, pořadí ho nemění.
- N2 Stage-up: nový režim pilulky `onGold` (PillButton, CtaAction/RoundCta, BigActionBar): primární = výplň `onSeasonGold` s popiskem nového tokenu `onGoldPill` (#F2F2EF, ~16:1), sekundární = obrys `onSeasonGold`. Hrana vůči zlatu ≥ 4.5:1 v obou režimech (test `onSeasonGold` na `seasonGold` už existuje). `onAccent` zůstává pro recap (inverze).
- N3 SeasonBadge: komentář `onAccent` opraven na inverzní plochu `accent` v recapu.

## 2026-10-06 · motion-agent · Nothing Dot fáze 2, Task 9 (pohybový průchod)
- Nástup obrazovek: `ScreenHeader`/`TabHeader` mají prop `intro` (Reveal `screenIn.headerAt`, 480 ms ease.out, zdvih 12); liga, progres, sezóna, profil (klíče `hdr:*` přes `useFirstShow`), nastavení a šatník (každé otevření). Nový `tileAt(i)` v choreo (hero 80 + 60 ms × (i+1), víčko `screenIn.maxTiles` 8). Sezóna: dlaždice cíl → dny → comeback → odměna po 60 ms. Onboarding reminder/weight: obsah ve sledu `stagger(2…)`.
- Layout `entering` odstraněn: recap (FadeInLeft/Right → `Reveal` se `shift` = směr × `motion.slideShift`, `motion.slide`; první snímek zdvih `intro.modal`), sezóna `justLocked` (→ `Reveal` zdvih `intro.lockIn.rise` 16). Zbývá jen scrim CelebrateOverlay (absolutní překryv, bezpečné) a lekce (mimo rozsah).
- Stisk: `CosmeticTile` a `KindTile` přešly z `usePressFeedback` na `useTilePress` (naklopení k prstu + rozjasnění hrany). `Tile`/`SelectTile` už měly. Výběr: `SelectTile` a `KindTile` prolínají hranu `text` 2 pt, štítek VYBRÁNO a glyf/název muted → text (`useSelectionProgress`, 180/150 ms); API `SelectTile.glyph` je teď funkce `(color) => node`.
- Liga: `DotRow` prop `from="bottom"` (prefix teček plní řádky odspodu); sloupce pódia rostou zdola, opička dosedne `intro.podium.mascotLag` 520 ms po startu sloupce (≈ po dorůstání, sloupec = `dotScanMs` 600). Scroll k vlastnímu řádku: jen když řádek leží za 2 výškami okna (`intro.leagueScroll.screens`), při prvním otevření až po nástupu pódia (`afterMs` 1400), jinak 350 ms; obrazovka jinak začíná nahoře s pódiem.
- Progres: hero čísla napočítají (`useCountUp`, `motion.countMs` 700, hero 80 / 140). Sezóna: odpočet a % prstence napočítají se spirálou (`SeasonHeader`).
- Onboarding: tečka aktuálního kroku se rozsvítí `intro.stepDot.at` 380 ms po mountu (po přechodu), předchozí svítí hned; omezený pohyb svítí rovnou. Zrození: plný kruh → `DotRing` (spirála od `INFLATE_AT`, pop pružinou `motion.pop`, nádech), v `BURST_AT` se rozpadne na tečky přes nový `components/dots/DotBurst.tsx` (`motion.dotBurst`: inner 0.7, outer 0.45, jitter 0.3, 560 ms ease.punch).
- Stage-up: nová osa `stageUp` (lib/motion): opička se stáhne 300–600, prstenec se nadechne 0.96, v 620 ms se vnitřní prstenec rozpadne na tečky (`RingShatter`, 1 plátno), které po oblouku (výlet +32 % ± 35 %) a pootočené o jednu stage dosednou do nového prstence za 900 ms (rozsvícení se přepne ze stage/3 na nový stage/3); v 1520 nový prstenec převezme, opička pružinou `motion.pop`, haptika tick při rozpadu a success při doletu; text 1800, CTA 2000. Reduce Motion: finální stav, fade 200 ms. Plátna stage-up 3.
- Ověřeno: tsc, jest (548), eslint zelené; web snímky ligy (pódium roste zdola, bez scrollu), stage-up (sekvence), sezóna, cíl sezóny.
- Otevřené / k ruční kontrole: stará opička stage-up na webu v 1. snímku (200 ms) nebyla vidět — ověřit na zařízení; plynulost RingShatter a DotBurst na slabém Androidu (worklet přepočítává ~50–300 teček za snímek); scroll ligy s vlastním řádkem za 2. obrazovkou (demo profil má 6/16, nescrolluje); goal editory animují obsah jako jeden blok (bez vlny po dlaždicích).

## 2026-10-06 · qa-agent · QA Nothing Dot fáze 2
- tsc/jest (548)/eslint zelené; úkoly 1–9 ✅, Review Focus ✅ (web taby 2× bez ztráty WebGL, onboarding 320×568 bez překryvu, plátna ≤ 4 na obrazovku).
- Verdikt SCHVÁLENO. Otevřené (design-agent): N1 pódium ligy není první blok, N2 hrana CTA na zlaté v light ~2.1:1, N3 zastaralý komentář SeasonBadge. Kód neměněn. Detail v `docs/QA.md`.

## 2026-10-06 · boss · Nothing Dot fáze 2 (plán, základ, integrace, rozhodnutí)
- Plán `docs/superpowers/plans/2026-10-06-nothing-dot-faze2.md` (10 úkolů). Rozdělení: boss Task 1 a čistá logika Tasků 3–4, dva design-agenti paralelně na oddělených souborech (A: onboarding, nastavení, cíle; B: liga, progres, sezóna, profil, šatník, stage-up), pak motion-agent, QA, rating.
- Task 1, rozpočet Skia pláten: `components/dots/canvasBudget.ts` (`shouldMountCanvas`, test) a `SkiaGuard` na webu kreslí jen na zaostřené obrazovce (NavigationContext z `expo-router/build/react-navigation/core`; `useIsFocused` mimo navigaci hází). Ověřeno: 5 tabů 2× dokola → mapa 10 pláten, žádné varování WebGL.
- Čistá logika (TDD): `components/league/podiumLayout.ts` (`podiumColumns`) a `components/progress/layout.ts` (`tileColumns`, `activityCells`). Rozhodnuto: `podium.ts` přejmenováno na `podiumLayout.ts`, protože na Windows kolidovalo s `Podium.tsx` (stejné jméno až na velikost písmen).
- Integrace: copy funkce s řetězcovým 1. argumentem obaleny `String(...)` (typografický test je volá s číslem); nezlomitelné mezery v nových textech („z {n}“, „a rámy“). Test kontrastu CTA na `seasonGold` (hrana ≥ 3:1, popisek ≥ 4.5:1). `motion.instant` místo `{ duration: 1 }` ve stage-up.
- SPEC §6 přepsán na Nothing Dot (§6.1–6.8, detail ve spec dokumentu), §7 opraveny zastaralé termíny (Bebas, akcent, litina) a sled oslavy lekce.
- Rozhodnuto bossem: liga začíná pódiem (QA N1), CTA na zlaté = tmavá pilulka `onGold` (QA N2).
- Otevřené: fáze 3 (15 reakcí opičky, `logic/mascotReactions.ts`); na zařízení ověřit plynulost RingShatter/DotBurst, stage-up CTA, scroll ligy k vlastnímu řádku za 2. obrazovkou, fontScale 1.4.

## 2026-10-06 · qa-agent · QA Nothing Dot fáze 2, kolo 2 (HEAD f34446a)
- Ověřeny 37b0f5b a f34446a: tsc, jest (552) a eslint zelené. Liga má pódium jako první blok (320 i 390, dark i light). Stage-up CTA `onGold` má kontrast ~7.6:1 vůči zlatu. Ostatní CTA (`onAccent` a výchozí) beze změny, `motion.instant` dává stejné časování.
- N1–N3 OPRAVENO. Verdikt SCHVÁLENO pro HEAD. Kód neměněn.

## 2026-10-06 · motion-agent · Nothing Dot fáze 3, Task 2–3 (15 reakcí opičky)
- Přehrání: `components/mascot/reactionMotion.ts` (`useReactionMotion`) + `SvgMascot` props `reaction {id,key}`, `gaze` (bod prstu v souřadnicích okna, ne plátna: sdílí ho celá obrazovka a opička se změří přes `measure`), `spin` (úhel kotouče). Bez nových kreseb: celé tělo (zdvih, zmáčknutí, vypnutí, salto kolem středu, náklon kolem chodidel), skupina hlavy (uši, lebka, obličej; pokrývky hlavy stejnou maticí) natáčená kolem krku (web `transform`, nativ `matrix`), pupily ±3/±2.5, zavření očí, přídavek k `droop`, dočasné přebití nálady (+ hrana šálu, spánek = pomalý hluboký dech i tam, kde `breathe={false}`). Nový klíč reakci přeruší, co nepoužije, dosedne do klidu (`motion.ui`).
- Hodnoty `motion.reactions`: hop 0.12 (časy `motion.hop`); flip výška 0.34, 90/280/300/70/220 ms, squash 0.1, −360° inOut cubic; cuddle squeeze 0.06, 160 + 1100 ms; gaze reach 140 pt, hlava ±6° a 2; lookDown droop 700 ms; dizzy ±12°, 6 × 110 ms, útlum 0.72; sleep oči 500 ms, hlava −3, dech 2200 ms / 0.03; wave ±7°, 3 × 170 ms; nod 2 × (5 dolů 110 / 160); celebrate 1800 ms; proud scaleY +0.06, zdvih 0.03, 240 + 900 ms; sad 2000 ms + povzdech (víčka 0.45, hlava 3); joyJump 0.3, squash 0.12, 120/240/260/70/260; shrug zdvih 0.035, hlava 10°, 160/340/220; spinFollow hlava ±10°, 2600 ms. Návraty hlavy a pupil pružinou `spring.sal`. Všechny sekvence mají `ReduceMotion.Never` (kvůli očím a náladě), pohyb těla v Reduce Motion nepouštíme: `degrade` v hooku i v přehrávači, proud/cuddle/sleep/sad/gaze bez pohybu těla a hlavy.
- `useMascotReactions(focused)`: `report`, `tap`, `poke`, `reaction`, `gaze`, `touch` (Manual, nikdy se neaktivuje). Nečinnost jen při focused (`IDLE_MS`), spánek do dalšího doteku; `appReturn` přes AppState; haptika `mascotTap` (selection) pro hop, `mascotJoy` (success) pro flip a joyJump (nové id v `lib/feedback`). `useScreenFocused` přes NavigationContext (mimo navigaci true). Worklety berou jen sdílené hodnoty (žádný objekt s gestem).
- `ReactiveMascot`: Exclusive(LongPress 450 ms, Tap), `runOnJS`; pro čtečku tlačítko s nápovědou `copy.mascot.playHint` a akcemi activate/longpress; `seated` = MonkeyBack + MonkeyFront.
- Napojení: mapa (sedící opička = ReactiveMascot, obal opičky `box-none` místo `none`; gaze z dotyku celé obrazovky přes `Gesture.Simultaneous(field, reactions.touch)`; scroll → rychlost z `onScroll`, programový scroll 700 ms ignorován; roztočení aktuálního kotouče → `PlateNode` `spinOut`/`onSpinStart` → spinFollow; ztráta série při otevření → sad; start lekce → nod). Oslava lekce: lessonDone → celebrate, streakUp za `max(sken série, REACTION_COOLDOWN_MS)` → proud. Liga: výsledek minulého týdne → joyJump/shrug u vlastní opičky v pódiu i řádku (po 1400 ms při prvním zobrazení). Profil: velká opička = ReactiveMascot, gaze po celém hero.
- Ověřeno na webu (Playwright, restart Metro --clear): tap = poskok (−6.6 pt na 56 pt), vytrvalé ťukání = salto (roll až 360°), podržení = oči zavřené + zmáčknutí, tah prstu = hlava ±4° a pupily za prstem i návrat, scroll dolů = droop, rychlý scroll = hlava ±12°, nečinnost 20 s = spánek, dotek probudí; profil tap/podržení/pohled. Bez chyb v konzoli. tsc, eslint, jest (614) zelené; nový test `components/mascot/__tests__/reactions.test.tsx`.
- Pro bosse (logika, neměnil jsem): trojité ťuknutí po klidu salto nespustí. První ťuknutí zahraje hop a cooldown 1200 ms zahodí 2. i 3. ťuknutí (flip má prioritu 4 < 5). Salto přijde jen při ťukání přes celý cooldown. Návrh: v cooldownu povolit flip, když právě hraje hop. Dále `touchMove` přes `pickReaction` nehlásím: gaze by spustil cooldown a zablokoval následný tap. Pohled za prstem běží souvisle mimo logiku.
- Otevřené / k ruční kontrole: lekce nemá opičku, nod hraje opička na mapě při startu (pod přechodem skoro neviditelný). Mapa na webu nejde scrollovat kolečkem (ScrollView má `overflow: hidden`, je to tak i před fází 3). Nativ (Expo Go): matice hlavy (`matrix` na G), measure pro gaze, Tap/LongPress uvnitř ScrollView a 60 fps salta na slabém Androidu.

## 2026-10-06 · boss · Nothing Dot fáze 3 a podněty z Expo Go
- Plán `docs/superpowers/plans/2026-10-06-nothing-dot-faze3.md`. Logika reakcí `logic/mascotReactions.ts` (TDD). Rozhodnuto bossem na podnět motion-agenta: v cooldownu smí salto přebít poskok, jinak trojité ťuknutí z klidu nikdy salto nespustilo (testy logiky i hooku upraveny: 10 rychlých ťuknutí = poskok a jedno salto).
- Uživatel testuje v Expo Go na iPhonu (tunel Cloudflare, ngrok v expo nefunguje):
  1. Pád mapy na nativu „[Worklets] Cannot copy value of type PanGesture“: worklety v PlateNode zachytávaly celý objekt z `usePlateSpin` včetně gesta. Opraveno rozbalením sdílených hodnot. Na webu se to neprojevilo, protože web worklety nekopíruje.
  2. Křížek lekce ležel pod hodinami (iOS fullScreenModal, SafeAreaView nepromítla horní výřez): `LessonProgress` odsazuje přes `useSafeAreaInsets`, křížek je kulaté tlačítko `tile` s hranou jako v ScreenHeader.
  3. Přepínání tabů přejetím prstem po tab baru (`FloatingTabBar`, Pan s `motion.tabScrub.activeOffset` 6, podložka jede za prstem, tab se přepne při přejetí do slotu přes stejný `tabPress` jako tap).
- Metro „nesledoval změny“ jen kvůli `CI=1` (CI režim vypíná watch); Expo Go server běží bez něj.
- SPEC §8 doplněn o tabulku reakcí.

## 2026-10-06 qa-agent: QA fáze 3 (reakce opičky)
- tsc/eslint/jest (616) zelené, web smoke (10x ťuknutí, tap pod opičkou otevře lekci, taby) OK. Verdikt SCHVÁLENO.
- Opraveno: FloatingTabBar dosednutí podložky při zablokované navigaci; useMascotReactions bez re-renderu při každém scrollu, spánek se po zahození zkusí znovu; SvgMascot záporné ry očí.
- Otevřené: tah po tab baru jen ručně na iPhonu (na webu ho nejde ověřit); AppState listener ztrácí leftAt při změně focusu (drobnost, motion).
- Incident: při restartu webového Metra jsem omylem zabil všechny node procesy (`taskkill /IM node.exe`), tím i Expo Go server na 8082, a pustil ho znovu bez tunelu. Boss ho vrátil do původního stavu. Dál jen 8081.

## 2026-10-06 · design-agent · Kompaktní hlavička mapy (podnět z iPhonu)
- Hlavička + hero dlaždice + karta první lekce braly ~60 % výšky, cestě zbyla jedna lekce. Cesta je subjekt obrazovky.
- `SectionHero` už není dlaždice: jeden tenký řádek `DotRow` teček sekce (flex) + mono `label` „0 / 9“ vpravo (muted). Velké Doto číslo pokroku zrušeno; nejsilnějším Doto prvkem je titulek sekce, nejsilnější plochou pilulka CTA.
- `ScreenHeader` má nový prop `singleLine` (1 řádek, `adjustsFontSizeToFit`, `minimumFontScale` = nový token `fontScale.titleMin` 0.65). Ostatní obrazovky beze změny (dál 2 řádky).
- Karta „První lekce“ odstraněna (minuty a XP nese popisek aktuálního uzlu). Klíče `copy.map.firstTitle/firstBody`, `copy.hero.name/next/allDone` se přestaly používat, `data/copy.ts` nezměněn (překlad).
- Zachováno: Reveal sled `intro.hero` (tečky → číslo), nástup hlavičky, DotField + useDotTouch, scroll, kotva opičky. Pole za hlavičkou nechávám ve stejné výšce (je absolutní, výšku nebere).
- Otevřené: karta „přerušená série“ (sad) zůstává, při ní se mapa zase zkrátí; na webu se dlouhý titulek jen zkrátí výpustkou (adjustsFontSizeToFit je jen nativní). Ověřit screenshotem 390×844, že nad CTA jsou ≥3 kotouče.

## 2026-10-06 · translation · English UI
**Co:** Celé uživatelské UI přeloženo do angličtiny: `data/copy.ts` (vše), `data/badges|cosmetics|exercises|leagues|leagueUsers|milestones|paths|lessons/*`, natvrdo psané texty v `lib/notifications.ts` (Android kanál „Reminders“), `hooks/useLessonPath.ts`, chybové zprávy `services/mock/*`, demo profil (`demoData.ts`). Datum v Dev menu `en-US` (24h čas ponechán), datum narození `M/D/YYYY`, týden/sezóna `M/D`, desetinná tečka místo čárky (progress, WeightChart, season/format, season-goal, goals.kg). Testy s českými očekáváními aktualizovány.
**Rozhodnutí:** `czPlural(n, one, few, many)` nahrazeno `plural(n, one, other)`; pomocník `days(n)` drží „12 days“ s nezlomitelnou mezerou. `typography.test.ts` přepsán: české pravidlo o jednopísmenných slovech v angličtině nedává smysl → nově hlídá žádné dvojité/okrajové mezery, žádnou zbylou diakritiku a nezlomitelnou mezeru mezi číslem a jednotkou (XP, min, kg, s, day(s), minute(s)) v generovaných textech. Mono štítky zůstávají verzálkami, akce v sentence case. Jména soupeřů v lize poangličtěna. Boss lekce „Plná osa“ → „Boss: Full bar“.
**Otevřené:** `logic/` nebylo dotčeno (zákaz): `logic/badges.ts` (`badgeCondition` — viditelné podmínky odznaků „Dokonči první lekci“…), `logic/goals.ts` (`retarget` skloňuje české tvary `NUMERAL_FORMS`; s anglickými předvolbami dá „1 pull-ups“), `logic/dates.ts` `formatCzDate` (už nepoužito v UI), chybové zprávy v `logic/completion.ts` a `logic/dates.ts`. `console.warn` hlášky (dev log) ponechány česky. `docs/SPEC.md` je dál česky.

### qa-agent — po fázi 3: reset, mapa, angličtina (2026-10-06)
**Co:** QA commitů 76f7ad3..f0381e3: tsc/eslint/Jest čisté; Playwright reset flow (stav smazán, téma zůstává, onboarding), mapa 390/320, sken češtiny/přetečení všech obrazovek. Verdikt SCHVÁLENO, detail v `docs/QA.md`.
**Rozhodl sám:** opravil české podmínky odznaků v `logic/badges.ts` (streak, exercise) + test.
**Otevřené:** usekávání názvu sekce na 320 a visící `·` v info uzlu (design-agent); české `Error` zprávy v `logic/completion.ts` a mrtvá `formatCzDate` (boss).

## 2026-10-06 · design-agent · Mapa přes celou výšku, hlavička jako překryv
**Co:** `app/(tabs)/index.tsx`: LessonMap absolutně přes celou obrazovku (záporný `marginBottom` = `tabBarClearance`, jede i pod tab barem), hlavička + SectionHero (+ karta „broken“) jsou překryv nahoře (`onLayout` → `overlayH`). Mapa se mountuje až se změřeným překryvem (úvodní dojetí na uzel počítá se správným výřezem). Nový `components/ui/EdgeFade.tsx` (SVG lineární závoj barvy `base`, ne Skia → rozpočet WebGL pláten beze změny). `LessonMap`: prop `topInset`; obsah v obalu s `marginTop: topInset` (absolutní děti by paddingTop ignorovaly), takže souřadnice uzlů/opičky/popoveru zůstaly; `scrollToNode` = `p.y − 0.4 × (viewportH − topInset)`; `popoverSide` spodek výřezu `scrollY + viewportH − topInset − footerSpace`. Scroll reakce opičky (rychlost) a ignorování programového scrollu beze změny (nezávisí na poloze). Pod CTA zrušen plný pruh `base`: jen jemný závoj `veilEdge → 0`. `footerSpace` = tab bar + pilulka.
**Rozhodl sám:** varianta (a) vyblednutí, ne blur: závoj nahoře plný (status bar), na spodní hraně hlavičky `opacity.veilEdge` 0.72, pod ní za `size.edgeFade` 40 do nuly — cesta pod titulkem tlumeně prosvítá (hloubka), titulek zůstává čitelný. Tečkové pole zůstává statické v hlavičce (oříznuté na její výšku, nad závojem): ve ScrollView by vlna z dotyku potřebovala přepočet o scroll a pod závojem by pole stejně zmizelo; podpis hlavičky tak zůstává ostrý. NodeLabel: oddělovač ` · ` (nezlomitelná mezera před tečkou). `fontScale.titleMin` 0.65 → 0.6 (24 pt; „Strength basics“ 15 znaků na 272 pt) a nový `fontScale.dotAdvance` 0.68: na webu ScreenHeader `singleLine` dopočítá velikost z šířky řádku (web neumí adjustsFontSizeToFit).
**Otevřené:** Doto 24 pt jde pod pravidlo „Doto ≥ 28“ (jen nejdelší názvy na 320 pt) — boss rozhodne; `dotAdvance` je odhad, ověřit screenshotem 320 web. Ověřit na iPhonu: pohled opičky (`measure` + absolutní souřadnice) po změně rozvržení, závoj v light režimu.

## 2026-10-06 · motion-agent · Reaktivní pozadí všude
**Co:** Nový `components/dots/ReactiveBackground.tsx`: kořen obrazovky = `GestureDetector` s `useDotTouch` (Manual, nikdy se neaktivuje → scroll/tapy/další gesta souběžně) + celoplošné `DotField` absolutně v kořeni (nescrolluje, dotek v souřadnicích kořene), 1 Skia plátno, `pointerEvents` none. Klid: `dotOff` × `dots.background.restOpacity` 0.5, bez glow; pod prstem odsun ≤ `motion.ripple.push` 4 pt + rozjasnění `motion.ripple.lit`, nástup `motion.press`, doznění `motion.ripple.decayMs` 500 ms ease-out. Reduce Motion: pole statické. Celá plocha pod stropem `dots.field.max`: rozteč se zvětší (`backgroundPitch` v `geometry.ts`, 390×844 ≈ 23,5 pt; test). `DotField` nové props `ink` (vlastní barvy) a `restOpacity`. `Screen` nové props `background` ('base'|'gold') a `transparent`. Zapojeno: liga, progres, sezóna, profil (staré pole za opičkou odstraněno, gesto reakcí opičky zůstává), nastavení, editory cílů (`GoalEditorFrame`), šatník (`Screen background`), cíl sezóny, recap (celoplošně místo poloviny; na oslavné inverzi skryté přes `visible`), onboarding (`OnboardingFrame`), lekce (pod kartou cviku), stage-up (`tone="gold"`: `goldDotOff` klid, `goldDotDim` pod prstem).
**Rozhodl sám:** řídší rozteč místo zvednutí stropu (výkon); token `dots.background.restOpacity` v theme (design-agent může doladit); náhled v šatníku si nechal vlastní pole v dlaždici. `ScreenHeader` nebyl potřeba (kořeny obrazovek).
**Otevřené:** mapa (`app/(tabs)/index.tsx`) nedotčena — design-agent. Ověřit na iPhonu: scroll a tapy přes pozadí na všech obrazovkách, swipe recapu, kotouč/tlačítka lekce, plátna na webu (≤ 12).

## 2026-10-06 · motion-agent · Dokončení lekce: delší oslava a vlastní haptický podpis
**Co:** `motion.lessonDone`: fieldMs 640→800, gatherMs 700→1100, twist 1.6→2.6 (vír), gatherStagger 0.4→0.45, snapAt 900→1300, mascotAt 1000→1450, countMs 700→900, ctaAt 1600→2600, swellFrom 0.55→0.6; nové `shockWaveMs` 900, `spinKick` {0.6 ot., 1400 ms}, `crescendo` {7 tiků, 0.15–0.95 gatherMs, od 4. light}, `successAfterSnap` 110, `heartbeatGap` 120. `celebration.ts`: `celebrationHaptics(reduced)` (crescendo selection→light se zrychlujícími odstupy ∝ √, heavy v nacvaknutí, success +110 ms, heartbeat medium→light po doběhu XP 2350/2470 ms; reduced = jen success). `LessonCompleteScene`: haptika plánovaná z UI vlákna (`uiAt`), přeskočení zruší zbytek; při nacvaknutí rázová vlna polem z kotouče (`DotField.waveOrigin`, nový prop) s rozzářením; kotouč se roztočí ease-out a zpomalí do ambientní rotace (`withSequence` + `withRepeat`); tik zvuku na každém kroku XP (ne po přeskočení). Opička dál reakce `celebrate` (nejvyšší priorita), série scan tečka po tečce beze změny. Test `celebration.test.ts` (osa, pořadí, haptický podpis, reduced).
**Rozhodl sám:** XP tik jen zvukem (haptiku nese podpis, ať se heartbeat neslije s tiky); success nechán i na nacvaknutí (potvrzení), ale až po heavy. Starý APPROX `lesson-complete` nedotčen (scéna ho nepoužívala).
**Otevřené:** pocit haptiky ověřit na iPhonu (Expo Go: selection/light tiky mohou být slabé); celková délka 2,6 s do CTA — tap kamkoli dál přeskočí.

## 2026-10-06 · qa-agent · QA a309eb2..8b0b325 (tab bar swipe, demo skip, mapa pod hlavičkou, tečkové pozadí, oslava)
**Co:** tsc/jest (623)/eslint zelené; Playwright web 8081 dark+light: demo lekce přeskočením doběhne do oslavy (+44 XP, série +1), plátna mapa 10 / lekce 4 / oslava 4; revize kódu tab baru a oslavy (přeskočení, pozadí, reduced, haptika vyp.). Verdikt SCHVÁLENO.
**Rozhodl sám:** nic neopraveno (bez chyb v logice).
**Otevřené:** design-agent — slabý závoj pod titulkem mapy; boss — Skip v demu skrytý při běžícím časovači; ruční kontrola haptiky na iPhonu.

## motion-agent: život opičky v klidu (idle repertoár, kontext, sekundární pohyb)
- **Idle repertoár** (`logic/mascotIdle.ts` čistý výběr s injektovaným `rng`, `components/mascot/useMascotIdle.ts` plánovač, přehrání v `reactionMotion.ts`). Hodnoty `motion.mascotIdle`. Pauza 4–12 s (pódium 2.5–6 s), poslední akce se neopakuje. Akce: `lookAround` (hlava ±7°, pupily ±0.9, 280/440/520 ms), `doubleBlink` (70/100, mezera 120), `stretch` (scaleY +0.07, zdvih 0.025, víčka 0.5, 420+380 ms), `sway` (náklon kolem chodidel ±4°, 4 půlkmity po 420 ms), `headScratch` (hlava 9° + 2× pokývnutí 2 u po 140 ms), `joyHop` (výška 0.07, časy `motion.hop`), `lookPlate` (jen sedící na mapě: pupily dolů, hlava dip 3, 320+900 ms), `yawn` (jen po ≥ 13 s nečinnosti, před usnutím ve 20 s: hlava dozadu 3, víčka 0.8, protažení 0.05, 520/900/520 ms). Návraty pružinou `spring.sal`.
- **Pravidla**: jen na zaostřené obrazovce, nikdy ve spánku a do `busyMs` 3.5 s od začátku reakce; reakce používá stejné sdílené hodnoty, takže idle přeruší (cancelAnimation) a má vždy přednost. Omezený pohyb: plánovač vrací null (zbude jen mrkání). setState jen jednou za akci, animace na UI vlákně.
- **Kontext**: mapa — pohled za směrem scrollu (`scrollLook`, pupily 0.8 + hlava 2.5, plná výchylka při 1500 pt/s, sdílená hodnota bez setState); po dlouhém roztočení kotouče (≥ 3 otáčky během `spinFollow`) se jí zatočí hlava (kývání `reactions.dizzy`). Profil: při zaostření zamává (nová událost `screenOpen` → `wave`, po 450 ms; omezený pohyb přes `degrade` → pohled). Liga: vítěz pódia je `IdleMascot` s kontextem `podium` (kratší pauzy, poskok váha 6).
- **Přechod nálad**: při změně výrazu mrknutí (70/120 ms) a přikrčení scaleY −0.025 (110 ms) s pružným návratem. **Sekundární pohyb**: uši (strop 5 u) a konec šálu (strop 7 u) dojíždí za tělem pružinou `follow` (damping 9, stiffness 140) při poskoku, zdvihu i náklonu — transformace stávajících tvarů, žádné nové kresby.
- Rozhodnuto samo: událost `screenOpen` v `logic/mascotReactions.ts` (malý zásah do logiky); Podium přepíná jen komponentu vítěze (layout beze změny); ve SvgMascot/reactionMotion přepsáno `x.value = …` na `x.set(…)` (React Compiler lint po předání hodnot do workletů).
- Testy: `logic/__tests__/mascotIdle.test.ts`, `components/mascot/__tests__/idle.test.tsx` (výběr, pauzy, determinismus, přerušení reakcí, Reduce Motion, spánek, přehrání všech akcí ve všech vrstvách). tsc, jest (651), eslint zelené.
- Otevřené / k ruční kontrole: viz report (iPhone: plynulost uší/šálu, četnost idle, zamávání při každém návratu na profil).

## 2026-10-06 · boss · Barevný systém (color grading + kontrast)
- Zadání uživatele: kompletní color grading a kontrastní systém. Rozhodnutí uživatele: držet monochrom (bez primary/secondary/accent), dokument + rovnou do appky, export TS tokeny + CSS proměnné.
- Grading: chladný grafit, neutrály OKLCH h 255 / C ≤ 0.006, aby teplá opička (jediná barva) vystoupila. Hodnoty spočítané skriptem (OKLCH→sRGB, WCAG 2.2, APCA Lc, Machado CVD simulace), dokument `docs/design/color-system.md`, CSS `docs/design/color-system.css`.
- `theme/palettes.ts`: přebarvené neutrály v obou režimech (stejné klíče), nové `borderStrong`, `focus`, `disabled`, `stateSuccess/Warning/Info`. `success` v UI zůstává = `text` (monochrom), stavové barvy jen pro skutečné stavy a data.
- Opravy kontrastu: vlasové hrany zůstávají dekorativní (výjimka WCAG 1.4.11), ovládací prvky dostaly `borderStrong` ≥ 3:1 (TextField, vypnutý Toggle s hranou); terciární text v light ztmaven na 4.5:1.
- Testy kontrastu rozšířeny (terciární text, borderStrong, fokus, stavové barvy).

## 2026-10-06 · boss · Demo skip během časovače, závoj mapy (commit 3dc9561)
- Na podnět QA: v demo profilu se tlačítko Skip v lekci ukazuje i během odpočtu a běžícího časovače (`ExerciseStep` prop `alwaysSkip`, `app/lesson/[id].tsx`); normální profil beze změny (Skip skrytý, dokud časovač běží, a hlídá ho `canSkip`).
- Na podnět QA (čitelnost hlavičky mapy v dark): `opacity.veilEdge` 0.72 → 0.86 (závoj pod hlavičkou i za CTA). Rozhodnuto bossem, design token v theme.
- Rozhodnutí: Doto titul mapy smí na 320 pt klesnout na 24 pt (`fontScale.titleMin` 0.6) — výjimka z „Doto ≥ 28 pt“, lepší než useknutý název.

## 2026-10-06 qa-agent: QA 43cb2db/25f442e/c3ca0d8/3dc9561
- tsc/jest(673)/eslint OK, expogo.log bez ERROR. Web: jedno kliknutí přepne tab (obě schémata), demo skip během časovače OK, barvy čitelné.
- Opraveno: chybějící `aria-selected` na tabech na webu (FloatingTabBar).
- Verdikt SCHVÁLENO. Otevřené: ruční kontrola na iPhonu (tah, VoiceOver, plynulost idle).

## 2026-10-06 · boss · Elite fáze 0 — workflow
- Plán `docs/superpowers/plans/2026-10-06-elite-faze0-workflow.md`, spec `docs/superpowers/specs/2026-10-06-elite-faze0-workflow-design.md`. Rozhodnutí uživatele: web pro agenty, telefon (Expo Go) testuje uživatel, žádné placené služby, shell pro agenty + hooky + CLAUDE.md, nová rubrika.
- Task 1: ochranný hook `.claude/hooks/guard.mjs` (+16 testů `node --test`): blokuje zabití všech node / cloudflared / PID na 8082, Metro s CI=1 (jen skutečné spuštění — první verze blokovala i text v heredocu, zpřesněno), přepis QA/LOG (Write, `>`, Edit mimo připsání). Registrace `.claude/settings.json`.
- Task 2: ESLint `local/no-worklet-object-capture` (+RuleTester), v kódu rozbaleny hodnoty doteku v DotField/DotMatrix/DotPlate.
- Task 3 (qa-agent, dokončil boss po limitu agenta): Playwright v `e2e/` — toky, vizuální regrese (baseline), měření. Rozhodnutí bosse: měření výkonu běží proti produkčnímu exportu (`dist/`, `e2e/serve-dist.mjs`, port 8083), protože dev server posílá nezmenšený 16MB bundle (TTI 32 s by nic neříkalo). Naměřeno: plátna mapa 10 / liga 5 / progres 5 / sezóna 3 / profil 4 / nastavení 1 / lekce 4; TTI mapy 1671 ms; fps mapa i oslava 60. Limit testu 180 s (toky přenačítají dev bundle, ~1.5 min na tok).
- Task 4: agenti — design-agent má Bash a estetiku Nothing Dot, všichni ověřují sami (tsc/jest/eslint/e2e), QA připisuje (dřívější zadání „přepiš předchozí“ způsobilo smazání historie QA.md), nová rubrika ratingu (4 brány + 7 kategorií, výjimka 85/85 „čeká na iPhone“).
- Task 5: CLAUDE.md pravidla, README sekce Testy, HANDOFF (Expo bez --clear + prewarm).
- Otevřené: e2e toky jsou pomalé kvůli dev bundlu (zvážit toky proti produkčnímu exportu tam, kde nepotřebují dev menu).

### qa-agent — QA elite fáze 0 (HEAD a7e39c7)
NESCHVÁLENO: tsc/jest (682)/eslint/guard testy (16)/e2e:perf (4) zelené, hook živý, nativní log bez ERROR. `npm run e2e` 52/80 timeoutů proti pomalému Metru na 8081 (0 vizuálních diffů). Otevřené: stabilita e2e vůči dev serveru, PowerShell Stop-Process v hooku, false positive hooku na text v heredocu.
- Doplněno: hook blokuje Edit-připsání u CRLF souboru (docs/QA.md) — viz QA.

## 2026-10-06 · boss · Fáze 0 — opravy po QA (NESCHVÁLENO pro a7e39c7)
- e2e celé (toky + vizuální + perf) běží proti produkčnímu webovému exportu (`dist/` přes `e2e/serve-dist.mjs` na 8083), ne proti Metru: QA kolo mělo 52 timeoutů (16MB dev bundle, paralelní workery, souběh s Expo Go na 8082) a souběh shodil i Expo Go server uživatele. Teď 80/80 za 3.0 min, dvakrát po sobě; perf 4/4 (28 s). Skripty `e2e*` export vytvoří předem.
- Baseline snímků vědomě přegenerována (`npm run e2e:update`) na produkčním buildu — důvod: změna cílového buildu, ne změna UI.
- Hook: Edit s CRLF souborem (normalizace konců řádků), PowerShell `Stop-Process -Name node|cloudflared` / `Get-Process node | Stop-Process` / `Stop-Process -Id <8082>`, pravidla jen v pozici příkazu (text v heredocu neblokuje). 21 testů.
- Expo Go server uživatele se při QA souběhu zasekl; boss ho obnovil (zastavení vlastní úlohy + ukončení visícího procesu), bundle předem stažen.

## motion-agent — záměr scrollu nad tečkovým pozadím (2026-10-06)
- Nové `components/dots/scrollIntent.tsx`: `useScrollIntent` je Manual gesto, které po `motion.scrollIntent.slop` (10 pt) rozhodne. Když |dy| > `verticalRatio` (2)·|dx|, gesto selže a scroll se rozjede. Jinak se aktivuje, tah patří tečkám a vlnu dál kreslí `useDotTouch`. Při druhém prstu gesto selže. `IntentScrollView` je ScrollView v `Gesture.Native().requireExternalGestureToFail(intent)` z kontextu. Mimo pozadí se chová jako obyčejný ScrollView.
- Zapojení: `ReactiveBackground` (Simultaneous s vlnou, provider; při `interactive`/`visible` false se nepoužije), mapa `app/(tabs)/index.tsx` (Simultaneous s vlnou a reakcemi opičky) a `IntentScrollView` v LessonMap, Screen, league, profile, progress, season, settings, lesson/[id], wardrobe (jen vnější, vodorovné sloty zůstávají nativní). ValueWheelSheet a dev se nemění.
- Rozhodnutí: vnořená gesta s menším prahem vyhrají dřív, totiž kotouč (8 pt) a tab bar (6 pt, ten leží mimo pozadí). Tap a podržení nemají pohyb, takže gesto se neaktivuje. Při omezeném pohybu se gesta chovají stejně, vypne se jen vlna.
- Výsledky: tsc OK, eslint OK, jest 68/682 OK, e2e 80/80 (2.9 min). Baseline se nemění, vizuálně se nic nemění.
- Otevřené: chování nativního UIScrollView vůči `requireExternalGestureToFail` se musí ověřit na iPhonu. Kdyby scroll startoval i při šikmém tahu, zbývá záložní varianta: aktivace „play“ gesta scroll zruší.
- QA kolo 2 fáze 0 (a90b51b): SCHVÁLENO. tsc/eslint/jest 682, guard 21/21, e2e 80/80, perf 2× 4/4, expogo bez ERROR. Otevřené: hook nechytá kill-port 8082 / kill $(lsof), wardrobe vodorovné sloty ověřit na iPhonu.

## 2026-10-06 · boss · Otevřené po QA kola 2 (fáze 0)
- Hook: `npx kill-port 8082` a dosazené PID (`kill $(lsof -ti:8082)`) projdou — doplnit v příštím kole (změna kódu by jinak otevřela nové QA; mezera v ochranném nástroji, ne v appce).
- Šatník: vodorovný ScrollView slotů uvnitř IntentScrollView — ověřit na iPhonu (checklist bod 3), případná oprava motion-agent.

## 2026-10-07 · boss · Oprava: mapa bez interaktivního pozadí
- Uživatel potvrdil iPhone checklist kola 2 („Ok“) s výjimkou: na mapě přestalo reagovat tečkové pozadí. Příčina: `ScrollIntentProvider` (context) vložený mezi `GestureDetector` a View — GestureDetector potřebuje View jako přímého potomka, gesto se nepřipojilo. Provider přesunut vně. tsc/eslint/jest zelené, e2e 80/80. (Ostatní obrazovky přes ReactiveBackground mají provider uvnitř View — v pořádku.)
- Do příštího kola: e2e test, který ověří reakci pozadí na tah (vlna) — chyba prošla, protože e2e dotek nekontroluje.

## 2026-10-07 — design-agent: elite fáze 1, Task 2 (krátký onboarding + Finish setup) a Task 3 (opička průvodce)
**Co:** Onboarding je Cesta (01/02) → Zrození → mapa. `path.tsx` „Continue“ doplní do draftu výchozí cíle (`useDefaultDraftGoals` → `defaultDraftGoals`, váha `none`), birth posílá `setupDone: false`. `OnboardingFrame` TOTAL_STEPS = 2 (krok se ořízne; dream/milestones/weight/reminder zůstaly jako soubory, mimo tok). Nová obrazovka `app/setup.tsx` (modal, registrovaná v `_layout`): 4 číslované řádky Vize / Milníky / Váha / Připomínka (→ `app/goals/*`, připomínka → Settings) s aktuálními výchozími hodnotami a jediné plné CTA [DONE] → `completeSetup()`. Mapa: `components/map/FinishSetupTile.tsx` — jednořádková pilulka 44 pt v hlavičkovém překryvu (živá tečka v barvě textu, mono „FINISH SETUP · 4 STEPS“, chevron), ne karta. Oslava: sekundární pilulka [SET YOUR GOALS] pod [CONTINUE] (jen `needsSetup`), vede `router.replace('/setup')` (mapa zůstane pod modalem). Průvodce: `components/mascot/GuideBubble.tsx` (dlaždice `tilePressed` + vlasová hrana, mono štítek MONKEY + věta v `pill` mono verzálkami, tečková šipka: hrot ze 3 teček + slábnoucí dřík `dots.guide`), hook `hooks/useGuide.ts` (nextGuide + `markGuideSeen`, lokálně schová hned). Umístění: mapa pod hlavičkou se šipkou dolů ke kotouči (zmizí na tap nebo startem lekce), lekce nad lištou se šipkou k [START]/[DONE] (zmizí na tap nebo jakoukoli akcí lišty), oslava pod kotoučem se šipkou nahoru — místo rezervované od začátku (let teček měří střed kotouče, layout se nesmí hnout), viditelná a dotyková až s CTA. Hooky: `useFinishSetup` (useGoals.ts), `useDefaultDraftGoals` (useOnboardingDraft.ts). Copy `copy.guide`, `copy.setup`. Token `dots.guide { d: 4, gap: 3, count: 2 }`.
**Rozhodnutí:** (1) Finish setup jako samostatná obrazovka, ne sheet — editory cílů jsou modály a z obrazovky se na ni přirozeně vrací Zpět. (2) Done nic nevynucuje: výchozí cíle už jsou platné. (3) Žádný akcent u průvodce ani dlaždice: důležitost nese poloha a jediná plná pilulka zůstává CTA. (4) „N steps“ = počet kroků (4), ne zbývající — per-krok dokončení logika nesleduje.
**Ověření:** `npx tsc --noEmit` OK; `npx eslint .` 0 problémů; `npx jest` 70/70 sad, 691/691 (birth.test: očekává `setupDone: false`); `npm run e2e` 80/80 (2.9 min). Tok `e2e/flows/onboarding.spec.ts` přepsán: path → birth → mapa, průvodce, dlaždice, /setup, Done → dlaždice zmizí; test neplatné váhy jde přímo na `/onboarding/weight`. `npm run e2e:update -- --grep onboarding` spuštěn vědomě — baseline se nezměnila (rozdíl 5 → 2 teček je pod prahem), ostatní vizuální baseline používají demo profil (bez first run), proto beze změny. Ruční snímky first runu (mapa, lekce, oslava, setup) zkontrolovány.
**Otevřené:** (a) Bublina a dlaždice na mapě zvětší hlavičkový překryv (~100 px), po zmizení bubliny mapa poskočí nahoru (`topInset`) — motion-agent: plynulé dojetí. (b) [SET YOUR GOALS] na oslavě obchází stage-up, kdyby první lekce zvedla stage (dnes nenastane). (c) Lekce: bublina ubírá výšku popisu cviku na malých displejích. (d) Motion-agent: let kotouče — místa: `LessonCompleteScene` (GuideBubble pod `plateRef`, `play={ctaReady}`), `index.tsx` (překryv: FinishSetupTile + GuideBubble), nástup bubliny je zatím jen `Reveal`.

## 2026-10-07 · motion-agent · Elite fáze 1 Task 4: let kotouče + pohybové dluhy mapy a bubliny
- **Let kotouče** (spec §2.3): `lib/plateFlight.ts` (store `launch/land/clear`, `takeLastRect` pro oslavu, registr kotoučů mapy `registerPlate` + `launchFromPlate`, `measureRect` s timeoutem a try/catch, zámek `tryBeginStart/endStart`), `components/transition/PlateFlight.tsx` (overlay za `<Stack>` v `app/_layout.tsx`, pointerEvents none, na iOS v `FullWindowOverlay`, protože lekce je nativní fullScreenModal). Parametry `plateFlight` v `lib/motion.ts`: let 520 ms `ease.exit`, rotace 0.5 otáčky, zmenšení na výšku řady teček, rozpuštění od 65 % dráhy; lekce měří cíl po 380 ms (dojetí modalu), měření max 120 ms, bez cíle do 1600 ms se kotouč prolne pryč. Reduce Motion: prolnutí `calmFade` 200 ms na místě, bez letu.
- Start: `app/(tabs)/index.tsx` `open` (CTA i popover uzlu) → `tryBeginStart` (dvojí tap = 1 navigace, odemkne `useFocusEffect` na mapě) → změření kotouče → `launch` → `router.push` (navigace jde i při selhání měření). `PlateNode` dostal `flightId` (LessonMap předává id lekce); boss let nemá (bez registrace = přeskočeno).
- Cíl: `LessonProgress` obalil `DotRow` měřeným View (bez změny layoutu) a volá `land`.
- Oslava: `LessonCompleteScene` čte `takeLastRect`; tečky slétají ze shluku v místě, kam kotouč v lekci zmizel (`plateFlight.gatherSpread` 0.2), jinak původní zdroje z pole.
- **Dluh (a) mapa:** změna výšky hlavičkového překryvu (zmizí bublina / dlaždice) už neskáče: `insetShift` (sdílená hodnota) = rozdíl staré a nové výšky → timing 260 ms ease.out k 0; LessonMap posouvá obsah translateY, závoj EdgeFade se natahuje scaleY od horní hrany. Bublina se nejdřív 160 ms prolne (`leaving`), zápis „viděno“ jde hned. Reduce Motion: bez dojezdu.
- **Dluh (b) bublina:** tečková šipka se po nástupu rozsvítí sken od bubliny k cíli (70 ms/tečka), pak jednou za 2.6 s přeběhne světlo (420 ms ease.sine). Reduce Motion statická. `guideArrow`, `overlayResize` v `lib/motion.ts`.
- Rozhodl jsem sám: overlay jen během letu (FullWindowOverlay se jinak nemountuje); měření cíle se zpožděním místo měření během nativního přechodu; žádný spring (vše timing).
- Testy: `lib/__tests__/plateFlight.test.ts` (12, vč. from 0/NaN/null, measure vyhodí / neodpoví, dvojí tap). tsc 0, eslint 0, jest 703/703, `npm run e2e` 80/80 (2.9 min), `e2e:perf` 4/4 (fps mapa i oslava ≥ 55). Web: ruční screenshoty letu potvrdily visení → let k řadě teček → rozpuštění.
- Otevřené: na iOS ověřit `FullWindowOverlay` nad fullScreenModal v Expo Go a přesnost `measureInWindow` po 380 ms; při skoku výšky překryvu u dolního konce scrollu může ScrollView oříznout offset (vzácné).

### 2026-10-07 qa-agent: elite fáze 1, Task 5 + QA kolo 1 (HEAD 9d4b7fc)
- Udělal: `e2e/flows/first-run.spec.ts` (celý first run, dvojí tap, čas do lekce 6.3 s, starý profil), `e2e/flows/map-ripple.spec.ts` (dluh fáze 0, ověřeno kontrolním během bez tahu), nové vizuální baseline `first-run-map`, `first-run-setup`, `first-run-celebration` × 8 (vědomě přes `--update-snapshots --grep first-run`). tsc/eslint 0, jest 703/703, e2e 107/107, perf 4/4, nativní log bez nových ERROR.
- Rozhodl sám: toky klikají [DONE], když `canSkip` skryje [SKIP] (záměr adaptivity); dvojí navigaci ověřuji přes `history.length`.
- Verdikt: NESCHVÁLENO. Na w320 se překrývá první oslava (kotouč přes titulek, pilulky přes sérii) a mapa prvního průchodu (CTA přes kotouč, useknutá dlaždice) → design-agent; po opravě přegenerovat baseline w320 `first-run-map` a `first-run-celebration`. Copy bubliny lekce u cviku na opakování (⚠️).

## 2026-10-07 · design-agent · elite fáze 1, oprava QA kolo 1 (w320×568)
- Nový zlom výšky `breakpoint.short = 640` + hook `useShort()` (theme/useCompact.ts); token `size.celebratePlateShort = 128`, typ `dotTitleShort` (Doto 28/36).
- Oslava (`LessonCompleteScene`): na nízkém displeji kotouč strop 128 (P stále z `contentW * L.plateFrac`, jen jiný strop – motion měření středu beze změny), titulek Doto 28 (2 řádky v 320), užší mezery, bez řádku „Tomorrow“, [SET YOUR GOALS] jako textová akce v závorkách (min. 44 pt, muted → text při stisku) pod [CONTINUE]. Rezervace GuideBubble zůstává.
- Mapa: dlaždice na nízkém displeji „SETUP · 4“ (a11y nese celé znění), bublina průvodce `compact` (bez štítku MONKEY, jeden řádek), v prvním průchodu na nízkém displeji se skryje prázdná řada pokroku SectionHero (vrací se po startu lekce). `LessonMap.scrollToNode` nově počítá 40 % viditelného výřezu i bez pruhu CTA (`footerSpace`) – na všech šířkách aktuální uzel s popiskem leží nad [START LESSON].
- Lekce: `copy.guide.lessonReps` „Do the reps, then tap Done“ pro cviky `type: 'reps'`, „Hold the timer or tap Done“ jen pro výdrž; `GuideBubble` má volitelný `text` override.
- Baseline vědomě přegenerované: first-run-map/celebration w320 (dark/light; ostatní šířky beze změny), demo `map` (všech 8 – posun scrollu o footerSpace) a demo `celebration` w320 (dark/light). w320 snímky zkontrolovány okem: nic se nepřekrývá (+20 XP na mapě těsně nad hranou CTA).
- Běhy: tsc 0 chyb, jest 71/71 sad (703 testů), eslint čistý, e2e flows+visual 107/107.
- Otevřené: na mapě w320 hrot šipky bubliny sedí na hlavě opičky (míří na ni, záměr); řada pokroku se v prvním průchodu na SE neukazuje.

## 2026-10-07 · boss · Rozhodnutí k opravám w320 (fáze 1)
- Schváleno: skrytí prázdné řady pokroku 0/9 při first run na nízkém displeji; `scrollToNode` odečítá `footerSpace` (aktuální uzel nad pruhem CTA, nová demo baseline mapy na všech šířkách — vědomá změna).
- Otevřené (nízká priorita, motion): `lastRect` letu přežije zavřenou lekci do dalšího `launch` (projeví se jen u oslavy z deep linku).

### 2026-10-07 qa-agent: elite fáze 1, QA kolo 2 (HEAD cce1093)
- Ověřil: tsc/eslint 0, jest 703/703, e2e 107/107, perf 4/4, nativní log bez nových ERROR; snímky w320 (dark/light) first-run mapy a oslavy bez překryvů; bublina lekce podle typu cviku.
- Verdikt: SCHVÁLENO. Otevřené ⚠️: copy výdrže zmiňuje Done, šipka bubliny přes opičku na w320 (design-agent); `lastRect` po quit (motion-agent).

## 2026-10-07 · boss · Rating fáze 1 = 65/85 → opravy
- Vizuální kvalita 0: kolize na mapě first run w320 (bublina přes „SE…“, „+20 XP“ na CTA, šipka přes opičku), QA je vedla jen jako ⚠️. Opravuje design-agent (+ text u výdrže bez „Done“).
- Rubrika a zadání QA doplněny o výslovné kritérium: kolize/ořez textu na kterékoli šířce včetně 320 pt = ❌ (rating i QA vykládaly „hierarchii“ různě).

## 2026-10-07 design-agent: elite fáze 1, oprava vizuální kvality first-run mapy na 320 pt (rating 65/85)
- (1) Useknuté „SE…“ vedle bubliny: na nízkém displeji je bublina průvodce přes celou šířku (`GuideBubble stretch`), nadpis sekce, který pod překryvem projíždí, zakryje celou plochou.
- (3) Šipka přes hlavu opičky: na nízkém displeji je šipka plovoucí (`GuideBubble arrowOffset`, absolutně pod bublinou, nezabírá výšku), posunutá o nový token `dots.guide.sideOffset` = 36 (polovina opičky S 56 + 8) vlevo od středu: obejde opičku a míří na levou hranu kotouče. Na w375+ beze změny (šipka v toku míří na kotouč, opička je níž).
- (2) „+20 XP“ na hraně [START LESSON]: na nízkém displeji dlaždice SETUP bez horního odstupu, bublina s `space.xs`, mapa v prvním průchodu o `space.l` níž (opička celá pod bublinou); změna odsazení mapy jde přes stávající plynulý dojezd `insetShift` (nově `useLayoutEffect` nad efektivním odsazením). Změřeno v DOM (w320): bublina dole 190, opička od 189 (viditelná hlava ~197), „+20 XP“ dole 392, CTA nahoře 400 = `space.s` vzduchu.
- (4) `copy.guide.lessonHold`: „Tap Start and hold the position“ (bez „Done“, u výdrže je [START]/[PAUSE]).
- Soubory: `app/(tabs)/index.tsx`, `components/mascot/GuideBubble.tsx`, `components/map/FinishSetupTile.tsx`, `theme/tokens.ts`, `data/copy.ts`.
- Kontrola 320: prohlédnuty w320 first-run-map, first-run-celebration, first-run-setup (bez kolizí a ořezů; /setup: 4. řádek odjíždí pod [DONE] jako scroll, ne kolize). Demo mapa a w375/w390/w430 beze změny (e2e prošlo).
- Běhy: `npx tsc --noEmit` OK; `npx eslint .` OK (0 problémů); `npx jest` 71/71 sad, 703/703 testů; `npm run e2e` 105 passed, 2 failed = úmyslná změna w320-{dark,light}/first-run-map.
- Vědomé baseline: `npm run e2e:update -- --grep "first-run mapa" --project=w320-dark --project=w320-light` → `e2e/__screenshots__/w320-dark/first-run-map.png`, `e2e/__screenshots__/w320-light/first-run-map.png`.
- Otevřené: bublina průvodce v první lekci (výdrž, nový text) nemá vizuální snímek na w320; k ruční kontrole. Posun mapy o `space.l` je laděný na 568 pt výšky a kotvení scrollu na 40 % výřezu.

### 2026-10-07 qa-agent: elite fáze 1, QA kolo 3 (HEAD 1569e1e)
- Ověřil: tsc/eslint 0, jest 703/703, e2e 107/107, perf 4/4, log bez nových ERROR; prohlédl w320 a w375 snímky first-run i demo podle nového pravidla (kolize/ořez = ❌).
- First-run opravy ✅ (mapa, oslava, setup, text výdrže).
- Verdikt: NESCHVÁLENO. ❌ lekce w320 (výdrž): lišta usekne odpočet „10“ a název cviku není vidět → design-agent, poté přegenerovat baseline w320 `lesson`. ⚠️ demo mapa w320: „Section boss“ prosvítá mezi CTA a tab barem (scroll obsah).

## 2026-10-07 · boss · QA fáze 1 kolo 3 = NESCHVÁLENO → kolo 4 (vědomá výjimka z „max 3 kola“)
- Kolo 3 schválilo opravy first run, zablokovalo starou vadu z fáze 0 (lekce na w320: lišta usekává odpočet, název cviku mimo výřez), kterou odhalilo až zpřísněné pravidlo „kolize/ořez = ❌“ z dnešního dne. Výjimka: vada není z této fáze a oprava je malá (kompaktní lekce) — boss povoluje 4. kolo QA.

## 2026-10-07 design-agent — fáze 1, oprava QA kolo 3 (lekce na 320×568)
- Kompaktní lekce přes `useShort()` (výška < 640): nové tokeny `size.silhouettePanelShort` 120, `size.silhouettePanelGuide` 80 (nízký displej + bublina průvodce), `size.holdRingShort` 160 a typ `heroShort` (Doto 42/56, stupeň škály). Menší mezery karty (l→m, s→xs), scroll paddingTop l→s, opakování `Stat` M místo L.
- Proč 160 + Doto 42, ne 144 + Doto 64: při 144 „10“ v Doto 64 sahalo na vnitřní kruh teček (kolize, viděno na snímku).
- Bublina průvodce v lekci na nízkém displeji `compact` + `stretch` (bez štítku MONKEY, přes celou šířku), karta s ní dostane panel 80 → název i první řádek popisu zůstanou nad bublinou (ověřeno first run w320 dark/light).
- Ověřeno snímky w320: výdrž Crow, Wall handstand, Forearm plank (celý popis), opakování Hollow rock — nic se nekryje s lištou.
- ⚠️ mapa w320: na nízkém displeji plný závoj `c.base` od spodní hrany pilulky [START LESSON] až ke dnu obrazovky (pod tab barem), scrollovaný text už neprosvítá. Na vyšších displejích beze změny (mapa dál jede pod tab barem, záměr).
- Běhy: `tsc` OK, `jest` 703/703, `eslint .` 0 problémů (s `--ignore-pattern e2e/report/**` — vygenerovaný Playwright HTML report, gitignorovaný, ESLint ho jinak lintuje; doporučuji přidat do ignores v eslint.config, nesahal jsem), `e2e:update --grep lekce` → nová baseline w320-dark/light `lesson.png` (úmyslná změna, prohlédnuto), pak `playwright flows visual` 107/107.
- Otevřené: v first run na w320 je zbytek popisu výdrže pod prvním řádkem dostupný scrollem, dokud je bublina vidět; po jejím zavření se panel vrátí na 120.

### 2026-10-07 qa-agent: elite fáze 1, QA kolo 4 (HEAD 6da8f1b)
- Ověřil: tsc/eslint 0, jest 703/703, e2e 107/107, perf 4/4, log bez nových ERROR; baseline + ad hoc snímky lekce prvního průchodu (3 cviky) na w320 dark/light a w375 dark.
- Lekce demo w320 ✅ opraveno. Verdikt: NESCHVÁLENO — ❌ bublina průvodce na 1. cviku first run (výdrž) usekne titulek „Dead hang“ (w375) a popis (w320) → design-agent; doporučena nová baseline `first-run-lesson`. ⚠️ demo mapa w320 stále ukazuje „Section boss“ mezi CTA a tab barem.

## design-agent — elite fáze 1, oprava QA kola 4 (2026-10-07)
- ❌ Bublina průvodce v lekci (1. cvik first run) přesunuta z prostoru mezi `IntentScrollView` a lištou DO obsahu scrollu, pod popis cviku (šipka dolů k [START] zůstává). Už nezkracuje výšku scrollu, nekryje titulek ani popis.
- Rozhodnutí: aby bublina byla vidět bez scrollu (jinak by průvodce na w375 skončil pod přehybem), karta v režimu průvodce zmenšuje panel siluety: běžný displej `silhouettePanelShort` (120), nízký `silhouettePanelGuide` (80). Token `silhouettePanelGuide` tedy zůstává (už ne kvůli zmenšenému scrollu, ale kvůli místu pro bublinu v obsahu). Silueta zůstává viditelná.
- Nová baseline `first-run-lesson` (e2e/visual/screens.spec.ts) pro všech 8 projektů — `npm run e2e:update -- --grep "first-run lekce"`. Prohlédnuto w320/w375 dark+light: titulek, popis i bublina celé nad lištou, nic ořezané.
- ⚠️ mapa w320: plný podklad pod [START LESSON] funguje (ověřeno ad hoc odscrollovaně 0/40/150/300/600 px, dark i light — mezi pilulkou a tab barem jen `base`). QA viděl zastaralou baseline `map.png` w320 z 11:05 (před opravou); nový render se lišil pod prahem 1 %, takže `--update-snapshots` ji nepřepsal. Smazána a vědomě přegenerována (`npm run e2e:update -- --grep "s demo profilem mapa"`). Nad pilulkou prosvítá jen ztlumené „BOSS“ pod závojem (záměr).
- Běhy: `tsc --noEmit` OK, `eslint .` OK, `jest` 71/71 sad, 703/703 testů, `npm run e2e` 115/115 passed.
- Otevřené: práh 1 % u toHaveScreenshot pouští drobné, ale významné změny na malých plochách (pruh pod CTA) — zvážit nižší práh pro w320.

### 2026-10-07 qa-agent: elite fáze 1, QA kolo 5 (HEAD 2c8dfb8)
- Ověřil: tsc/eslint 0, jest 703/703, e2e 115/115, perf 4/4, log bez nových ERROR; w320/w375 first-run-lesson, demo lesson, first-run-map, mapa (i ad hoc odscrollovaná), oslavy, /setup.
- Verdikt: SCHVÁLENO. ⚠️ jen dekorativní šipka bubliny v lekci na w320 částečně pod lištou (design-agent, volitelně).

## 2026-10-07 motion-agent: elite fáze 2, Task 2 (napojení zvuku a haptiky)
- Napojeno: `flightStart` (PlateFlight, start letu po přistání cíle; omezený pohyb = let není, bez zvuku), `lessonDone` (LessonCompleteScene: success úder podpisu `celebrationHaptics` jde přes `feedback('lessonDone')` = haptika + zvuk success naráz; omezený pohyb jen `lessonDone`, dřívější `playSfx('snap')` vypuštěn; snap při nacvaknutí zůstává `playSfx`, heavy nese podpis), `stageUp` (stage-up: místo `haptics.success()` v bornAt i v omezeném pohybu), `guideShow` (GuideBubble: jednou za mount po `delay` Reveal, ne při odchodu), `setupDone` (/setup po úspěšném uložení před `router.back()`).
- `playSfx` tichý fallback už v kódu (try/catch, chybějící přehrávač) – pokryto testem `lib/__tests__/sound.test.ts`, tamtéž `playsInSilentMode: false` (preload i ducking).
- Integrační testy `lib/__tests__/feedbackWiring.test.ts`: lessonDone = haptika + zvuk, vypnuté Zvuky, vypnutá Haptika, omezovač 40 ms, grep napojení nových id.
- Rozhodnuto sám: reduced oslava lekce bez snap zvuku (jen success podpis); guideShow i při omezeném pohybu (zvuk není pohyb).
- Běhy: tsc OK, eslint OK, jest 75 suites / 718 + nové testy OK, test:node 25/25, e2e 115/115.
- Otevřené: ověření na iPhonu (tichý režim, souběh snap+success).

- qa-agent (elite fáze 2, HEAD 7636146): SCHVÁLENO. tsc/eslint/jest 718/test:node 25/e2e 115 zelené, napojení feedback bez dvojitých success, expogo.log bez nového ERROR (fáze 2 ale na iPhonu ještě neběžela). Nic jsem neopravoval. Otevřené: iPhone checklist (hlasitost, tichý režim, sladění haptiky a zvuku).

## boss — elite fáze 2, Task 1 (65d362f, 9106914)
- Udělal: generátor `scripts/gen-sounds.mjs` + 9 WAV (staré Kenney gong/ring/plate-snap smazány), registr `lib/sound.ts`, `logic/sfxGate.ts`, `lib/feedbackMap.ts` + testy (node 25, jest pokrytí mapy).
- Rozhodl sám: syntéza místo nahrávek; hlasitost 0.35 krátké / 0.5 swoosh / 0.6 ostatní; gate 40 ms na stejný zvuk; navigace bez zvuku; `plateSnap` přejmenován na `snap`.
- Chyba procesu: 65d362f commitnut s 1 padající sadou a 3 lint chybami, opraveno v 9106914.
- Otevřené: hlasitosti neověřené uchem (iPhone checklist); README Zvuky aktualizováno.

## boss — elite fáze 3, Task 1 (logika opičky 2.0)
- Udělal: spec + plán fáze 3, `logic/mascotLines.ts` (kontext podle dneška/série/denní doby, výběr bez opakování) + testy, `copy.mascotLines` (7 kontextů, ≤ 32 znaků), `copy.complete.record`, `LessonResult.streakRecord` + testy (vyrovnání ≠ rekord, retry idempotentní), hook `hooks/useMascotLine.ts` + testy.
- Rozhodl sám: opička mluví jen na ťuknutí (nikdy sama), 2.4 s, průvodce má přednost, ztracená série = věta podle denní doby (bez výčitek), rekord až od 2 dnů.
- Otevřené: UI bubliny (design), pohyb a reakce `proud` při rekordu (motion).

## 2026-10-07 design-agent — elite fáze 3, Task 2 (replika opičky + řádek rekordu)
- `components/mascot/LineBubble.tsx` (+ export): menší příbuzná GuideBubble — bez štítku, plocha `tile` (průvodce je o tón výš `tilePressed`: úkol vs. poznámka), `radius.s`, vlasová hrana `edge`, věta `telemetry` mono verzálkami, max. 2 řádky, tečkový hrot 2+1 dolů k opičce. `pointerEvents="none"` (tap jde dál na opičku), `accessible` + `accessibilityRole="text"` + `accessibilityLiveRegion="polite"`. Bez animací (motion-agent).
- Token `dots.line` (d 3, gap 2, maxW 232, edge 16, room 72) v `theme/tokens.ts`.
- `ReactiveMascot`: nový prop `onTap` (tap gesto runOnJS, onAccessibilityTap, akce activate) — nic se nezachytává ve workletu.
- `LessonMap`: props `line`, `onMascotTap`; bublina v obalu opičky (jede s ní), pevná šířka min(232, šířka − 32), posunutá od kraje displeje, hrot vždy na středu opičky → na w320–w430 se neořízne. Když nad opičkou chybí `room` pod hlavičkou, mapa při objevení repliky sjede o rozdíl (stejný vzor jako popover uzlu).
- Mapa: `useMascotLine(stats, Boolean(guide.id ?? ghost))`, `say` na ťuknutí opičky.
- `LessonCompleteScene`: při `result.streakRecord` řádek `copy.complete.record(result.streak)` (`telemetry`, barva textu, 1 řádek, adjustsFontSizeToFit) pod titulkem.
- Testy: `components/mascot/__tests__/LineBubble.test.tsx` (text verzálkami, 2 řádky, live region, dark/light). Test scény na rekord nepsán (scéna bez komponentového harnessu; pokrývá ho e2e baseline oslavy — demo profil má rekord 13 dní).
- Ověření: tsc OK, eslint OK, jest 78 suites / 736 testů OK, `npm run e2e` 107 passed / 8 failed = jen `oslava (konečný stav)` na všech šířkách (úmyslně nový řádek NEW RECORD · 13 DAYS, w320 zkontrolováno bez kolize) → `npm run e2e:update -- --grep oslava` 16 passed, nové baseline.
- Otevřené: bublina repliky na mapě nemá e2e snímek (vyžaduje tap na opičku) — k ověření QA / ručně na w320 a u horního okraje.

## 2026-10-07 motion-agent: elite fáze 3, Task 3 (bublina repliky, hrdost při rekordu)
- **Bublina repliky** `components/mascot/LineBubbleMotion.tsx` (obal `LineBubble`, použit v `LessonMap` místo `{line ? <LineBubble/> : null}`); hodnoty `lineBubble` v `lib/motion.ts`: nástup `inMs` 220 ms `ease.out` (opacity 0→1, translateY 6→0, scale 0.9→1, transformOrigin = hrot nad opičkou), odchod `outMs` 150 ms `ease.exit`, pak teprve odpojení (i po vypršení 2.4 s z `useMascotLine` bublina nezmizí skokem). Další ťuknutí za běhu = jen výměna textu (žádné blikání); ťuknutí během odchodu ho otočí do nástupu. Reduce Motion = jen prolnutí. Bez haptiky (bublina není akce).
- **Rekord v oslavě** (`LessonCompleteScene`): rozhodnutí vytaženo do pure `prideBeat()` v `components/lesson/celebration.ts`. Reakce `proud` (událost `streakUp`) v `mascotAt + max(sken řady, REACTION_COOLDOWN_MS)` = 2650 ms (beze změny pro běžný přírůstek série, nově i při rekordu); řádek rekordu nastoupí ve stejném taktu `motion.reveal` + posun `lessonDone.recordRise` 8 pt (za heartbeatem 2350/2470, žádný úder ani zvuk navíc, podpis `celebrationHaptics` netknutý). Přeskočení dorovná řádek s ostatními (`recordIn` v `doSkip`). Reduce Motion: řádek hned, `proud` po 1200 ms (dřív se v klidovém režimu proud nehlásil vůbec; teď jen při rekordu).
- **Testy**: jest `prideBeat` (4 testy: bez rekordu žádný řádek, takt, beze změny haptiky, reduced). E2E `e2e/flows/mascot-line.spec.ts`: ťuknutí → text z `copy.mascotLines`, viditelná ~1.2 s před koncem, zmizí do 2 s; geometrie (celá ve viewportu, pod nadpisem hlavičky) na w390 i w320 (`test.use` viewport 320×568 v projektu w390-dark).
- **Výsledky**: tsc 0, eslint 0, jest 78/78 sad (740 testů), test:node 25/25, `npm run e2e` 117 passed, perf-prod 4 passed (mapa i oslava medián fps ≥ 55).
- **Otevřené / K ruční kontrole (iPhone)**: transformOrigin bubliny na nativu (hrot), plynulost odchodu při rychlém ťukání, oslava s rekordem (řádek + proud) a VoiceOver ohlášení repliky. E2E neověřuje průběh odchodu (jen že nezmizí dřív než po 2.4 s).

- qa-agent (elite fáze 3, HEAD 952a497): NESCHVÁLENO. tsc, eslint, jest 740, test:node a e2e 117/117 jsou zelené a logika replik, rekordu i prideBeat sedí. ❌ Bublina repliky na mapě zakrývá popisek uzlu, na w430 z něj kouká „U“ (design-agent). V expogo.log žádný nový ERROR. Detaily jsou v QA.md.

## 2026-10-07 design-agent — oprava QA fáze 3 kolo 1 (bublina repliky vs. popisky uzlů)
- Řešení: popisky pod bublinou po dobu repliky **ustoupí** (opacity 0, čtečka je přeskočí, místo v layoutu zůstává → nic neposkočí). Ustoupí jen to, co obdélník bubliny (šířka `lineW`, výška `dots.line.room` nad opičkou) skutečně kryje: popisky uzlů (`NodeLabel hidden`) i nadpis sekce. Proč ne přesun bubliny: nad opičkou je vždy předchozí uzel s popiskem, do strany na w320 není místo; mono věta přes ztlumený mono text by se četla špatně. Prolnutí popisku je případně práce pro motion-agenta (teď statický stav). `LineBubbleMotion` beze změny.
- `e2e/flows/mascot-line.spec.ts`: `expectGeometry` nově kontroluje, že žádný viditelný text (opacity řetězce > 0) mimo bublinu nemá s bublinou průnik; běží na w390 i w320.
- Ověření: tsc OK, eslint OK, jest 740/740, `npm run e2e` 117/117 (bez nových baseline). Dočasný test (smazán) nasnímal w320/w430 dark/light po ťuknutí: bublina čistá, popisek „Overhead…“ / dokončeného uzlu skrytý, nic nekoliduje s hlavičkou ani CTA.

### qa-agent: elite fáze 3 QA kolo 2 (7bc1f5b)
- SCHVÁLENO. tsc, eslint, jest 740, test:node a e2e 117/117 jsou zelené. Mutační kontrola (`HIDDEN` s opacity 1) nový e2e test shodí na w390 i w320. Snímky w320/w430 dark/light jsou čisté a popisek se po replice vrací. Native log bez nového ERROR.
- Otevřené: prolnutí skrytého popisku (motion), potvrdit záměr u vyblednutých popisků pod hlavičkou (design).

## 2026-10-07 — design-agent: elite fáze 4, Task 1 (audit + opravy)

**Nálezy → opravy**
1. **Doto pod 28 pt:** jednořádkový titulek mapy se zmenšoval až na 24 pt (`fontScale.titleMin` 0.6). → `titleMin` 0.7 (40 → 28 pt) a obsah zkrácen: názvy sekcí `Pulling 101` / `Balance 101` / `Strength 101` (≤ 12 znaků, při 28 pt ≈ 228 pt < 272 pt na w320). Jest drží obojí.
2. **Doto bez stropu zvětšení:** `heroShort`, `counter`, `telemetry`, `badgeLabel`, `tabLabelCompact`, `tierName` neměly `maxFontSizeMultiplier`. → strop (`typeMaxScale`) i tabulární mapa (`tabularVariants`, `tabularNums`) přesunuty z `Text.tsx` do `theme/tokens.ts`; Doto vždy ≤ 1.3×.
3. **Tabulární číslice:** čtyři komponenty psaly `fontVariant: ['tabular-nums']` natvrdo; pódium (XP), pořadí ligy (`/ 16`), lekce (`+N reps`), rozpis XP oslavy, comeback karta byly proporcionální. → vše přes `tabularNums` z theme; grep test zakazuje `'tabular-nums'` mimo theme. Věta „No XP this week yet…“ zůstala proporcionální (číslo ve větě; tnum ji zalamoval se sirotkem „up.“).
4. **VoiceOver – dekorace:** Skia plátna (17 na obrazovkách) a SVG (cesta mapy, závoje, rám profilu, grain, silueta, kotouče) byly pro čtečku viditelné. Skia na webu `aria-hidden` z plátna nepropíše → nový `components/dots/DecorCanvas.tsx` (obal skrytý na nativu i webu); SVG dostala `aria-hidden`.
5. **VoiceOver – uzel mapy** ohlásil název, kg a stav, ne minuty. → `copy.map.nodeA11y` „Lesson N, název, stav, about M min, kg“.
6. **Stavy:** načítání byl spinner (DotLoader) uprostřed, chyba jen věta + tlačítko. → `components/ui/StateView.tsx`: loading = statický tečkový skeleton (titulek + 3 dlaždice, `dotOff`) až po `motion.stateView.skeletonDelayMs` (300 ms, jen konstanta; pulz dodá motion), error = smutná opička (dekorace) + „Couldn’t load …“ + „Your progress is safe on this phone. Try again in a moment.“ + [TRY AGAIN], empty = pozvánka (celoplošná s akcí nebo `inline`). `ErrorState` a `DotLoaderScreen` jsou tenké obaly, takže všech ~15 míst s `status !== 'ready'` (taby, lekce, sezóna, cíle, šatník, setup, root) je napojených; v tabech `edges={[]}`. Inline prázdné stavy progresu (aktivita, váha) jdou přes `StateView`. `EmptyHint` (nepoužitý) smazán.
7. **Závoj hlavičky mapy:** rozhodnutí = **upravit**. Prosvítání popisků za titulkem působilo jako duchové textu a snižovalo čitelnost titulku; hloubka cesty pod hlavičkou má smysl jen pod ní. Závoj je teď plný přes celý text hlavičky a do `veilEdge` se prolne až v posledních `space.s`, pod hlavičkou dozní jako dřív.
8. **8pt rytmus:** grep stylů `margin/padding/gap` s čísly — nic mimo `space` (jen geometrie činky ve `StreakBarbell`, ta je grafika). Bez opravy.

**Testy:** `e2e/a11y/labels.spec.ts` (10 obrazovek: žádný button/link/switch/tab/radio bez jména, plátna/SVG mimo pojmenovaný prvek skrytá, uzel mapy hlásí minuty a stav), `e2e/a11y/large-text.spec.ts` (1.4× na w320 a w390; simulace v DOM podle `data-fs` stropu z theme, Text na webu nese `data-fs`/`data-fit`), sdílený helper `e2e/textGeometry.ts` (překryv pod plochou z `mascot-line`, kolize a přetečení s ořezem kontejnerem a zakrytím neprůhlednou vrstvou; pojistka počtu textů). Projekty: a11y běží na `w320-dark` a `w390-dark`; `npm run e2e` nově zahrnuje `a11y`. Jest: `StateView.test.tsx` (5), `theme/__tests__/tabular.test.ts` (5).

**Běhy:** `tsc` 0 chyb · `eslint .` 0 · `jest` 80 suites / 750 testů zelené · `npm run e2e` 159 passed · `npm run e2e:perf` 4/4 (plátna ≤ 12, mapa ≤ 3 s, fps ≥ 55; `DecorCanvas` počet pláten nemění).
**Nové baseline (vědomě):** `map.png` a `first-run-map.png` na w320/w375/w390 dark+light (12 souborů) — kratší název sekce „Balance 101“ se vejde v plných 40 pt místo zmenšeného „Balance basics“ a závoj je plný za hlavičkou. Liga v toleranci beze změny baseline.
**Otevřené:** pulz skeletonu a vstup StateView (motion-agent, Task 2); 1.4× na webu je simulace — skutečné Dynamic Type ověřit na iPhonu (titulek mapy, tab bar, pódium: jména se při 1.4× na w320 zkracují výpustkou, záměrně).

## 2026-10-07 motion-agent — elite fáze 4 (audit), Task 2 motion
Co:
- **Skeleton StateView** (`components/ui/StateView.tsx`, hodnoty `motion.stateView`): po `skeletonDelayMs` 300 ms vstup (opacity 0→1 + posun 6 pt, timing 220 ms ease.out), pak jeden sdílený pulz `withRepeat(withTiming 0→1, 1800 ms, linear)`; krytí řady = kosinový dech 0.45–1, každá další řada o 0.14 cyklu později (vlna shora dolů, ne spinner). Pure worklet `skeletonRowOpacity` exportován. Omezený pohyb: statický skeleton, plné krytí, bez vstupu.
- **Ustoupení popisků pod replikou** (`components/map/useLabelYield.ts`, `motion.labelYield`): popisky uzlů i nadpisy sekcí (dosud skok `HIDDEN`) se prolnou na 0 za 140 ms (ease.exit, rychleji než nástup bubliny 220 ms) a zpět na 1 za 220 ms (ease.out) až po odchodu bubliny (delay 150 ms = `lineBubble.outMs`). Jen krytí, proto ReduceMotion.Never. Stav a11y (`hidden`) platí okamžitě. Nadpis sekce vyčleněn do `SectionLabel` (stejný hook).
- **Audit Reduce Motion** (mapa, lekce, oslava, stage-up, liga, onboarding, recap):
  - NALEZENO/OPRAVENO: `motion.calmFade` neměl `reduceMotion: Never` → reanimated (System) náhradní prolnutí přeskočil a byl to skok. Dotčené: stage-up (nová opička + text), liga `LeagueResultBanner` (vlastní FADE → `motion.calmFade`), onboarding `birth` (REDUCED_FADE → `motion.calmFade`). Teď `calmFade` nese Never.
  - OPRAVENO: lekce `ExerciseCard` — FadeInRight/FadeOutLeft se s omezeným pohybem vypnuly (karta se vyměnila skokem); teď `FadeIn 200 ms`/`FadeOut 150 ms` s Never.
  - OPRAVENO: recap sezóny — prolnutí plochy oslavy (černá → akcent) s omezeným pohybem bleskalo; barva není pohyb → Never.
  - OK beze změny: mapa (crossfade, PlateNode, unlock, Reveal v choreo už Never), oslava `LessonCompleteScene` (calm timeline), liga řádky (statické, bez vstupu = v pořádku), MilestoneChip (bez třesení, stav nese text), FloatingTabBar (pilulka skočí na cíl = přijatelné, žádný obsah nezmizí), DotSteps (šířka skočí, OK).
- Testy: `StateView.test.tsx` +3 (zpoždění 300 ms, pulz jen jeden a nekonečný, Reduce Motion = žádný withRepeat a plné krytí, meze/fáze vlny), nový `components/map/__tests__/useLabelYield.test.tsx` (rytmus vs. lineBubble, timing 0/1 s Never a zpožděním).
Rozhodl sám: prolnutí popisků i s omezeným pohybem (není to pohyb); ustoupení i u nadpisů sekcí; pulz na řadu (ne na tečku) kvůli výkonu.
Běhy: tsc OK, eslint OK, jest 81 suites / 755 testů OK, test:node 25/25, `npm run e2e` 159 passed (vč. flows/mascot-line), `npm run e2e:perf` 4/4. Necommitováno.
Otevřené: na iPhonu ověřit dech skeletonu a prolnutí popisků se zapnutým Omezit pohyb.

### qa-agent — elite fáze 4 kolo 1 (2026-10-07), HEAD 3ced780
**Co:** tsc/eslint/jest (755)/test:node, e2e 159/159, e2e:perf 4/4, native log bez nového ERROR. Mutace ověřily a11y labels i large-text testy (vráceno). Reálná sonda selhání úložiště, prázdné stavy w320 dark/light, skeleton bez záblesku. Verdikt **SCHVÁLENO**.
**Otevřené:** (1) selhání hydratace → onboarding a možné přepsání profilu místo ErrorState (boss, `store/db.ts`); (2) large-text test hlídá jen 1.4×; (3) „Balance 101“ vs. SPEC „ZÁKLADY …“ — doplnit poznámku do SPEC; (4) VoiceOver pořadí mapy jen na iPhonu.
