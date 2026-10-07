# QA report

## Tab bar, opička v klidu, barvy, demo (43cb2db, 25f442e, c3ca0d8, 3dc9561)

**Verdikt: SCHVÁLENO**

### Build
- `tsc --noEmit` ✅ · `jest` 67 sad / 673 testů ✅ · `eslint .` bez chyb ✅
- `$TEMP/expogo.log`: 0 řádků ERROR (žádné „Cannot copy value of type PanGesture“).

### Tab bar ✅
- Web (390×844, dark i light): jedno kliknutí přepne každý z 5 tabů (league/progress/season/profile/zpět), správná URL.
- Gesture.Race(Pan, Tap) v jednom GestureDetectoru; Pan se aktivuje až po `activeOffsetX`, takže tap zůstává tapem. Tah: podložka jede za prstem, `navigate` až v `onEnd` (jedno přepnutí); `onFinalize` bez úspěchu → `settle`.
- Guard: `tabPress` s `canPreventDefault`; při `defaultPrevented` se nenaviguje a podložka dosedne zpět na `active`.
- Haptika: jen `tick` při přechodu slotu během tahu; tap ani puštění druhou haptiku nespouštějí.
- Worklety zachytávají jen shared values, čísla a RN funkce předané přes `scheduleOnRN`; žádné objekty Gesture.
- Čtečka: role `tablist`/`tab`, label, `accessibilityState.selected`, aktivace přes `onAccessibilityTap` a akci `activate`.
- **Opraveno (QA):** na webu chyběl `aria-selected` (RN Web už `accessibilityState` nemapuje, všechny taby měly prázdnou hodnotu). Přidáno `aria-selected={focused}` do `components/ui/FloatingTabBar.tsx`. Ověřeno: `false,true,false,false,false`.

### Opička v klidu ✅
- `useMascotIdle`: jeden `setTimeout` na pauzu, `setState` jen jednou za akci (žádná smyčka); `active = enabled && focused && !reduced && !sleeping`, cleanup přes `clearTimeout`.
- Během reakce nic nespustí: `canIdle` vyžaduje `now - reactionAt >= busyMs` a pauza se počítá přes `busyLeft`; nová reakce časovač přeplánuje.
- Reduce Motion: idle vrací `null`, dýchání a hop jsou vypnuté, zůstává jen mrkání (větev `reduced` v SvgMascot).
- Výkon: animace běží na UI vlákně (Reanimated), JS jen plánuje. Na zařízení jsem fps neměřil (K ruční kontrole).

### Barvy ✅
- Snímky mapa/liga/progres/sezóna/profil/lekce v dark i light: nic nečitelného, akcent mimo seasonGold výjimky nevidím.
- Test kontrastu prošel (ovládací prvky ≥ 3:1). Hrana Toggle/TextField `borderStrong` je v kódu; vizuálně v nastavení jen namátkou.

### Demo ✅
- Demo profil: [SKIP] je vidět i při běžícím časovači (`alwaysSkip={demo}`). Normální profil má podmínku beze změny (skip skrytý při running/countdown/done).

### Nálezy
| # | Závažnost | Nález | Vlastník |
|---|---|---|---|
| 1 | nízká | Web: chybělo `aria-selected` u tabů, **opraveno** | boss (hotovo) |

### K ruční kontrole (iPhone)
- Jedno ťuknutí na tab, tah s haptickými tiky a přepnutí po puštění, VoiceOver „vybráno“ + dvojklik aktivuje.
- Plynulost idle animací opičky, v pódiu i na mapě při scrollu; Reduce Motion = jen mrkání.
- Toggle vypnutý a TextField v nastavení v obou režimech.

## Build a testy
- `npx tsc --noEmit`: 0 chyb. `npx eslint .`: 0 chyb. `npx jest`: 64 sad, 616 testů, vše prošlo (i po opravách QA).
- Web :8081 (Playwright, demo profil): 10x rychlé ťuknutí na opičku na mapě bez chyb a bez zaseknutí; ťuknutí těsně pod opičku otevře aktuální lekci (`/lesson/bc-1-8`), takže `box-none` ťuknutí na kotouč nepohltí; ťuknutí na taby přepíná (`/progress`, `/`).
- Nativní log `$TEMP/expogo.log`: jen 8 starých chyb `PanGesture` (z doby před opravou), žádná nová chyba.

## Logika `logic/mascotReactions.ts` proti SPEC §8 (tabulka reakcí)
- ✅ Všech 13 událostí vede na reakci podle tabulky; krátký scroll nahoru i krátký návrat (< 60 s) nevrací nic.
- ✅ Priority a cooldown 1200 ms: hraní si (priorita < 5) se v cooldownu zahodí, nic se neřadí do fronty; herní události (≥ 5) přebijí jen nižší prioritu.
- ✅ Rozhodnutí „salto přebije poskok“: trojité ťuknutí do 600 ms, po saltu se série vynuluje (4. ťuknutí nespustí další salto). 10x ťuknutí = poskok, salto, pak klid do konce cooldownu.
- ✅ `degrade` (Reduce Motion): skoky a rotace se mění na náladu nebo oči. Haptika jen poskok/salto/skok radosti.

