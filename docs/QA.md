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

---

## QA elite fáze 1, kolo 3 (HEAD `1569e1e`), 2026-10-07

Přísnější pravidlo (.claude/agents/qa-agent.md): kolize nebo ořez textu na kterékoli šířce = ❌.

**Verdikt pro HEAD `1569e1e`: NESCHVÁLENO** (1× ❌ na w320 v obrazovce lekce, mimo first-run opravy).

### Build a testy
- ✅ tsc 0, eslint 0, jest 703/703, `npm run e2e` 107/107 (do lekce 6.1 s), `npm run e2e:perf` 4/4.
- ✅ Nativní log: 283 řádků, ERROR jen ř. 30–225 (staré, f0173ee). Nic nového.

### Prohlídka snímků (w320 + w375, dark/light; růžový čtverec = maska živé tečky)
- ✅ first-run-map w320 dark/light: bublina přes celou šířku, šipka vlevo od opičky (ne přes ni), „SETUP · 4“ celé, „+20 XP“ má vzduch nad [START LESSON]. Zbytek „SE…“ za bublinou zmizel.
- ✅ first-run-celebration w320 dark/light: bez kolizí.
- ✅ first-run-setup w320: čisté (seznam pokračuje pod [DONE] jako scroll, 4. řádek dostupný scrollem).
- ✅ celebration (demo) w320/w375, map w375, first-run-map w375: bez kolizí.
- ✅ Text výdrže: „Tap Start and hold the position“ (bez Done).
- ❌ **lesson (demo, 1. cvik = výdrž Crow) w320 dark i light:** v klidovém stavu dolní lišta [SKIP]/[START] usekne číslice odpočtu „10“ napůl a název cviku „Crow“ s popisem nejsou vidět vůbec (až po scrollu). Hlavní prvek obrazovky výdrže je oříznutý. Ve w375 je vše celé. Reprodukce: 320×568, demo profil → Start lesson. Patří design-agentovi (`app/lesson/[id].tsx` ExerciseStep / `components/lesson/ExerciseCard`): na kompaktní výšce zmenšit ilustraci nebo kruh časovače (`useCompact`), aby se kruh i název vešly nad lištu. Baseline w320 `lesson` je pak třeba vědomě přegenerovat.
- ⚠️ map (demo) w320: pod plovoucí [START LESSON] projíždí uzel bosse a mezi CTA a tab barem je vidět „Section boss“. Jde o obsah mapy za plovoucím ovládáním (scroll), aktuální uzel je celý vidět. Doporučuji, aby design-agent posoudil, jestli `footerSpace`/scrollToNode nemá na w320 nechat pod CTA prázdný pruh. Nehodnotím jako ❌, protože jde o posuvný obsah, ne o pevnou kolizi.

### iPhone checklist
1. Let kotouče mapa → lekce plynulý, bez bliknutí nad fullScreenModal.
2. Rychlý dvojí tap na Start lesson: jedna lekce, jedna haptika.
3. První oslava: tečky slétají z místa, kam kotouč dolétl.
4. Bublina přes celou šířku: tap ji plynule zavře, mapa dojede bez skoku, safe area nahoře drží.
5. Reduce Motion + VoiceOver: kotouč se jen prolne, VoiceOver přečte bublinu i „SETUP · 4“.

---

## QA elite fáze 1, kolo 4 (HEAD `6da8f1b`, vědomá výjimka z max. 3 kol), 2026-10-07

**Verdikt pro HEAD `6da8f1b`: NESCHVÁLENO** (ořez textu bublinou průvodce v lekci prvního průchodu, w320 i w375).

### Build a testy
- ✅ tsc 0, eslint 0 (ignoruje e2e/report a test-results), jest 703/703, `npm run e2e` 107/107 (do lekce 6.1 s), `npm run e2e:perf` 4/4.
- ✅ Nativní log: 283 řádků, ERROR jen ř. 30–225 (staré). Nic nového.

### Prohlídka
- ✅ lesson (demo, výdrž Crow) w320: ilustrace, kruh 160 s „10“, GET READY, název i celý popis nad lištou. Opraveno.
- ✅ first run cvik 2 (opakování, Scapular pull) w320 light: číslo, název, popis, bublina „Do the reps, then tap Done“, [DONE] bez kolize.
- ✅ first run cvik 3 (výdrž Hollow hold, bez bubliny) w320: čisté.
- ✅ first-run mapa/oslava/setup w320, demo oslava w320/w375: beze změny čisté (kolo 3).
- ❌ **first run cvik 1 (výdrž Dead hang, s bublinou „Tap Start and hold the position“) w375 dark:** bublina leží přes titulek, z „Dead hang“ je vidět jen horní půlka písmen. Reprodukce: 375×812, reset → path → birth → Start lesson. Snímek pořízen ad hoc (Reduce Motion, po usazení), v baseline tato obrazovka není.
- ❌ **Totéž w320 dark:** popis cviku je useknutý uprostřed věty („Overhand grip, shoulder-width,“), zbytek je za bublinou / pod hranou scrollu bez náznaku pokračování.
  - Příčina: bublina se vkládá mezi `IntentScrollView` a lištu (`app/lesson/[id].tsx`, `{guide ? <View …>{guide}</View> : null}`) a ubere výšku scrollu; obsah karty výdrže (ilustrace + kruh + název + popis) se na w320/w375 pak nevejde. Patří design-agentovi: např. bublinu v lekci umístit do scrollu pod popis, nebo v kompaktním režimu zmenšit kruh/ilustraci i při bublině. Doporučuji přidat baseline `first-run-lesson` (první cvik s bublinou), aby to e2e hlídalo.
- ⚠️ map (demo) w320: mezi [START LESSON] a tab barem je pořád vidět „Section boss“ a štítek „BOSS“ je pod CTA (baseline se nezměnila, plný podklad pod CTA na snímku nevidím). Posuvný obsah, ne pevná kolize; ať design-agent ověří, že oprava „plný podklad“ skutečně platí.

### iPhone checklist
1. Let kotouče mapa → lekce plynulý, bez bliknutí nad fullScreenModal.
2. Rychlý dvojí tap na Start lesson: jedna lekce, jedna haptika.
3. První oslava: tečky slétají z místa, kam kotouč dolétl.
4. První cvik s bublinou na tvém iPhonu: titulek i popis cviku celé, bublina nic nepřekrývá a po Start plynule zmizí.
5. Reduce Motion + VoiceOver: kotouč se jen prolne, VoiceOver přečte bublinu i „SETUP · 4“.

---

## QA elite fáze 1, kolo 5 (HEAD `2c8dfb8`), 2026-10-07

**Verdikt pro HEAD `2c8dfb8`: SCHVÁLENO.**

### Build a testy
- ✅ tsc 0, eslint 0, jest 703/703, `npm run e2e` 115/115 (do lekce 6.1 s), `npm run e2e:perf` 4/4.
- ✅ Nativní log: 283 řádků, ERROR jen ř. 30–225 (staré, f0173ee). Nic nového.

### Prohlídka (kolize/ořez = ❌)
- ✅ first-run-lesson w320 dark a w375 light: ilustrace, kruh 25, GET READY, „Dead hang“ a celý popis, pod ním bublina v obsahu scrollu, nic nepřekrývá. Nález kola 4 opraven.
- ✅ lesson (demo, Crow) w320 light: celé.
- ✅ first-run-map, oslavy (first run i demo) a /setup w320/w375: beze změny čisté.
- ✅ map w320 dark (nová baseline): pod [START LESSON] plný podklad, mezi CTA a tab barem už žádný text.
- ✅ map odscrollovaná ad hoc (w320 dark dolů i nahoru, w375 light dolů): u CTA nic neprosvítá, uzly a popisky se nepřekrývají. Obsah nahoře zajíždí pod závoj hlavičky (posuvný obsah, tlumený podle návrhu), není to pevná kolize.
- ⚠️ first-run-lesson w320: z tečkové šipky bubliny je nad lištou vidět jen jedna tečka (zbytek pod lištou při klidové pozici scrollu). Dekorace, ne text; design-agent může na kompaktu šipku vypustit.

