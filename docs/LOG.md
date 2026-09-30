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