## Přehrání a napojení
- ✅ Všech 15 reakcí má větev v `reactionMotion.ts`; přerušená reakce dosedne do klidu, salto se srovná na celou otáčku.
- ✅ Mapa: ťuknutí/podržení (ReactiveMascot), pohled za prstem (Manual gesto, nekrade scroll), scroll (lookDown/dizzy, programový scroll se ignoruje), roztočení kotouče (spinFollow), ztráta streaku (sad), start lekce (nod). Oslava: lessonDone + streakUp až po cooldownu. Liga: leagueUp/leagueDown jednou na výsledek. Profil: hero s ReactiveMascot.
- ✅ Nečinnost jen na zaostřené obrazovce (`useScreenFocused`, liga a oslava běží s `focused=false`); spánek jednou, probuzení dotykem.
- ✅ Worklety: v `components/mascot`, `components/map`, `FloatingTabBar` se do workletů nezachytává žádné gesto ani objekt s gestem; JS funkce jdou jen přes `scheduleOnRN`.

## Podněty z iPhonu
- ✅ (a) Křížek lekce: `LessonProgress` odsazuje `insets.top`, obrazovka lekce má `Screen edges={[]}`, takže odsazení není dvojí; spodní lišta (`BigActionBar`) má vlastní `insets.bottom`. Stage-up, season-recap a oslava odsazují `insets.top` samy, bez SafeAreaView navíc. Modaly (settings, goals, wardrobe, season-goal) jsou iOS `modal` (page sheet), ty pod status bar nesahají. Beze změny.
- ⚠️ (b) Tah po tab baru: kód je v pořádku (stejný `tabPress`, tedy guard i haptika, a Reduce Motion bez animace dosednutí). Na webu Playwright tahem myší tab nepřepne (Pressable na webu pravděpodobně drží responder), na nativu to musí potvrdit uživatel.

## Nálezy a opravy QA
1. **Opraveno (logika, boss/motion):** `FloatingTabBar`: když guard navigace (600 ms po zavření oslavy/stage-upu) přepnutí při tahu zablokoval, podložka po puštění dosedla na slot, kde byl prst, a ne na aktivní tab. Postup: dokončit lekci, zavřít oslavu a hned táhnout po tab baru. Teď `onFinalize` volá `settle` na JS vlákně a ten podložku srovná na skutečně aktivní tab (`active`, sdílená hodnota nastavená po `navigate`).
2. **Opraveno (výkon, motion):** `useMascotReactions.touched` volal `setIdleTick` při každém doteku, i při každé události scrollu (~30/s), takže se při scrollu pořád překreslovala celá obrazovka mapy. Teď dotek jen posune čas a časovač nečinnosti se při vypršení přeplánuje sám. Navíc se spánek zahozený cooldownem zkusí znovu (dřív opička do dalšího doteku už nikdy neusnula) a nejkratší čekání je `REACTION_COOLDOWN_MS`, takže nevznikne těsná smyčka.
3. **Opraveno (motion):** `SvgMascot`: oči dostávaly záporné `ry` (konzole webu: `<ellipse> attribute ry: A negative value is not valid`, -4.28). `ry` se teď svírá na [zavřeno, otevřeno]; po opravě je konzole bez chyb.
4. Drobnost (motion, neopraveno): efekt `AppState` v `useMascotReactions` se při změně `focused` přihlásí znovu a ztratí `leftAt`. Okrajové, mávnutí se jen nezahraje.

## K ruční kontrole (iPhone, Expo Go)
- Tah prstem po tab baru přepíná taby, haptika jednou na tab, krátké ťuknutí zůstane ťuknutím; s Reduce Motion podložka skočí.
- Na mapě ťuknutí na kotouč těsně vedle opičky nebo pod ní otevře lekci; roztočení kotouče funguje dál.
- Křížek lekce je pod Dynamic Islandem a jde stisknout; stage-up/recap/oslava mají ovládání pod status barem.
- Po 20 s bez doteku opička na mapě usne a dotykem se probudí; po návratu do appky po ≥ 60 s mávne, po krátkém návratu ne.
- Plynulost scrollu mapy (oprava 2).

---

# QA: Nothing Dot fáze 2 (commity 14787b4..f34446a, kolo 2 na HEAD)

Verdikt pro HEAD f34446a: **SCHVÁLENO**. Kolo 2 ověřilo 37b0f5b (opravy N1–N3) a f34446a (`motion.instant` ve stage-up).