### iPhone checklist
1. Let kotouče mapa → lekce plynulý, bez bliknutí nad fullScreenModal.
2. Rychlý dvojí tap na Start lesson: jedna lekce, jedna haptika.
3. První oslava: tečky slétají z místa, kam kotouč dolétl.
4. První cvik s bublinou: titulek i popis celé, bublina ve scrollu pod popisem, po Start plynule zmizí; dole safe area nad lištou drží.
5. Reduce Motion + VoiceOver: kotouč se jen prolne, VoiceOver přečte bublinu i „SETUP · 4“.

## QA elite fáze 2: zvuk a haptika (HEAD 7636146; 65d362f + 9106914 + 7636146)
Verdikt: **SCHVÁLENO** pro HEAD `7636146c398075965128fb42f316c9d3271b918d`.
- ✅ `tsc --noEmit` 0 chyb, `eslint .` 0, `jest` 75 sad / 718 testů, `npm run test:node` 25/25, `npm run e2e` 115/115 (bez nových baseline).
- ✅ `lib/feedback.ts`: haptika a zvuk ve stejném ticku, zvuk přes `sfxGate` (40 ms na stejný zvuk, různé zvuky se neblokují); `logic/sfxGate.ts` je čistá logika s časem zvenku.
- ✅ `lib/feedbackMap.ts`: navigace (tab/cta/tapLight/wheelStep) bez zvuku; `mascotTap` → `['selection','pop']`; všech 9 zvuků existuje v `assets/sounds/`.
- ✅ `lib/sound.ts`: preload jednou (`_layout`), web bez zvuku, `soundEnabled` se kontroluje při každém přehrání, chyby se tiše spolknou, chybějící přehrávač → no-op. `playsInSilentMode:false` + mixWithOthers, ducking jen při oslavě.
- ✅ PlateFlight: `flightStart` jen při skutečném letu (reduce motion → ticho).
- ✅ LessonCompleteScene: success jen jednou (`signature` mapuje úder 'success' na `lessonDone`, ostatní údery jsou jen haptika); `snap` je jen zvuk, protože heavy nese podpis; reakce `lessonDone` → 'celebrate' nevolá `mascotJoy`, takže success se nezdvojí. Platí i pro reduce motion (celebrationHaptics(true) → 1× lessonDone).
- ✅ stage-up: `stageUp` přesně 1× v obou větvích (reduced i plné).
- ✅ GuideBubble: `guideShow` 1× za mount (ref `announced`, timer se při unmountu ruší).
- ✅ setup: `setupDone` jen při `ok`, jinak stav chyby bez zvuku.
- ✅ Rychlé opakování: brzdí ho gate (stejný zvuk ≥ 40 ms), haptiku negatuje (záměr, jako v minulých fázích).
- ✅ Nativní log `$TEMP/expogo.log`: beze změny od minulého kola (283 ř., poslední ERROR na ř. 225 je historický, viz výše) → žádný nový ERROR. ⚠️ V logu ale není nový bundle, takže fáze 2 v Expo Go ještě neběžela; zvuk na nativu ověří až iPhone checklist.
- ⚠️ (motion-agent, ne blokující) Na webu je zvuk záměrně vypnutý, takže e2e ho neověří; ladění hlasitostí 35/50/60 % je jen odhad od stolu.

### iPhone checklist
1. Hlasitost: tick/pop jsou tiché, success/levelUp zřetelné, ale nepřeřvou hudbu (ta se při oslavě ztlumí a pak vrátí).
2. Ladění dohromady: odpočet 3-2-1-GO, konec lekce (snap → success) a stage-up znějí jako jedna rodina, nic neskřípe.
3. Tichý režim (boční přepínač): žádný zvuk, haptika dál funguje; přepínač Zvuk v Nastavení vypne zvuk, ale haptiku nechá.
4. Haptika sedí na zvuk: nacvaknutí kotouče, success v oslavě a ťuknutí na opičku (pop) přijdou v tom samém okamžiku.
5. Rychlé ťukání na opičku / tab bar: žádné „bzučení“ ani zasekávání.

## QA elite fáze 3: opička 2.0 (HEAD 952a497; 0636ece + aaa7ee2 + 952a497), 2026-10-07

Verdikt: **NESCHVÁLENO** (1 vizuální kolize, logika v pořádku).

Ověřeno
- ✅ `npx tsc --noEmit` 0 chyb, `npx eslint .` 0 nálezů (včetně `local/no-worklet-object-capture`), `npx jest` 78 sad / 740 testů, `npm run test:node` 0 fail.
- ✅ `npm run e2e` (8083, prod export) 117/117, včetně `flows/mascot-line.spec.ts` (w390 + w320 geometrie: ve viewportu, pod nadpisem).
- ✅ `logic/mascotLines.ts`: hranice hodin 5/11/17/22, půlnoc = night; priorita todayDone > série ≥ 7 > ≥ 1 > denní doba; ztracená série bez výčitky; žádná věta dvakrát po sobě.
- ✅ `hooks/useMascotLine.ts`: rychlé ťukání omezeno cooldownem reakcí, timer se čistí při unmountu; průvodce (`blocked`) má přednost, replika hned zmizí.
- ✅ `ReactiveMascot` onTap: gesto `runOnJS(true)`, v workletu se nic nezachytává; VoiceOver activate taky volá `onTap`.
- ✅ Rekord série: `streakRecord` jen při streak ≥ 2 a > předchozí nejdelší; při retry lekce se událost nepřidá, rekord se nehlásí podruhé.
- ✅ `prideBeat`: bez rekordu ani přírůstku série nic; proud až po cheer + max(scan, cooldown); podpis `celebrationHaptics` nezměněn (11 úderů), žádný zvuk navíc. Reduce Motion: řádek hned, proud po cooldownu (1200 ms), jak schválil boss.
- ✅ Nativní log `$TEMP/expogo.log`: beze změny (283 ř., poslední ERROR ř. 225 je historický) → žádný nový ERROR. Fáze 3 v Expo Go zatím neběžela.

Rozbité
- ❌ **Bublina repliky zakrývá popisek uzlu na mapě (w430, dark i light).** Postup: demo profil, mapa na w430, ťuknout na opičku. Bublina (x ≈ 100–332, y ≈ 248–297) leží přes popisek dokončeného uzlu nad opičkou a zpod její levé hrany kouká první písmeno („U“). Na w320 je popisek zakrytý celý. Uříznuté písmeno vypadá jako vada, ne jako záměrné překrytí. Patří **design-agentovi**: buď bublinu umístit mimo popisky, nebo popisek po dobu repliky skrýt či ztlumit. Potom přidat do `mascot-line.spec` kontrolu, že se bublina nepřekrývá s textem uzlu. Screenshoty jsou ve scratchpadu QA (bub-320/430 dark/light).
- Na w320 nadpis, tab bar ani CTA nekolidují a text bubliny („WEEK-PLUS STREAK. RESPECT.“) se neořezává.

iPhone checklist (max. 5)
1. Na mapě rychle ťukej na opičku ~10×: bublina nebliká, text se mění nejdřív po cooldownu, haptika poskoku se nezdvojuje.
2. Na iPhonu s malým displejem nebo s Dynamic Island: bublina zůstane pod hlavičkou a mimo safe area.
3. Se zapnutým VoiceOver dvakrát ťukni na opičku: replika se přečte.
4. Dokonči lekci s novým rekordem série: řádek rekordu a hrdost opičky sedí do rytmu oslavy, bez zvuku navíc. Skip oslavu přeskočí čistě.
5. Se zapnutým Reduce Motion udělej totéž: řádek rekordu je hned, proud zhruba po 1,2 s a nic necuká.

## QA elite fáze 3, kolo 2: HEAD 7bc1f5b (oprava překryvu LineBubble po 952a497)

Verdikt: **SCHVÁLENO** pro HEAD `7bc1f5b939e47f29e6c81733a4c842370cfb995d`.

