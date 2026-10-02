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