## Kolo 2 (HEAD f34446a)
- tsc ✅ 0 chyb · jest ✅ 552/552 (nový test kontrastu `onGoldPill`/`onSeasonGold` v `theme/__tests__/contrast.test.ts`) · eslint ✅.
- Liga 320×568 a 390×844, dark i light: pódium je první blok pod hlavičkou, na 320 je celé nad ohybem, pozice a TierBadge jsou pod ním ✅.
- Stage-up dark i light: CTA je tmavá pilulka `onSeasonGold` (#181613) s popiskem `onGoldPill` (#F2F2EF). Hrana vůči zlatu ~7.6:1, popisek ~16:1 ✅.
- Ostatní CTA: větev `onAccent` a výchozí větev v `PillButton` se textově nezměnily, `onGold` je opt-in a používá ho jen stage-up. Mapa, lekce, oslava, recap a onboarding tedy beze změny ✅.
- f34446a: `withTiming(1, motion.instant)` a zpoždění `T.shatterMs - motion.instant.duration` dávají stejné časování ✅.

## Build a testy
- `npx tsc --noEmit` ✅ 0 chyb · `npx jest` ✅ 62 sad / 548 testů · `npx eslint .` ✅ čisto.
- Nové čisté moduly s testy: `canvasBudget` ✅, `podiumLayout` (0/1/2/3 hráči) ✅, `progress/layout` (`tileColumns(320,1)=1`, `(390,1.4)=1`, `activityCells([])` 35 zhasnutých) ✅.

## Úkoly plánu vs. spec
- T1 Rozpočet pláten ✅ `SkiaGuard` přes `NavigationContext` + focus/blur, fallback stejného rozměru. Web: 5 tabů 2× dokola → mapa, 10 pláten, žádné „Too many WebGL contexts“, žádný pageerror.
- T2 Onboarding ✅ StatusLine KROK 01/05 + DotRow, Doto titulek, Reveal místo `entering`. 320×568 dark/light: lead se nepřekrývá s kartou, bez děr.
- T3 Liga ✅ podiumColumns, pódium skryté bez XP a jako první blok, vlastní řádek s hranou `text`, TierBadge = DotRing.
- T4 Progres ✅ 1 sloupec na 320 pt, DotMatrix, prázdné stavy z `copy.progress`.
- T5 Sezóna ✅ odpočet Doto, DotRing %, SeasonBadge jediné zlato (lem, iniciály v `text`).
- T6 Profil a šatník ✅ DotField, stoh 3 DotPlate, statistiky 2×N, SourceBadge sezónní `seasonGold` + `onSeasonGold`.
- T7 Nastavení a cíle ✅ sekce v dlaždicích, Toggle/SegmentedControl/TextField pilulky.
- T8 Stage-up ✅ plocha `seasonGold`, inkoust `onSeasonGold` (~7.6:1), RingShatter, Reduce Motion = finální stav.
- T9 Pohyb ✅ Reveal/tileAt, useTilePress na klikatelných dlaždicích, pódium zdola, count-up.

## Review Focus
- Taby 2× dokola na webu ✅ (viz T1).
- Liga 0–2 hráči ✅ (testy + skrytí bez XP).
- Progres bez aktivity a váhy ✅ (test `activityCells([])`, prázdná copy; na zařízení neověřeno, demo profil má data).
- 320 pt ✅ jeden sloupec; fontScale > 1.3 ✅ jen testem.
- Onboarding 320×568 ✅ snímky dark i light.
- Pláten na obrazovku (web, 320×568): liga 4, progres 4, sezóna 2, profil 4, šatník 1, nastavení 0, cíl sezóny 0, stage-up 3 → vše ≤ 12 ✅.
- Akcent: `seasonGold` jen v SeasonBadge, SourceBadge, stage-up ✅. `c.accent` v recapu/PillButton = monochrom (`accent` = `text`) ✅. Žádný hex mimo theme ✅.
- Spring: jen na dekorativních prvcích (opička, odznak, nový prstenec, birth) ✅; PillButton/Tile timing.
- Layout `entering`: zbývá jen absolutní scrim v `progress.tsx` (CelebrateOverlay, bezpečné) a `ExerciseCard` lekce (mimo rozsah) ✅.

## Nálezy
- N1 OPRAVENO (ověřeno v kole 2, 37b0f5b). Původně: Liga „začíná nahoře s pódiem“ jen částečně: obrazovka začíná nahoře bez scrollu, ale první dlaždice je souhrn pozice + TierBadge, pódium je druhé. Na 320×568 jsou z pódia vidět jen vršky sloupců. Pokud zadání znamená pódium jako první blok, prohodit pořadí.
- N2 OPRAVENO (ověřeno v kole 2, 37b0f5b, režim `onGold`). Původně: Stage-up light: CTA pilulka `onAccent` = `#F2F2EF` na `#C6A15B`, hrana tlačítka vůči ploše ~2.1:1 (WCAG 1.4.11 chce 3:1). Text v pilulce je OK. Dark (černá pilulka) OK.
- N3 OPRAVENO (ověřeno v kole 2, 37b0f5b). Původně: Komentář v `SeasonBadge.tsx` mluví o „zlaté ploše“ u `onAccent`, recap ale používá inverzi `accent`; jen dokumentace.
- Žádné opravy v kódu nebyly nutné.

## K ruční kontrole
- Stage-up na zařízení: první snímek staré opičky (motion LOG).
- fontScale 1.4 na zařízení (progres, liga, onboarding) — ověřeno jen unit testem.
- Progres s čerstvým profilem bez aktivity a bez váhy na zařízení.
- Plynulost RingShatter/DotBurst na slabém Androidu; scroll ligy k vlastnímu řádku za 2. obrazovkou.

---

# QA: Nothing Dot fáze 1, po ratingu kola 1

Datum: 2026-10-06 · qa-agent · větev `faze1/core-loop` · rozsah: plán `docs/superpowers/plans/2026-10-05-nothing-dot-faze1.md` úkoly 1–10 a Review Focus, porovnané bod po bodu se spec `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`; opravy `87f436a` a `85b4493`.

**Verdikt: SCHVÁLENO** (kolo 2, po `f63ac3c`; Metro :8081 restartované s --clear, snímky přefoceny v dark i light)

## Build a testy (spuštěno znovu)
- `npx tsc --noEmit` ✅ 0 chyb
- `npx jest` ✅ 59 sad / 535 testů
- `npx eslint .` ✅ bez chyb
- Web (Playwright, Chrome, 390×844, dark i light): žádný pageerror. V konzoli jen hláška Skia „Shader compilation error“ (`fwidth`) z CanvasKit, appka běží dál.

## Úkoly plánu vs. spec

| Úkol | Spec | Stav | Důkaz |
|---|---|---|---|
| 1. Skia, Doto, CanvasKit na webu, jest mock | §7 | ✅ | `Doto_700Bold` v `app/_layout.tsx`; CanvasKit přes `index.web.js` + `lib/skiaReady.ts` (plán chtěl `lib/skiaWeb.ts`, odchylka zapsaná bossem v LOG); vlastní mock Skia v `jest.setup.ts` |
| 2. Monochromní palety | §2.1 | ✅ | `theme/palettes.ts` má `tile/tilePressed/edge/dotOff/dotDim/glow/onText`; `theme/__tests__/contrast.test.ts` zelený; v kódu není čistý #000/#FFF |
| 3. Tokeny typografie, tvarů, pohybu | §2.2, §2.3, §3 | ✅ | `motion.plateSpin/liveBlinkMs/tilePress/screenIn` v `lib/motion.ts`; rozhodnutí bosse (plán upraven): Doto varianty jsou `hero`/`display`/`displayXL`/`dotStat` |
| 4. Tečková geometrie (TDD) | §2.4 | ✅ | `components/dots/__tests__/geometry.test.ts`: 2.5→2 … 25→7, neznámé kg |
| 5. Skia komponenty + vlna + dev „Tečky“ | §2.4, §4.1 | ✅ | `render.test.tsx` zelený; `/dev` Tečky: 3 kg × 3 stavy, řada ZAMČENÝ vykreslená správně v dark i light (13 pláten, pod limitem WebGL) |
| 6. Tile, PillButton, StatusLine, ScreenHeader | §2.3 | ✅ | `PillButton.test.tsx` (`[ZAČÍT LEKCI]`, čtečka bez závorek, disabled); Grain z `Screen` pryč |
| 7. Plovoucí tab bar | §2.3 | ✅ | `FloatingTabBar.test.tsx` (navigate + `selected`); snímky: pilulka, podložka aktivního tabu |
| 8. Mapa: kotouče, roztočení, cesta, hero | §2.4, §4, §6 | ✅ po opravě | `usePlateSpin.test.ts` (`angleDelta`, `ticksCrossed`); `activeOffsetX`/`failOffsetY` v `usePlateSpin.ts`. Popover uzlu se ale schovával pod pruh s CTA — opraveno (N1) |
| 9. Lekce: DotRing, dlaždice, HoldTimer | §6 | ✅ | `HoldTimer.test.tsx` zelený; snímek dark i light: prstenec na středu, „PŘIPRAV SE“ pod prstencem bez překryvu |
| 10. Oslava dokončení lekce | §5 | ✅ | `celebration.test.ts`: osa field→gather→snap→mascot→cta 0/200/900/1000/1600, reduced = vše 0 a 200 ms. Snímek 1800 ms dark i light: rozpis „lekce 10 · první dnes +10 · / streak +14“ se láme jen mezi položkami, „streak +14“ drží pohromadě (NBSP oprava funguje). Copy „Zítra · Boss: Plná osa“ ✅ |

## Review Focus

| Bod | Stav | Důkaz |
|---|---|---|
| Web bez CanvasKit → fallback `View` | ✅ | `render.test.tsx` (SkiaGuard fallback); `DotPlate` má `FallbackRim` |
| Roztočení kotouče vs. scroll mapy | ✅ (kód) | `activeOffsetX([-8,8])` + `failOffsetY([-12,12])`; na zařízení k ruční kontrole |
| Reduce Motion | ✅ | `celebrationTimeline(true)` test; ambient přes `useMotionSafe` |
| Light bez záře | ✅ | `components/dots/ink.ts:8` `glow: scheme === 'dark' ? c.glow : null`; `DotPlate`/`DotMatrix` kreslí `BlurMask` jen když `glow`; test „záře jen v dark: light nekreslí BlurMask“ v `render.test.tsx`; light paleta má navíc `glow` s alfou 0 |
| kg mimo tabulku | ✅ | `geometry.test.ts`: `ringCountForKg(12)=4`, `(1)=2`, `(40)=7`, `(NaN)=2` |

## Nálezy

- **N1 (logika, OPRAVENO v `components/map/LessonMap.tsx`)**: popover uzlu na mapě byl vidět jen nadpisem, zbytek (údaje, `[ZOPAKOVAT LEKCI]`) pod pruhem s CTA. Repro: demo profil → mapa → klepnout na „Lekce 5 Nad hlavou“. Příčina: `popoverSide` dostával spodek výřezu bez odečtení `footerSpace`, a když se popover nevešel na žádnou stranu (viditelný výřez mapy je jen ~276 px), nic mapu neposunulo. Oprava: `viewportBottom` = výřez − `footerSpace` a při nedostatku místa `scrollTo` o chybějící kus (bez animace při Reduce Motion). Ověřeno snímkem dark i light na čerstvém Metru (port 8099).
- **N2 (OPRAVENO `f63ac3c`)**: `/dev` sekce Tečky, řada „ZAMČENÝ“ = rozbité bílé plochy. Pravděpodobně limit WebGL kontextů v Chrome (~16; sekce má 18 kotoučů + prstenec, řada, matice, pole = 22 Canvasů, nejstarší kontexty prohlížeč zahodí). Týká se jen webu, ale stejné riziko hrozí na mapě s více sekcemi. Návrh: v dev sekci méně kotoučů nebo jeden společný Canvas.
- **N3 (OPRAVENO `f63ac3c`)**: obrazovka lekce, HoldTimer: „PŘIPRAV SE“ přes číslici a tečky prstence, prstenec mimo střed.
- **N4 (OPRAVENO `f63ac3c`, závoj je průhledná plocha na tap)**: závoj popoveru v light je středně šedá plocha jen přes oblast mapy (hlavička, hero a CTA zůstávají světlé), vypadá jako chyba vykreslení. V dark je závoj skoro neviditelný.
- **N5 (boss, info)**: Metro `:8081` nebere změny souborů (ani `touch`); bundle `index.web.bundle` zůstal starý. Nové změny ověřuj na čerstvém serveru.
- **N6 (VYŘEŠENO rozhodnutím bosse)**: Doto varianty = `hero`/`display`/`displayXL`/`dotStat`, plán upraven.
- **N5** vyřešen restartem :8081.

## Otevřené pro fázi 2
- Limit WebGL kontextů na webu (~16 Canvasů): mapa s více sekcemi a taby to může přesáhnout (teď mapa 10 Canvasů). Na nativu limit není.

## K ruční kontrole
- Popover u uzlu těsně nad CTA: po automatickém posunu je kotouč napůl pod pruhem (snímek `qa-pop-done-*`), zkontrolovat, jestli to působí přirozeně.
- Tap na zamčený boss uzel: popover se neotevřel (jen zatřesení?), ověřit zamýšlené chování.
- Scroll mapy vs. roztočení prstem, haptika tick/success, 44 pt dotykové plochy, Doto s diakritikou na zařízení.

## Po fázi 3: reset, mapa, angličtina (2026-10-06, commity 76f7ad3..f0381e3)

**Verdikt: SCHVÁLENO** (s jednou opravou v `logic/`, viz níže).

Build: `tsc --noEmit` čisté, `eslint .` čisté, Jest 64 sad / 616 testů OK (po opravě `logic` 285/285).

### 1. Reset app (Nastavení → Data)
- ✅ Playwright 390×844: demo profil + téma light + připomínka zapnutá + dev posun +3 dny → Reset → web confirm („All progress, XP, streak and goals will be deleted…“) → `/onboarding/path`. `opice-db` = `{profile:null}` (celý stav hry žije v profilu: XP, série, cíle, liga, sezóna, kosmetika), `opice-settings` vrácen na výchozí, **téma light zůstalo**, `devTimeOffsetMs` 0, připomínka vypnuta.
- ✅ Reload i Zpět po resetu zůstávají na onboardingu. Dvojklik na tlačítko vyvolá jen jeden dialog.

### 2. Kompaktní hlavička mapy
- ✅ 390×844: nad CTA 3 prvky cesty (hotová lekce, aktuální, boss), nic se nepřekrývá.
- ✅ 320×568: bez vodorovného přetečení. ⚠️ Název sekce na jeden řádek se usekne („Balance ba…“) — záměr `singleLine`, ale na 320 pt přichází o informaci (design-agent: zvážit menší variantu fontu pro dlouhé názvy).
- ⚠️ Řádek „4 EXERCISES · 3 MIN · +20 XP“ se na 320 i 390 láme tak, že `·` visí na konci prvního řádku (design-agent: nezalomitelná mezera před `·` nebo XP na samostatný řádek).

### 3. Angličtina
Sken textu + `aria-label` všech obrazovek (onboarding 6 kroků, dev, mapa, liga, progres, sezóna, cíl sezóny, recap, profil, šatník, nastavení, stage-up, 4 editory cílů) na 320 i 390.
- ❌→✅ **Opraveno:** podmínky odznaků v profilu byly česky („Cvič 30 dní v řadě“, „Odcvič ho v lekci“, i v a11y popiscích). Commit f0381e3 je neopravil (text obsahoval NBSP). `logic/badges.ts` → „Train N days in a row“ / „Train 1 day“ / „Do it in a lesson“; test v `logic/__tests__/redesign.test.ts` upraven.
- ✅ Plurály přes `plural()` v copy (day/days, lesson/lessons, exercise/exercises, minute/minutes).
- ✅ Formáty: data M/D (sezóna „9/28 – 12/26“), desetinná tečka — vědomé rozhodnutí z LOG „translation“.
- ✅ Bez přetečení textu kromě záměrných ellips (jméno v lize „Jake_Pull…“) a vodorovně posuvného segmentu v šatníku.
- ⚠️ Zbytky češtiny mimo UI: chybové zprávy `logic/completion.ts` (UI je chytá generickou hláškou), `theme/useTheme.ts`, `console.warn`, mrtvá `formatCzDate`, komentáře „desetinná čárka“ v `components/season/format.ts`. Neviditelné uživateli, ale v dev menu se `e.message` zobrazí — boss.
- ⚠️ Dev menu datum `en-US` (M/D/YYYY) — jen dev.

### K ruční kontrole
- Reset na iPhonu (nativní Alert, `router.dismissAll()` ze stacku nad taby).
- Hlavička mapy na reálném 320 pt zařízení (SE 1. gen) s nejdelším názvem sekce.
- VoiceOver čte anglické popisky odznaků.

## Podněty z iPhonu + nová oslava (2026-10-06, commity a309eb2..8b0b325)
**Verdikt: SCHVÁLENO** (s poznámkami níže; nic neopraveno, žádná jasná chyba v logice).

Build: `tsc --noEmit` 0 chyb, Jest 65 sad / 623 testů OK, ESLint 0 nálezů.

1. Tab bar přejetí ✅ (kód): Pan s `activeOffsetX` (tap zůstává tapem), podložka za prstem s ořezem 0..max, tik jen při změně slotu, `navigate` jen v `onEnd` přes `tabPress` (guard `defaultPrevented` respektován), zrušené gesto → `settle` zpět na aktivní tab. Na webu jen statická kontrola, pocit na iPhonu ručně.
2. Demo přeskočení ✅: web, demo profil, lekce „Balance“ → 4× Skip → oslava, +44 XP (lesson 20 · first today +10 · streak +14), série 12 → 13 dní. Normální profil dál `canSkip` + `advance(false)`. ⚠️ Skip je skrytý, dokud běží časovač (nejdřív [PAUSE]); u demo profilu to zdržuje — rozhodnutí pro boss.
3. Mapa pod hlavičkou ✅ funkčně (aktuální uzel ve výhledu, kotva opičky nad uzlem, „+20 XP“ na vlastním řádku). ⚠️ design-agent: pod titulkem „Balance basics“ prosvítá popisek a uzel předchozí lekce („Overhead“) — závoj `EdgeFade` je v dark slabý, titulek se tím hůř čte.
4. Reaktivní pozadí ✅: plátna na webu: mapa 10, lekce 4, oslava 4 (≤ 12). Ostatní obrazovky tento běh neměřeny (minulé kolo OK).
5. Oslava ✅: osa `celebrationTimeline`/`celebrationHaptics` pokryta testy; snímky 300/900/1400/2000/3000 ms (dark i light) — vír → prstenec → kotouč 20 s opičkou, XP, sérií a [CONTINUE] na konci. `skipToEnd` je idempotentní (`once`), ruší naplánované kroky včetně haptiky (`cancelSteps`), XP tik po přeskočení mlčí, pozadí appky = přeskočení, Reduce Motion = konečný stav + jen `success`, `fire` respektuje `hapticsEnabled`.

**K ruční kontrole (iPhone):** pocit crescenda/heavy/heartbeat; přejetí tab barem (tik na slot, žádný skok obrazovek během tahu); oslava s Reduce Motion; vypnutá Haptika = ticho; čitelnost hlavičky mapy při scrollu.

## QA — elite fáze 0 (workflow), commity dccba78..a7e39c7, HEAD a7e39c7

**Verdikt: NESCHVÁLENO** (brána `npm run e2e` není zelená; kód ani logika neregresují, problém je v infrastruktuře e2e proti dev serveru).

### Funguje
- `npx tsc --noEmit` ✅, `npx jest` ✅ 68 sad / 682 testů, `npx eslint .` ✅ bez chyb.
- `node --test .claude/hooks/guard.test.mjs` ✅ 16/16.
- Hook je registrovaný a živý: skutečné Bash volání s hromadným zabitím node procesů zablokoval (nic se nespustilo). Přímé testy guard.mjs (stdin JSON): taskkill /IM node → exit 2, `CI=1` + `expo start` → 2, Write na docs/QA.md i LOG.md → 2, přepis `>` QA.md → 2; `npx expo start --web --port 8081` (i v heredocu) → 0, `>>` QA.md → 0.
- ESLint `local/no-worklet-object-capture`: RuleTester má invalid případ PlateNode před opravou; v kódu žádný `eslint-disable` pro toto pravidlo (ostatní disable jsou starší `react-hooks/exhaustive-deps`).
- Agent soubory `.claude/agents/*.md` mají platný frontmatter; design/motion mají Bash (spec §4.1).
- `npm run e2e:perf` ✅ 4/4 (plátna ≤ 12, fps mapa/oslava ≥ 55, TTI).
- Nativní log `$TEMP/expogo.log`: 0 řádků ERROR (Metro restartované, jen 2× iOS Bundled).
- Diff UI fáze 0: jen testID v lize (league-row/podium) a rozbalené touch hodnoty v Dot*.

### Rozbité
1. ❌ `npm run e2e`: 1. běh `Timed out waiting 180000ms from config.webServer` (8081 běžel, ale `curl localhost:8081/` trval ~30 s). 2. běh: 52 failed / 28 passed za 1,1 h. Všech 52 jsou timeouty (`page.goto` 120 s / test 180 s, 2× ERR_ABORTED), **0 vizuálních diffů**. Repro: Metro na 8081 i 8082 současně, `npm run e2e`. Příčina: ~16 MB dev bundle přes Metro pod zátěží paralelních workerů. Pro bosse: restart Metra jen na PID z 8081, `workers: 1` / prewarm bundlu v globalSetup / vyšší timeouty. Review Focus „e2e funguje i s běžícím serverem“ dnes nesplněn.
2. ❌ Hook blokuje legitimní Edit-připsání do docs/QA.md: soubor má CRLF, `checkEdit` porovnává `old_string` (LF) s raw textem → `includes` selže. Repro: Edit na QA.md s `old_string` = poslední řádek + `\n`, `new_string` = totéž + nový text → zablokováno. Porušuje Review Focus „běžný Edit připsáním musí projít“. Oprava: normalizovat `\r\n` → `\n` v `fileText` (+ test). Boss. (Tento report připsán přes `>>`.)
3. ⚠️ Hook nekryje PowerShell `Stop-Process -Name node` (exit 0), přestože matcher zahrnuje PowerShell. Spec §4.2 jmenuje jen taskkill → mezera. Boss.
4. ⚠️ False positive: hook blokuje i pouhý text (heredoc s reportem) obsahující `taskkill … /IM node` nebo `CI=1 … expo start` na jednom řádku; komentář v guard.mjs tvrdí, že zmínky neblokuje. Boss.
5. ⚠️ Hook neblokuje spuštění dalšího `expo start --port 8082` (spec to nežádá).

### iPhone checklist (Expo Go, 8082)
1. Appka se otevře a mapa se dá posouvat tahem bez pádu (Dot* touch hodnoty).
2. Liga: řádky a pódium vypadají stejně jako před fází 0.
3. Dotek na kotouči lekce/plátech reaguje s haptikou jako dřív.
4. Oslava dokončení lekce plynulá, bez zaseknutí.
5. Po pár minutách používání žádná červená obrazovka chyby.

## QA kolo 2 elite fáze 0 + scrollIntent — HEAD a90b51b (7cab20c, a90b51b)

**Verdikt: SCHVÁLENO pro a90b51b** (s jednou výhradou k hooku a ověřením na iPhonu)

Funguje:
- tsc 0 chyb, eslint 0, jest 68 sad / 682 testů zelené.
- `node --test .claude/hooks/guard.test.mjs` 21/21.
- Ruční vstupy do guard.mjs: Write na docs/QA.md → blok (2); PowerShell `Stop-Process -Name cloudflared` → blok; `taskkill /IM cloudflared.exe` → blok; `echo 8082 cloudflared` → povoleno (pravidla jen v pozici příkazu, OK).
- `npm run e2e` 80/80 za 2.9 min (produkční export, 8083), bez vizuálních diffů. `npm run e2e:perf` 2× za sebou 4/4 (28 s).
- `$TEMP/expogo.log`: 0 řádků ERROR.
- scrollIntent: worklety zachytávají jen čísla (SLOP, RATIO) a sdílené hodnoty sx/sy; manager je parametr callbacku, ne zachycený objekt. Druhý prst → fail. Mimo pozadí (bez kontextu) je IntentScrollView obyčejný ScrollView. Reduce Motion: gesto na RM nezávisí, vlnu vypíná useDotTouch — v pořádku.

Výhrady:
- ⚠️ Hook: `npx kill-port 8082` a `kill $(lsof -ti:8082)` projdou (exit 0) — PID-check vidí jen doslovné PID. Doporučení (boss): blokovat `kill-port … 8082` a substituce s `8082` v pozici kill příkazu. Neblokuje kolo.
- ⚠️ Wardrobe (app/wardrobe.tsx:164): vnořený nativní `ScrollView horizontal` uvnitř IntentScrollView; vodorovný tah aktivuje hrací gesto pozadí, které může na iOS zrušit vodorovný scroll slotů. Na webu neověřitelné → iPhone checklist bod 3. Pokud selže: motion-agent (výjimka pro vodorovné scrollery, např. Gesture.Native s simultaneous/blocksExternalGesture).

iPhone checklist kola (scroll):
1. Mapa: svislý tah scrolluje hned a plynule, bez zadrhnutí na startu.
2. Vodorovný/šikmý tah přes pozadí hýbe tečkami a obrazovka se neposune.
3. Šatník: vodorovné sloty jdou posouvat prstem.
4. Kotouč a tab bar reagují na tah i tap jako dřív (žádné spolknuté gesto).
5. Reduce Motion zapnuté: scroll funguje, tečky bez vlny; haptika beze změny.

---

## QA elite fáze 1, Task 5 + kolo 1 (HEAD `9d4b7fc`, commity db91f21, 3f77426, 9d4b7fc), 2026-10-07

**Verdikt pro HEAD `9d4b7fc` (+ necommitnuté e2e soubory tohoto kola): NESCHVÁLENO.** Logika, toky a výkon jsou zelené. Blokuje rozbitý layout prvního průchodu na šířce 320 (oslava a mapa).

### Build a testy
- ✅ `npx tsc --noEmit` 0 chyb, `npx eslint .` 0, `npx jest` 71 sad / 703 testů.
- ✅ `npm run e2e` 107/107 (6.7 min), včetně nových toků a 24 nových baseline. `npm run e2e:perf` 4/4 (fps mapa i oslava ≥ 55, čas do [START LESSON] ≤ 3 s, plátna ≤ 12).
- ✅ Nativní log `$TEMP/expogo.log` (283 ř.): 5 ERROR řádků (ř. 30, 48, 107, 166, 225) pochází z doby před kolem: 4× SyntaxError `app/(tabs)/index.tsx (83:30)` (rozepsaný mezistav, opraveno v f0173ee) a 1× „GestureDetector … view-flattened“ (chyba opravená v f0173ee). Po ř. 225 žádný ERROR.

### Task 5: dodáno
- `e2e/flows/first-run.spec.ts`: (1) reset → path → birth → mapa (bublina mapStart, Finish setup 4 steps) → dvojí klik Start lesson (assert: `history.length` +1, jedna navigace) → lekce → oslava (bublina „That's your first plate“, [SET YOUR GOALS]) → /setup → Done → mapa bez dlaždice a bez bubliny, i po reloadu. Čas od otevření po start lekce **6.3 s** (≤ 30 s, anotace `time-to-lesson-ms`). (2) starý (demo) profil: bez bubliny a bez Finish setup.
- `e2e/flows/map-ripple.spec.ts`: tah myší po pravém okraji pozadí mapy změní pixely výřezu oproti klidu. Kontrolní běh bez tahu (3×) dal shodné pixely, takže test nepadá falešně.
- Vizuální baseline (vědomě, `--update-snapshots --grep first-run`): `first-run-map`, `first-run-setup`, `first-run-celebration` × 8 projektů. **Pozor:** baseline w320 (dark i light) pro `first-run-map` a `first-run-celebration` zachycuje vadu níže; po opravě je musí design-agent vědomě přegenerovat.
- Poznámka k testům: mimo demo profil skrývá [SKIP] adaptivní pravidlo `canSkip` (lekce by se nezapočítala), takže toky klikají [DONE] a výdrž nechají doběhnout. Je to záměr, ne chyba.

### Review Focus
- ✅ Starý profil bez bublin a setupu (e2e + jest `needsSetup`).
- ✅ Reset → nový first run: bubliny i dlaždice znovu (e2e first-run a onboarding).
- ✅ measure 0 / selhání / bez odpovědi → `launch` vrátí false, navigace proběhne (`launchFromPlate(...).then(go, go)`, jest plateFlight 12 testů).
- ✅ Dvojí tap = jedna navigace (`tryBeginStart` zámek 1.5 s, `endStart` při fokusu mapy; e2e ověřuje historii).
- ✅ Čas do lekce ≤ 30 s (6.3 s).
- ✅ Kód PlateFlight: `FullWindowOverlay` jen pro `Platform.OS === 'ios'`, kořen `pointerEvents="none"`, worklet `useAnimatedStyle` zachytává jen čísla (dx, dy, end, turnDeg, fadeFrom) a sdílené hodnoty `p`, `fade`; tokeny z `lib/motion` (`plateFlight`), žádné hardcoded hodnoty.

### Rozbité (pro design-agenta)
1. ❌ **Oslava prvního průchodu, w320 (dark i light)**: kotouč překrývá titulek „Plate on the bar.“, dvojice pilulek [CONTINUE] + [SET YOUR GOALS] zakrývá řádek série (1 DAY) a „Tomorrow · …“. Reprodukce: 320×568, reset → path → birth → Start lesson → dokončit lekci. Ve w375+ je to v pořádku; druhá pilulka se na 320 nevejde, kotouč by měl být menší (nebo obsah scrollovat). Soubor `components/lesson/LessonCompleteScene.tsx`.
2. ❌ **Mapa prvního průchodu, w320**: bublina + dlaždice odsunou cestu tak, že [START LESSON] leží přes popisek kotouče („3 EXERCISES · 3 MIN / +20 XP“ pod pilulkou, název „Grip“ skrytý) a kotouč je napůl pod CTA. Text dlaždice je useknutý („FINISH SETUP · 4 STEP…“). Reprodukce: 320×568, první průchod do mapy. `app/(tabs)/index.tsx`, `components/map/FinishSetupTile.tsx`.
3. ⚠️ Bublina lekce „Hold the timer or tap Done“ se ukáže i u cviku na opakování (bez časovače). Copy by mělo odpovídat typu cviku (design-agent, `data/copy.ts` + lekce).

### Drobné (neblokuje)
- ⚠️ `lastRect` letu zůstane po ukončené lekci (quit) do příštího `launch`; projeví se jen u oslavy lekce otevřené deep linkem bez letu (tečky slétnou z místa staré řady teček, která je stejně na stejném místě). Motion-agent, nízká priorita.

### iPhone checklist (to, co web neukáže)
1. Start lesson z mapy: kotouč plynule přeletí nad lekcí (FullWindowOverlay nad fullScreenModal) do řady teček, bez bliknutí a záseku.
2. Rychlý dvojí tap na Start lesson: otevře se jen jedna lekce, haptika jen jednou.
3. První oslava: tečky slétají z místa, kam kotouč dolétl (řada teček nahoře), ne ze středu.
4. Zavření bubliny průvodce tapem: plynulé prolnutí, mapa dojede nahoru bez skoku, safe area nahoře drží.
5. Reduce Motion zapnuté: kotouč se jen prolne na místě, lekce se otevře hned, VoiceOver přečte bublinu („Tap the plate to start“).

---

## QA elite fáze 1, kolo 2 (HEAD `cce1093`, opravy design-agenta po kole 1), 2026-10-07

**Verdikt pro HEAD `cce1093`: SCHVÁLENO** (s ⚠️ níže, neblokují).

### Build a testy
- ✅ tsc 0, eslint 0, jest 703/703.
- ✅ `npm run e2e` 107/107 (6.7 min), čas do lekce v first-run toku 6.2 s. `npm run e2e:perf` 4/4.
- ✅ Nativní log: stále 283 řádků, ERROR jen na ř. 30–225 (starší než kolo 1, opraveno v f0173ee). Žádný nový.

### Nálezy kola 1
1. ✅ Oslava prvního průchodu w320 (dark i light): titulek, kotouč, bublina, XP, série i obě CTA bez překryvu ([SET YOUR GOALS] jako textové tlačítko). Řádek „Tomorrow · …“ je na w320 vynechaný (kompaktní režim), přijatelné.
2. ✅ Mapa prvního průchodu w320: CTA už nepřekrývá kotouč ani název „Grip“, dlaždice „SETUP · 4“ se nesekne.
3. ✅ Bublina lekce se řídí typem cviku (`reps` → „Do the reps, then tap Done“).
- ✅ 14 přegenerovaných baseline (záznam design-agenta v LOG, změna scrollToNode schválená bossem) prošlo kontrolou snímků w320.

### ⚠️ Zbývá (neblokuje)
- ⚠️ Výdrž: text „Hold the timer or tap Done“ zmiňuje Done, ale u výdrže je primární tlačítko [START]/[PAUSE] a Done tam není. → design-agent (`data/copy.ts`).
- ⚠️ Mapa w320: tečková šipka bubliny vede přes hlavu opičky a za levým okrajem bubliny prosvítá zbytek popisku „SE…“ (SECTION 01). „+20 XP“ se dotýká horní hrany [START LESSON]. Kosmetické → design-agent.
- ⚠️ Z kola 1: `lastRect` letu přežije ukončenou lekci (motion-agent, nízká priorita).

### iPhone checklist
1. Start lesson: kotouč plynule přeletí nad lekcí (fullScreenModal) do řady teček, bez bliknutí.
2. Rychlý dvojí tap na Start lesson: otevře se jen jedna lekce, haptika jen jednou.
3. V první oslavě tečky slétají z místa, kam kotouč dolétl.
4. Zavření bubliny tapem: plynulé prolnutí, mapa dojede bez skoku, horní safe area drží (zkontroluj i na menším iPhonu).
5. Reduce Motion: kotouč se jen prolne, VoiceOver přečte bublinu i „SETUP · 4“ srozumitelně.