- ✅ `npx tsc --noEmit` čisté, `npx eslint .` čisté, `npx jest` 78 sad / 740 testů, `npm run test:node` 0 fail.
- ✅ `npm run e2e` (dist na 8083) 117/117, žádná nová baseline.
- ✅ Test opravdu chytá chybu: dočasně jsem dal `HIDDEN = { opacity: 1 }`, oba testy v `mascot-line` (w390 i w320) spadly s `covered = ["Upside down", …]`. Po vrácení přes `git checkout` prošly 2/2, pracovní strom je čistý.
- ✅ Snímky po ťuknutí na opičku na w320 a w430, dark i light (dočasný spec, smazaný): bublina je celá ve viewportu, pod hlavičkou a nad CTA a nepřekrývá žádný viditelný text. Skrytý je jen popisek „Upside down“ (dokončený uzel nad opičkou), na všech 5 kombinacích (včetně w390-dark).
- ✅ Skrývá se jen to, co bublina kryje: před ťuknutím 0 prvků s opacity 0, během repliky 1 („Upside down“), po zmizení bubliny zase 0. Popisek se vrátí, ověřeno i na snímku w320-dark po zmizení. Nadpis sekce, popisky ostatních uzlů, boss i CTA zůstávají vidět.
- ✅ Přístupnost: skrytý `NodeLabel` má `accessibilityElementsHidden` a `importantForAccessibility="no-hide-descendants"`. Prvek zůstává v layoutu, takže nic neposkočí.
- ✅ Nativní log `$TEMP/expogo.log` se nezměnil (283 ř., naposledy zapsán 07:08). Poslední ERROR na ř. 225 je historický → žádný nový ERROR. Fáze 3 v Expo Go zatím neběžela.
- ⚠️ (motion-agent) Popisek zmizí a vrátí se skokově, bez prolnutí. Funkčně je to v pořádku, prolnutí by bylo čistší.
- ⚠️ (design-agent, netýká se této změny) Na w320/w430 jsou pod průsvitnou hlavičkou vidět vyblednuté popisky odscrollovaných uzlů („Shoulders down“ za tečkami postupu, „Overhead“ za nadpisem). Jde o záměrné podjíždění pod hlavičku a je to i ve schválených baseline. Design by měl potvrdit, že je to zamýšlené.
- Odhad obdélníku bubliny používá `L.room`, ne skutečnou výšku. Skutečná bublina (44–60 pt) se do něj na všech měřených šířkách vešla.

iPhone checklist:
1. Ťukni na opičku na mapě: popisek nad ní zmizí jen po dobu repliky, potom se vrátí. Nic neposkočí ani nebliká.
2. Rychle ťukej na opičku asi 10×: haptika se nezdvojuje, popisek nezůstane skrytý.
3. Se zapnutým VoiceOver projdi mapu během repliky: skrytý popisek se nepřečte, replika ano.
4. Na iPhonu s Dynamic Island: bublina je pod hlavičkou a mimo safe area.
5. Plynulost: posun mapy pod hlavičku při replice nesmí cukat.

## QA elite fáze 4 (audit a řemeslo), kolo 1 — HEAD 3ced780 (3bbdd69 design + 3ced780 motion)

**Verdikt: SCHVÁLENO** pro HEAD `3ced78088f2ae159493f7056a32eef87a73ee51e`.

### Brány
- ✅ `npx tsc --noEmit` 0 chyb, `npx eslint .` 0 nálezů (včetně `local/no-worklet-object-capture`; `useLabelYield` zachytává jen sdílenou hodnotu).
- ✅ `npx jest` 81 sad / 755 testů zelených, `npm run test:node` zelený.
- ✅ `npm run e2e` (8083) 159/159 (flows, visual 4 šířky × dark/light, a11y labels + large-text na w320/w390). `npm run e2e:perf` 4/4 (plátna ≤ 12, čas do [START LESSON] ≤ 3 s, medián fps mapa i oslava ≥ 55).
- ✅ Nativní log `$TEMP/expogo.log` beze změny (283 ř., naposledy zapsán 07:08, poslední ERROR ř. 225 historický) → žádný nový ERROR. Fáze 4 v Expo Go zatím neběžela.

### Review Focus
- ✅ Nové baseline `map` / `first-run-map` (12 souborů, záznam v LOG design-agenta): prohlédnuty w320 dark + light. „Balance 101“ / „Pulling 101“ v plných 40 pt bez ořezu, závoj hlavičky plný, žádná kolize.
- ✅ Testy a11y opravdu chytají chyby (mutace, pak vráceno, `git status` čistý):
  - `PlateNode` s `accessibilityLabel=""` → `a11y popisky: map` ✘ (chyceno).
  - `typeMaxScale` u label/tab/pill/body/title… = 3 a `SCALE` = 3 → `velké písmo: map` a `lesson` ✘ (detektor kolizí funguje).
  - ⚠️ Pozor: zvýšit jen strop `typeMaxScale` nad 1.4 test **nechytí** (test škáluje 1.4×, strop nad tím je neaktivní). Velké písmo nad 1.4× (iOS AX velikosti až ~3×) web nehlídá — pokrývá to jen strop v theme. Pro boss/design-agent: zvážit druhý běh s 2× aspoň na mapě a lekci.
- ⚠️ Chybový stav při selhání úložiště (ověřeno reálně: Playwright `Storage.prototype.getItem` throw, demo profil, `/`, `/league`, `/season`, w320-dark): **neukáže prázdnou obrazovku**, ale ani `ErrorState` — zustand persist hydrataci selže (`onRehydrateStorage` „začínám načisto“, rozhodnutí z dřívějších fází) a vracející se uživatel spadne do onboardingu. Po dokončení onboardingu by se uložený profil přepsal. Není to regrese fáze 4, ale vědomě to tu zapisuji jako riziko ztráty dat → **boss** (`store/db.ts`: při chybě hydratace nezapisovat a ukázat `ErrorState` s Retry). `ErrorState` se tak v praxi zobrazí jen, když vyhodí service; to pokrývá jest (`StateView.test`, `useServiceQuery.test`).
- ✅ Skeleton nebliká: `useDelayed(skeletonDelayMs 300)`; snímek 120 ms po navigaci na `/progress`, `/league`, `/season` (first run, w320 dark/light) ukazuje rovnou obsah, žádný záblesk teček.
- ✅ Prázdné stavy w320 dark/light (liga před první lekcí, progres bez historie, sezóna bez cíle) bez kolizí (`textCollisions` = []), čitelné, pozvánka + CTA.
- ✅ Reduce Motion: `calmFade` nese `ReduceMotion.Never` (jinak by reanimated prolnutí přeskočil → skok), stejně `ExerciseCard`, recap, `LeagueResultBanner`, birth; `useLabelYield` jen krytí, `hidden` platí hned. Skeleton při omezeném pohybu statický.
- ✅ Žádná regrese dokončení lekce: flows (dokončení, odemčení, XP, liga, persist po reloadu) a vizuál oslavy na všech šířkách zelené, perf oslavy ≥ 55 fps.
- ⚠️ VoiceOver pořadí na mapě (hlavička → uzly → CTA → tab bar) web neověří spolehlivě → iPhone checklist.

### SPEC
- ⚠️ `docs/SPEC.md` §mapa: štítek `SEKCE 01 · ZÁKLADY ROVNOVÁHY`. Teď `SECTION 01` + titulek „Balance 101“. „101“ je idiomatický anglický ekvivalent „základů“, struktura (štítek s číslem sekce + název) zůstává → specifikaci neodporuje, jen odchylka v překladu (UI je anglicky od 2026-10-06). Doporučení pro boss: poznámka do SPEC.

### Drobnosti (neblokují)
- ⚠️ Mapa w320-dark: popisek dalšího uzlu („BOSS“) vykukuje 2 px nad plovoucím CTA. Je to scrollovaný obsah pod překryvem, ne ořez prvku → design-agent, případně prodloužit závoj nad CTA.

