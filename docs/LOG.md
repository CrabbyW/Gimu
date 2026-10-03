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
