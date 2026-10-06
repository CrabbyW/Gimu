# QA: Nothing Dot fáze 3 (commity 9ee1707..486f22f), reakce opičky + podněty z iPhonu

**Verdikt: SCHVÁLENO** (po 3 drobných opravách QA níže; necommitováno). Tah po tab baru na webu nejde ověřit, patří do „K ruční kontrole“.

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