### iPhone checklist (uživatel)
1. Dynamic Type: Nastavení → Zobrazení → Velikost textu na maximum (bez AX): mapa, liga a lekce na SE/mini, titulky a tab bar se nesmí překrývat ani ořezat.
2. VoiceOver na mapě: přejížděním doprava pořadí hlavička → uzly shora dolů (název, stav, minuty) → [START LESSON] → taby; dekorace a opice se nečtou.
3. Reduce Motion zapnout: dokončení lekce, liga, onboarding birth a recap jen klidně prolínají, nic neskáče ani nebliká.
4. Chybový stav / načítání: při studeném startu není vidět blikající skeleton, obrazovky naběhnou rovnou.
5. Plynulost: scroll mapy a ustupování popisků pod bublinou opičky bez trhání; haptika při dokončení lekce beze změny.

## QA elite fáze 4 – kolo 2 (HEAD 06102e15a37dffff271f3d1e46f1b6a253c2f7f4, oprava rizika ztráty dat z kola 1)
- ✅ `npx tsc --noEmit`, `npx eslint .` čisté; `npx jest` 82 sad / 756 testů zelených (včetně nového `hooks/__tests__/dbLoadFailed.test.ts`); `npm run test:node` zelený.
- ✅ `npm run e2e` (8083): 159/159 prošlo, žádný vizuální diff, žádná nová baseline.
- ✅ Experiment z kola 1 zopakován (dočasný Playwright spec, smazaný): demo profil, pak `localStorage.getItem('opice-db')` vyhazuje chybu, navigace na `/`, `/league` a `/season` ve w320 dark i light. Ve všech 6 případech se ukáže StateView error („Couldn't load your profile.“ + Try again), onboarding se nespustí, URL neobsahuje `onboarding`. Retry, když chyba trvá, nechá chybový stav. Uložený `opice-db` je bajtově stejný jako před chybou. Po obnovení úložiště Retry vrátí appku s původním profilem (jméno se shoduje). Screenshoty w320 dark i light: bez kolizí, bez ořezu.
- ✅ Zápisy během chyby: všechny zápisy ze services jdou přes `setProfile`, ten je při `loadFailed` no-op; `guardedStorage.setItem/removeItem` jsou navíc zablokované. Reset z dev menu (`setProfile(null)`) za chyby nic nesmaže.
- ✅ Poškozený JSON (`{broken`) → onboarding, tj. začít načisto. Odpovídá LOG: `readFailed` se nastaví jen při výjimce z getItem, ne při chybě parsování.
- ✅ Revize: `onRehydrateStorage` zvedá `revision` i při chybě; retry přes `persist.rehydrate()` ji zvedne znovu, takže hooky se znovu načtou.
- ⚠️ Settings store (`store/settings.ts`) nemá stejnou ochranu: když čtení selže, pokračuje s výchozími hodnotami a první změna nastavení přepíše uložená nastavení (téma, připomínky, posun času). Nejde o herní postup, proto to verdikt neblokuje. Patří bossovi (store).
- ⚠️ Chybový stav nemá regresní e2e test, pokrývá ho jen jest. Doporučení pro bosse: přidat spec podle experimentu výše.
- ✅ Nativní log `$TEMP/expogo.log` beze změny (283 ř., poslední ERROR na ř. 225 je historický) → žádný nový ERROR.

**Verdikt: SCHVÁLENO** pro HEAD 06102e1.

iPhone checklist:
1. Normální start s uloženým profilem: žádný záblesk chybové obrazovky ani onboardingu, rovnou mapa.
2. Pokud uvidíš chybovou obrazovku: opice a text jsou celé pod notchem/Dynamic Islandem a tlačítko Try again je nad home indikátorem.
3. VoiceOver na chybové obrazovce přečte nadpis, text a tlačítko „Try again“ jako tlačítko.
4. Ťuknutí na Try again má haptickou odezvu a nic se nezasekne.

## QA elite fáze 5 — vstupní test a bezpečnost (HEAD 5beb26b; commity 2819d79, 4e8efd5, e16e5a9, 5beb26b)

**Brány:** tsc ✅ · eslint ✅ · jest 86/781 ✅ · test:node ✅ · `npm run e2e` 162/162 ✅ (vizuál beze změny baseline, oslava/dokončení lekce beze změny) · e2e:perf 4/4 ✅ · `$TEMP/expogo.log` 0× `ERROR` ✅ (Expo Go 8084 ani 8082 nedotčeno).

**Logika (`logic/fitnessTest.ts`)** ✅ dávka = 0.5 × max vůči ref. 8 kliků / 30 s plank, meze 0.5–1.5×, kolena = polovina, spodní meze 3 op. / 5 s, výdrže po 5 s. Bez testu `NEUTRAL_SCALE`: všechny dávky knihovny (≥4 op., výdrže násobky 5) identické → lekce, minuty na mapě (`useLessonMinutes`), oslava i připomínka (`LocalNotificationService`) stejné. Dluh se počítá ze škálované dávky (test v MockLessonService), opakovaný test přepíše starý (test), sanitizace NaN/záporných/stropů (test).

**Obrazovka `app/fitness-test.tsx`** ✅ skip (křížek / Skip) nic neuloží (e2e), „Ano“ v PAR-Q jen upozorní (alert, liveRegion), disclaimer pod každým krokem, stopky z `Date.now()` značek (po zamčení správný čas), dvojklik na Save hlídá `inFlight`. Screenshoty 4 kroků + Nastavení + lekce na w320/w430 dark+light: textCollisions = [] všude, žádný ořez ✅.

**Bezpečnostní texty** ✅ 7 otázek věcně odpovídá obecné části PAR-Q+ 2024, „consult“ jen doporučuje lékaře, disclaimer neradí nad rámec. Caution („Use a wall or soft floor, warm up your wrists, stop if anything hurts“) je obecná, ne lékařská rada.

**Nálezy (neblokující):**
- ⚠️ (boss/spec) Uložení s nevyplněnými nulami (Next → Next → Save bez zadání) uloží test 0/0 → násobek 0.5×, dávky se zpolovičí. Repro: Settings → Retake level test → 3× Next → Save → lekce bc-1-1 plank 15 s. Navrhuji: 0 = „nezadáno“ → neutrální osa, nebo Save zakázat bez vstupu. Rozhodnutí spec, neopravuji.
- ⚠️ (design-agent) VoiceOver stepper planku: „One more s“ / „One less s“, ale krok je 5 s — popisek neodpovídá a jednotka je zkratka. Navrhnout „5 seconds more“.
- ⚠️ (design-agent) Caution poznámka na w320 až pod ohybem: bezpečnostně slabé — kdo nescrolluje, začne stojku bez ní. Návrh: krátký CAUTION štítek nad/u názvu cviku nad ohybem, plný text může zůstat níž.
- ⚠️ (design-agent, nesouvisí s fází) Nastavení w320: „Crow 15 / s“ — jednotka se zalomí na další řádek; použít NBSP mezi číslem a jednotkou.
- ⚠️ `resultLine` zaokrouhluje na 1 desetinné místo (0.75 → ×0.8) — kosmetické.

**Verdikt: SCHVÁLENO** pro HEAD 5beb26b (nulový test je produktové rozhodnutí, ne kolize/ořez).

**iPhone checklist:**
1. Stopky planku: Start, zamknout telefon na ~20 s, odemknout — čas odpovídá skutečnosti; haptika Start/Stop.
2. VoiceOver: otázky ano/ne čtou číslo otázky, alert „check with a doctor“ se ohlásí, stepper kliků lze upravit swipem nahoru/dolů.
3. Safe area: lišta Back/Next nad home indikátorem, klávesnice při psaní čísla nepřekryje pole.
4. Přechody mezi kroky plynulé, napočítání výsledku bez trhání.
5. Wall handstand lekce: caution poznámka je k nalezení před začátkem cviku.

## QA elite fáze 5 — kolo 2 (HEAD 91df1261febb952d18d70bb7c073069ecac4eba6; commit 91df126, opravy nálezů kola 1)

**Brány:** tsc, eslint, jest 784/784, e2e 162/162 (spustil boss na tomto HEAD) ✅ · `npm run test:node` 25/25 ✅ · `e2e:perf` 4/4 ✅ (čas do START, fps mapy a oslavy ≥ 55, canvasy ≤ 12) · `$TEMP/expogo.log` 116 ř., 0× `ERROR` ✅ (Expo Go 8084/8082 jsem nespouštěl ani nezastavoval).

**Ověření nálezů z kola 1** (dočasný Playwright spec na w320 dark+light, po běhu smazán; screenshoty jsou ve scratchpadu):
- ✅ Nulový test: 3× Next → výsledek „Lessons scaled: reps ×1, holds ×1“ + 2× „Not entered · default“. Po Save je plank v lekci bc-1-1 30 s (výchozí, už ne 15 s). Logika: `scaleFromTest` 0 → složka 1; nové unit testy (0/0 = NEUTRAL, 0/120 = 1 / max).
- ✅ CAUTION štítek: bc-1-5 „Pike hold [CAUTION]“ na w320 dark i light nad lištou Skip/Start, bez scrollu, textCollisions = []. Plná věta (s a11y popiskem „Caution. …“) zůstává níž. Štítek je skrytý pro VoiceOver, aby se nečetl dvakrát, takže uživatel VoiceOveru se o caution dozví až z poznámky (→ iPhone checklist).
- ✅ a11y stepperu: „1 rep more/less“, „5 seconds more/less“ (krok PLANK_STEP).
- ✅ keepUnits: Nastavení i Setup na w320 zobrazují „Crow 15 s“ na jednom řádku. Řádek „L-sit 10 s · 60 s plank ·“ se láme jen u oddělovače. Regex `(\d) (?=(s|kg|reps|min)\b)` → NBSP (ověřeno bajty C2 A0), používá se jen u řádků s milníky. Se slovy jako „sets“ nebo „second“ se nespáruje, protože chybí `\b`. Ostatní texty to neovlivní.
- ✅ resultLine: přesný násobek (×1, ×1.5, ×0.75), e2e upraven.
- ✅ Dokončení lekce beze změny: od 5beb26b se nezměnil žádný soubor oslavy, odemčení ani XP (změny jsou jen v ExerciseCard, tj. v hlavičce cviku). Flows i perf oslavy jsou zelené.

**Nové drobnosti (neblokují):**
- ⚠️ (boss/copy) Když se uloží nulový test, řádek v Nastavení a Setupu ukazuje „0 push-ups · 0 s plank“, kdežto výsledek ukazuje „Not entered · default“. Je to nekonzistentní. Navrhuji použít `rowValue` s „not entered“ pro 0, případně „Not tested“, když jsou obě hodnoty 0. Repro: Settings → Retake level test → 3× Next → Save → Settings, sekce Training level.
- ⚠️ (info) Monotonie kliků teď platí od 1 výš: 0 dává ×1, ale 1 dává ×0.5. Je to záměr (0 = nezadáno) a test je upravený.

Kolize ani ořez nejsou na w320 nikde (Settings, Setup, bc-1-5, výsledek; dark i light).

**Verdikt: SCHVÁLENO** pro HEAD 91df126.

**iPhone checklist:**
1. Lekce bc-1-5 na menším iPhonu: štítek CAUTION vedle „Pike hold“ je vidět bez scrollu a není pod lištou ani home indikátorem.
2. VoiceOver na stepperu: kliky čtou „1 rep more“, plank „5 seconds more“. V lekci s caution se poznámka „Caution. …“ přečte před tlačítkem Start.
3. Výsledek bez zadání: obě řádky „Not entered · default“ jsou čitelné. Napočítání a přechod na výsledek jsou plynulé.
4. Haptika stepperu a stopek je stejná jako v kole 1. Haptika dokončení lekce se nezměnila.

## QA intro OPICE — commity 483a03c (logika), be8668c (design), 7063fb3 (motion) — HEAD 7063fb3091099788239f0ba2176b926b1410642c

**Verdikt: SCHVÁLENO** (pro HEAD 7063fb3)

### Brány
- ✅ `npm test` (jest, TZ Praha): 88 sad / 799 testů zelených.
- ✅ `npm run test:node`: 25/25.
- ✅ tsc, eslint, e2e 164/164 (pustil boss, stejný HEAD).
- ✅ `npm run e2e:perf`: všech 5 rozpočtových testů zelených (TTI mapy ≤ 3 s, canvas, fps).
- ✅ Doplňkové měření QA (dočasný spec, smazán; perf-prod, 390×844 dark, intro ZAPNUTÉ): čas od navigace do zmizení intra a ovladatelného [START LESSON] — bez tapu 2205 ms, s tapem hned po zobrazení 2156 ms, Reduce Motion 2003 ms. Všechno ≤ 3 s. Intro start reálně nezdržuje (~50 ms oproti skipu): choreografie (640 + 2×130 ms) doběhne dřív, než je appka ready, a prolnutí 300 ms je pod ready dobou.
- ✅ Dvojklik + opakované kliky během prolnutí: žádná chyba v konzoli, intro zmizí, mapa ovladatelná.
- ✅ Nativní log `$TEMP/expogo.log` (117 řádků, poslední zápis 13:19): žádný řádek `ERROR`.

### Kontrolní body
- ✅ `takeIntro` je modulový flag → jednou za JS kontext; návrat z pozadí kontext nemění, nic jako AppState ho neresetuje. Reload na webu = nový kontext = intro znovu (e2e to ověřuje).
- ✅ onDone jen jednou: `doneRef` v `finish`; tap i timeout prolnutí jdou přes `finish`; při prolnutí `pointerEvents="none"`, takže tap propadne do appky (záměr).
- ✅ Tap před layoutem / před ready: intro zmizí, místo něj `DotLoaderScreen` (ne prázdno), po ready RootStack.
- ✅ Čekání na ready: po dohrání drží nápis s dýcháním, prolne až s `ready`. Chyba načtení: `store/db` nastaví `hydrated: true` i při `loadFailed`, takže `ready` přijde, intro se prolne a odhalí `StateView` s Retry — nezasekne se.
- ✅ Splash: s intrem `onShown` (první layout intra) → `hideAsync`; bez intra (e2e / skip není relevantní) `useEffect` při `ready`. Dvojí volání `hideAsync` je bezpečné (catch).
- ⚠️ Barva splashe `#0B0C0E` (app.json) = dark `base`. Ve světlém motivu na iPhonu: tmavý splash → světlé intro = jeden ostrý záblesk tmavá→světlá při startu. Nefunkční vada to není (nic se nerozbije, trvá jeden snímek), ale je to vizuální šev přesně v logo momentu. Návrh: `expo-splash-screen` podporuje `dark: { backgroundColor }` + světlou `backgroundColor` = light `base` (vyžaduje nativní build, v Expo Go se neprojeví). Patří design-agentovi/bossovi. Související drobnost: intro bere `useTheme()` ještě před hydratací nastavení — kdo má ručně zvolený motiv opačný k systému, může vidět přepnutí barvy podkladu uprostřed intra (ověřit na iPhonu).
- ✅ a11y: jediný prvek `button` „Opice“ + nápověda (`copy.intro`), nápis `accessibilityElementsHidden` / `no-hide-descendants`.
- ✅ Worklety: `rootStyle`, `wordStyle`, `LitColumn` zachytávají jen sdílené hodnoty a čísla (`col`, `fade`).
- ✅ Reduce Motion: `front` začíná na plném nápisu, žádný sken/pulz/dýchání, prolnutí 300 ms.
- ✅ Bez zvuku (jen `feedback('introPulse')` = haptika, feedbackMap test).
- ✅ Snímky (podrženo `__OPICE_HOLD_INTRO__`) w320 a w430, dark i light: nápis OPICE čitelný, vycentrovaný, bez ořezu a kolizí; zhasnuté tečky v light jemně viditelné. e2e geometrie na w320 (77 teček, ≤ 80 % šířky, bez překryvu) zelená.

### Rozbité
- Nic funkčního.

### iPhone checklist (uživatel)
1. Studený start (zabít appku, otevřít): splash → OPICE bez prázdného/bílého snímku; ve světlém motivu posuď, jak moc ruší přechod z tmavého splashe.
2. Jemná haptika přesně v okamžiku pulzu po doběhnutí skenu, jen jednou.
3. Návrat z pozadí (přepnout na jinou appku a zpět) intro NEpřehraje.
4. Ťuknutí kamkoli během intra okamžitě ukáže mapu; s VoiceOverem se ozve „Opice, tlačítko“ s nápovědou.
5. Sken a prolnutí do mapy plynulé, bez cuknutí; se zapnutým Omezit pohyb jen krátké prolnutí.

## QA UX pass U1/U2/U4 — HEAD 050a784 (ef4ec54, 5e2ad04, acb535d, 050a784) — 2026-10-09

**Verdikt: SCHVÁLENO** pro HEAD `050a784`.

### Brány
- `npx tsc --noEmit` ✅ 0 chyb · `npx eslint .` ✅ 0 · `npx jest` ✅ 96 sad / 847 testů · `npm run test:node` ✅ 0 fail.
- `npm run e2e` ✅ 169/169 (flows + visual 4 šířky × dark/light + a11y), žádný neschválený diff; nové baseline (mapa, lekce, oslava, first-run lekce) jsou zapsané v LOG design-agentem.
- `npm run e2e:perf` ✅ 4/4 (plátna ≤ 12, mapa do START ≤ 3000 ms, fps mapa i oslava ≥ 55).
- Nativní log `$TEMP/expogo.log`: 0 řádků `ERROR` ✅ (jen varování Reanimated strict).

### U1 lekce + pauza
- ✅ Odpočet se počítá z časové značky (`useRestTimer`: `startAt + total − now`), po návratu z pozadí (`AppState active`) se přepočítá; zámek čas neztratí.
- ✅ Konec pauzy právě jednou (`ended` ref); `+15 s` se stropem `REST.maxS` (`canExtend`), po konci nejde prodloužit; Skip rest přes `endRest` je strážený `p.kind === 'rest'` (dvojí klik nic neudělá).
- ✅ Tik jen posledních 3 s, každá sekunda nejvýš jednou, zmeškané po zámku se nedohánějí (`restCue`, testy `restCues.test.tsx`).
- ✅ Patička (název, tip, Next up, DONE 64 pt) ve viewportu bez scrollu w320–w430 dark/light — visual baseline + `lesson-rest.spec` (kolize textů) zelené.
- ✅ Dokončení lekce: pořadí, 11 úderů, snap a oslava beze změny — oslavové testy a baseline `celebration` zelené na všech 8 projektech; FeelPicker přibyl až pod oslavu a je `disabled` do `ctaReady`.

### U2 pocit po lekci
- ✅ Easy/Right/Hard až po oslavě (`disabled={!ctaReady}`), Continue bez hodnocení nic neukládá (rate jen z FeelPickeru).
- ✅ Idempotence: `applyFeel` ignoruje stejný `attemptId`, + `busy` ref proti rychlému klikání.
- ✅ Meze: korekce 0.7–1.3, násobí se se škálou vstupního testu (`combineScale`); dávky další lekce/minuty na mapě se mění (testy).
- ⚠️ Chyba uložení: FeelPicker ukáže chybu, ale nenabídne znovu zkusit (hodnocení se ztratí). Nízká závažnost — design-agent/boss.
- ✅ První oslava se neptá (`feelAsk` vypnuto při guide/setup): souhlasím — v první oslavě je už GuideBubble a CTA Finish setup, třetí prvek by zahltil 320 pt; progrese o jedno hodnocení nic neztratí.

### U4 odhalení, řádek Next/série, verzálky
- ✅ Nový profil: liga/sezóna/šatník zamčené; odemčení po 2/3/5 lekcích; legacy (bez `guideSeen`) a demo vše otevřené (`disclosure.spec`, `useDisclosure.test`). Do načtení profilu nic nebliká zámkem (`ready:false` = otevřeno).
- ⚠️ `lessonsDone` počítá i opakování téže lekce (3× L1 odemkne ligu). Spec „po 3 lekcích“ je nejednoznačná — rozhodne boss.
- ⚠️ `/wardrobe` route zámek nemá; dostupná jen deep linkem/dev, z UI ne. Neškodné (kosmetika), ale pro konzistenci doporučuji `FeatureLocked` i na route — boss.
- ✅ Řádek Next/streak: atRisk/done/none, den podle `today` (přelom půlnoci testy `disclosure`), na 320 pt max 2 řádky bez kolize.
- ✅ Verzálky jen štítky (věty sentence case, LineBubble test upraven).
- ✅ Změna `e2e/textGeometry.ts` (dočasné `pointer-events:auto` při hit-testu) kontroly nezeslabila: **ověřeno dočasným rozbitím** — `ReturnLine` posunut `marginTop:-14` → `large-text` w320-dark spadl s `kolize: „7 / 9“ × „Next: Balance · 3 min“`; vráceno, strom čistý. Závoj mapy je gradient (průhledné pozadí), takže nově hit-testovatelné překryvy text neschovají.

### Screenshoty
Klíčové stavy (mapa s řádkem Next, lekce s patičkou, oslava, first-run) w320 a w430 dark+light: `e2e/__screenshots__/w{320,430}-{dark,light}/` — všechny prošly porovnáním, bez kolizí/ořezu.

### iPhone checklist (uživatel)
1. Pauza mezi cviky: zamkni telefon na 20 s a odemkni — odpočet sedí, konec pauzy cvakne jen jednou; tiky jen v posledních 3 s.
2. Lekce na nejmenším iPhonu: DONE, tip a Next up vidět bez scrollu a nad home indikátorem (safe area).
3. Oslava: 11 úderů haptiky a snap beze změny, Easy/Right/Hard až po doběhnutí, výběr jemně cvakne.
4. VoiceOver na zamčeném tabu Liga/Sezóna: přečte „zamčeno, ještě N lekcí“.
5. Mapa: řádek „Streak ends tonight / Next…“ plynule při scrollu, bez škubání pod hlavičkou.

### Doplněk boss — nativní build U1/U2/U4 (HEAD eff047f, kód 050a784), 2026-10-09 19:05
- Expo Go server (8084) sestavil iOS bundle z aktuálního HEAD: `iOS Bundled 21318ms` (16.3 MB, obsahuje RestStep/FeelPicker/FeatureLocked). `$TEMP/expogo.log` zapsán 2026-10-09 19:05:27, 0 řádků `ERROR`.
- Běhové chování na zařízení ověří iPhone checklist výše.

## QA UX pass U3 + U5 (a3c1bed, 8904536, 7dfe0ec, 3d2849d, acb6ce9) — HEAD acb6ce9a5e998f35b05da6e419da6f3b8888f019, 2026-10-09

### Brány
- ✅ `npx tsc --noEmit` 0 chyb, `npx eslint .` 0 chyb (včetně `local/no-worklet-object-capture`).
- ✅ `npm test` 100 sad / 905 testů OK. ⚠️ Jest hlásí „A worker process has failed to exit gracefully“ (únik časovače v některém testu; doporučeno `--detectOpenHandles`, boss).
- ✅ `npm run test:node` 25/25.
- ✅ `npm run e2e` 170/170 (9.6 min), `npm run e2e:perf` 5/5 včetně nového „lekce (smyčka siluety): medián fps ≥ 55“.
- ⚠️ Baseline `map.png`/`lesson.png` jsou starší než U3/U5 (17:15 a 18:01) a prošly jen díky toleranci `maxDiffPixelRatio 0.01`: nové siluety a plný náboj se do 1 % vejdou. Vizuální regrese tak tuhle změnu nezachytila a baseline nebyla vědomě schválená. Doporučuju `e2e:update` pro map/lesson se záznamem v LOG (boss).
- ✅ Nativní build: GET iOS bundle na 8084 → HTTP 200, `iOS Bundled 19566ms`. `$TEMP/expogo.log` naposledy zapsán 2026-10-09 20:16:54, **0 řádků `ERROR`**. Je tam 28× `WARN [Reanimated] Writing to value during component render` (strict mode). Vznikly už dřív při běhu na iPhonu, takže je nejde přiřadit konkrétnímu commitu. Nejsou to chyby, ale patří do úklidu (motion-agent).

### U3 tečkové siluety
- ✅ Všech 15 siluet jsem vyrenderoval z `logic/` v phase 0 / 0.5 / 1 (scratchpad QA `sil.png`). Opakování ukazují techniku: klik (paže propnuté → hrudník u země, tělo rovné), dřep, výpad, most, shyb, superman a výskok.
- ✅ Výdrže (plank, side plank, hollow, wall handstand, L-sit, hang, crow) se mění o ≤ 3 jednotky viewBoxu. Je to jen dech, ne falešný pohyb.
- ⚠️ Dip: dole se chodidla dotknou země (y 108) a bradla nejsou nakreslená. Zepředu to působí jako stoj s pokrčením paží, ne jako dip. Návrh: dole držet nohy nad zemí (pokrčená kolena). Crow je na w320 malá (~30 pt) a hůř čitelná. Squat: komentář říká „pod paralelu“, ale kyčel (y 78) zůstává nad kolenem (y 86). Patří design-agentovi.
- ✅ Tempo 1.8 s / 3.6 s (`motion.silhouette`), sine tam a zpět, 30 fps; tempo pokrývají testy `useSilhouettePhase`.
- ✅ Smyčka se zastaví při pauze výdrže, v dialogu Quit (`suspended`), při ztrátě fokusu (blur) i na pozadí (AppState). Po návratu naváže bez skoku a časovač se uklidí v cleanup (testy pauzy a pozadí). Reduce Motion vrací fázi 0 bez časovače (test).
- ✅ E2E na w320: tečky se hýbou (cy se mezi snímky po 450 ms liší) a perf lekce ≥ 55 fps.
- ⚠️ Čitelnost na w320: box siluety je 254×62 pt. Ležící pózy jsou čitelné, kompaktní (crow, L-sit) jen málo. Hraniční, ale ne ořez.
- (známé, dřív ⚠️) Caution věta na w320 pokračuje pod spodní lištou (scroll), štítek CAUTION je nad ohybem. Beze změny.

### U5 stavy uzlů, opička, zámky
- ✅ Done / current / locked jsou rozlišené tvarem: plný náboj / plný obrys / tlumený prstenec se zámkem. Ověřeno na w320 a w430 v dark i light a také se simulací slunce (`contrast .55 brightness 1.35`): rozdíl zůstává čitelný.
- ❌ **Inverzní fajfka na dokončeném uzlu na webu není vidět.** Postup: demo profil, mapa (jakákoli šířka), odscrollovat k dokončeným uzlům. Ukáže se jen plný disk. DOM fajfku obsahuje (`svg stroke #0B0C0E`, 16 px nad 19 px nábojem), ale `dotplate-hub` má `position:absolute` a statické `svg` lucide se v CSS kreslí pod pozicovaný prvek. Při dokončení lekce je to dobře vidět: kreslená fajfka (absolutní) je viditelná a po ~3 s zmizí, jakmile ji nahradí statická (snímky `u5/unlock-2000` vs `unlock-5000`). Na nativu je pořadí podle stromu, takže tam fajfka nejspíš vidět bude (iPhone checklist bod 1). Oprava je v `DotPlate`: `center` zabalit do absolutního View nebo mu dát zIndex. Patří design-agentovi.
- ❌ **Po dokončení lekce na w320 je opička u bosse useknutá levým krajem displeje.** Postup: w320 × 568, demo, dokončit lekci Balance, [CONTINUE] → mapa. Po odemčení stojí opička vedle bosse na x ≈ 0 a levé ucho je uříznuté. Boss je navíc z větší části pod [START LESSON]. Mapa na nový aktuální uzel nedoscrolluje (snímky `u5/unlock-2000`, `unlock-5000`). Nejspíš to existovalo už před U5 (spot „beside“ v `mascotSpot`), ale podle pravidla jde o ořez = ❌. Patří design-agentovi (mascotSpot clamp na okraj + `edge`), scroll k aktuálnímu uzlu bossovi.
- ⚠️ Přechod při odemčení: v 600 ms opička během skoku krátce překryje popisek „Upside down“. Je to přechodné (motion-agent, nízká priorita).
- ✅ Dech obrysu: `outline={trim}` během odemčení a potom blend od vrcholu. Na snímcích 100–5000 ms nic neskáče a let kotouče i kreslení fajfky proběhnou. Flow `lesson.spec` (série +1) je zelený.
- ✅ a11y: uzly čtou „…, completed, …“, „up next“ a „locked“ (`copy.map.nodeState`). Kontrastní test pro tokeny prošel.
- ✅ Mávnutí jen při `stats.isNew` a jen jednou za běh (`greetedThisRun`). Při odemykací sekvenci (`pair`) se nespustí. Reduce Motion `degrade`.
- ✅ `/wardrobe` přímou cestou ukáže `FeatureLocked`, bez kolize na w320 v dark i light, CTA nad ohybem (`disclosure.spec`).
- ⚠️ StateView a ComebackCard s větší opičkou nemají vlastní e2e kontrolu kolizí na w320 (FeatureLocked ji má). Doporučený test patří design-agentovi.
- ✅ FeelPicker [TRY AGAIN] uloží stejnou volbu. Proti dvojímu ťuknutí ho chrání `retrying` ref, chyba se při novém pokusu schová (unit test). Řeší tím ⚠️ z minulého kola.

### Verdikt: NESCHVÁLENO (HEAD acb6ce9)
Blokují dvě ❌: neviditelná fajfka dokončeného uzlu na webu a ořez opičky u bosse na w320 po dokončení lekce. Obojí patří design-agentovi. Po opravě stačí přetočit `e2e` a baseline map/lesson.

### iPhone checklist (uživatel)
1. Mapa: na dokončených kotoučích je v plném středu vidět tmavá (inverzní) fajfka.
2. Dokončení lekce → návrat na mapu: odemčení, let kotouče a dech obrysu nového uzlu proběhnou plynule bez cuknutí. Opička u bosse není useknutá okrajem a je mimo výřez/safe area.
3. Lekce: siluety se hýbou plynule (30 fps), při pauze výdrže a v dialogu Quit stojí, s Reduce Motion jsou statické.
4. Nový profil: opička na první mapě po dosednutí jednou zamává (při návratu na tab už ne).
5. VoiceOver na mapě: uzly čtou „completed / up next / locked“.

## QA kolo 0d1cc4e..fee5545 (opice v2, mapa Kurogane, splash, demo build, color grading), HEAD fee5545, 2026-10-12

**Brány:** tsc 0 chyb, eslint 0 (vč. `local/no-worklet-object-capture`), jest 103 sad / 955 OK (stále hláška o workeru, který neskončil: únik časovače, ⚠️ z minula), test:node 25/25, `npm run e2e` 132 passed / 38 failed (všech 38 = vizuální snímky mapa, first-run mapa, first-run oslava, oslava, profile, league; flows i a11y zelené), `npm run e2e:perf` 5/5 (mapa, lekce i oslava ≥ 55 fps, TTI v rozpočtu). Nativní log `$TEMP/expogo.log` (demo server 8084, 21:37): iOS i Android bundle OK, 0 ERROR.

**Ověřeno:**
- ✅ 0d1cc4e: střed DotPlate je v absolutní vrstvě nad nábojem (fajfka na webu už není pod nábojem). Opička u bosse: `mascotSpot` ji posadí vedle uzlu jen tehdy, když se vejde mezi `edge` a `width - edge`; jinak ji dá nad uzel a x ořízne do mezí, takže za okraj nevyjede. `revealNode` po odemknutí doscrolluje, aby byl nový uzel celý mezi hlavičkou a CTA. Obě dřívější ❌ jsou z kódu pryč. ⚠️ Na boss případ na w320 ale chybí e2e regresní test.
- ✅ Opice v2: 8 póz jako data v `logic/mascotPoses.ts` s testy, worklety v `lib/poseMotion.ts` a `usePoseMotion` drží jen čísla a sdílené hodnoty (eslint pravidlo prošlo), Reduce Motion = statická póza. Vizuálně jsou mapa, profil, liga i oslava na 320 až 430 bez ořezu a kolize opice.
- ✅ Mapa Kurogane: done, current i locked uzel, tečkovaná cesta, popisky `20 KG`, StartCard „Start <lekce>“ s mono metadaty na w320 bez ořezu.
- ✅ Splash: `finish` je jištěný `doneRef` (dvojí ťuknutí = jeden `onDone`), časovače se v cleanupu ruší, e2e intro (přeskočení) zelené.
- ✅ Oko siluety: `headDotIndex` je testovaný na všech siluetách.
- ✅ Demo build: `DEMO_BUILD` je jen `EXPO_PUBLIC_DEMO === '1'`. Bez proměnné index ani lekce chování nemění (podmínka `DEMO_BUILD ||` k původní logice jen přidává). Seed se spustí jen jednou (`started` ref).
- ✅ Kontrast: testy v `theme/__tests__/contrast.test.ts` počítají poměry z palet a jsou zelené (live dark 4.91 na base, light success proti danger 1.43).
- ✅ Tab bar: snímky na w320 dark i light se se starou baseline shodují (stejný tvar, ikony, zámky i stav aktivní).
- ✅ Dokončení lekce: oslava na w375 dark (kotouč, opice celebrate s tečkou live, XP rozpis, série, feel picker, CONTINUE) je bez kolizí. Perf oslavy ≥ 55 fps.

**Rozbité / chybí:**
- ❌ League pódium na w320: jméno „Jake_Pull…“ je uříznuté výpustkou (`Podium.tsx`, `numberOfLines={1}`). Reprodukce: demo profil, w320, záložka League. Vada byla už ve staré baseline, ale podle pravidla „ořez textu na 320 = ❌“ snímek league nejde schválit. Patří **design-agentovi** (zmenšit písmo, zalomit na 2 řádky nebo zkrátit jména v datech).
- ❌ `npm run e2e` není zelené: 38 vizuálních diffů a baseline zatím nikdo neschválil. Mapu, first-run mapu, oslavu, first-run oslavu a profil jsem posoudil jako vizuálně v pořádku. **Doporučení pro bosse:** po opravě pódia spustit `npm run e2e:update` a schválení baseline zapsat do LOG.
- ⚠️ Demo seed: když `services.user.loadDemo` selže, `.then` nemá `catch` a obrazovka zůstane navždy na DotLoaderu (patří bossovi, `app/index.tsx`).
- ⚠️ First-run mapa: bublina průvodce „TAP THE PLATE TO START“ je vedle nové karty „Start Grip“, takže instrukce míří na kotouč, i když hlavní CTA je karta (copy, design-agent nebo boss).
- ⚠️ Fajfka `DrawnCheck` při dokončení leží přes nový plný disk a záblesk oslavy podle motion-agenta sahá nad viewBox opice. Na snímcích to ořez nezpůsobuje, ale je to otevřené (design-agent / motion-agent).
- ⚠️ Únik časovače v Jestu přetrvává.

**Verdikt: NESCHVÁLENO (HEAD fee5545).** Ke schválení je potřeba opravit ořez jména na pódiu na w320 (design-agent) a pak přegenerovat a schválit baseline (boss).

**iPhone checklist:**
1. Splash: navazuje nativní splash na animovaný bez skoku? Je haptika při mrknutí cítit a přeskočí splash ťuknutí?
2. Mapa: dech prstence a nacvaknutí dokončeného uzlu na plný disk (haptika `seriesPlate`) jsou plynulé, bez trhání.
3. Opice: živá smyčka a přechod póz po dokončení lekce plynule, bez záškubu. Se zapnutým Reduce Motion je opice statická.
4. Safe area: karta Start a tab bar nad home indikátorem, nadpis sekce pod Dynamic Island.
5. VoiceOver: uzel mapy a karta „Start <lekce>“ se čtou srozumitelně (název, váha, počet cviků).

## QA kolo 2: fee5545..81c2aa6 (ad321e9, c7aef39, 81c2aa6: pódium ligy, průvodce, demo fallback, nové baseline), HEAD 81c2aa6, 2026-10-13

**Brány:** tsc 0, eslint 0 (vč. `local/no-worklet-object-capture`), jest 103 sad / 955 OK, test:node OK, `npm run e2e` **172/172 passed**, `npm run e2e:perf` 5/5 (canvas ≤ 12, TTI mapy ≤ 3000 ms, mapa, lekce i oslava ≥ 55 fps). `$TEMP/expogo.log` (naposledy zapsán 12. 10. 21:37) má 0 řádků ERROR a od minulého kola nepřibyl žádný nový běh.

**Ověřeno:**
- ✅ Ořez na pódiu (❌ z kola 1) je pryč. Baseline league na w320 dark i light: „Jake_ / Pullup“ na 2 řádky, „Dan Squat“ a „Tess.hold“ celé, sloupce na stejné základně. Na w375, w390 i w430 je jméno na jednom řádku. Bez kolizí.
- ✅ Mutační test: lokálně jsem vrátil `numberOfLines={1}` a test `liga: jména na pódiu nejsou oříznutá` na w320 **selhal** (`["Jake_​Pullup"]`), na w430 prošel, což je správně, protože tam se jméno vejde. Změnu jsem vrátil (`git checkout`) a `dist` znovu exportoval. Nic jsem necommitoval.
- ✅ a11y: `accessibilityLabel={entry.name}` čte původní jméno bez U+200B. Zalomení `​` je jen ve viditelném textu.
- ✅ e2e zelené (❌ z kola 1). Baseline z 81c2aa6 jsem prošel: league, map, first-run map, first-run celebration a profile na w320 dark i light a na w430. Ořez ani kolize nejsou, tab bar má stejný tvar, ikony, zámky i aktivní stav jako dřív. **QA tyto baseline schvaluje.**
- ✅ ad321e9 (⚠️ z kola 1): když selže `loadDemo`, appka přejde na `/onboarding/path`, takže nezůstane viset na nekonečném loaderu.
- ✅ Copy průvodce je teď „Tap Start to begin“ (⚠️ z kola 1 je jako text vyřešené).

**Otevřené (⚠️, neblokuje):**
- ⚠️ Ukazatel bubliny průvodce (tečky) pořád míří dolů na kotouč, ne na kartu Start (first-run mapa, všechny šířky). Patří design-agentovi.
- ⚠️ `numberOfLines={2}`: jméno, které by potřebovalo 3 řádky, by se na w320 znovu uřízlo. Data dema to dnes nemají a e2e by to chytil, ale u reálných jmen z ligy je potřeba limit délky v datech nebo menší písmo (design-agent nebo boss).
- ⚠️ Pro schválení baseline v 81c2aa6 chybí samostatný záznam v LOG. Je jen v commit message, proto ho doplňuje tento QA záznam.
- ⚠️ Jest stále hlásí worker, který neskončil (únik časovače).
- ⚠️ DrawnCheck a záblesk oslavy jsou beze změny (design-agent / motion-agent). Boss případ opičky na w320 stále nemá e2e regresní test.

**Verdikt: SCHVÁLENO (HEAD 81c2aa6).**

**iPhone checklist:**
1. VoiceOver na League: pódium čte „Jake_Pullup“ plynule jako jedno jméno, bez pauzy nebo divného znaku v místě zalomení.
2. League na nejužším zařízení (SE / mini): „Jake_ / Pullup“ na 2 řádky, sloupce teček na stejné základně, nic uříznuté.
3. První mapa: bublina „Tap Start to begin“ a karta Start jsou nad home indikátorem a pod Dynamic Island, ťuknutí na kartu dá haptiku.
4. Intro pódia (sloupce a opice) proběhne plynule, bez trhání.
5. Opice na mapě a v oslavě: živá smyčka je plynulá. S Reduce Motion je statická.
