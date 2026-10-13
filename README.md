# Opice

Gamifikovaná kalistenika s maskotem opice. Uživatel plní lekce cviků (opakování i výdrž),
sbírá XP a odemyká uzly na mapě, kterou vede přes ligy a sezónní vzhledy — opice roste
a mění náladu podle postupu.

## Stack

- Expo SDK 57, Expo Router (navigace ze souborové struktury `app/`)
- React Native 0.86 + React 19, TypeScript (strict)
- react-native-reanimated a gesture-handler pro animace a interakci, @shopify/react-native-skia pro tečkovou grafiku,
  react-native-svg pro maskota
- zustand + AsyncStorage pro perzistentní stav, mock `services/` vrstva místo backendu
- Jest (`jest-expo`) pro testy

## Spuštění

```
npm install
npx expo start      # naskenuj QR v Expo Go
npm test             # testy
npm run typecheck    # tsc --noEmit
npm run lint          # expo lint
```

## Architektura

- `app/` — obrazovky a navigace (Expo Router); každý soubor je route, `_layout.tsx` definuje navigátor
- `components/` — UI a vizuální komponenty (mapa, lekce, maskot, sdílená UI primitiva)
- `theme/` — jediný zdroj designových tokenů (barvy, typografie, spacing, radiusy); žádné natvrdo zapsané hodnoty mimo tento adresář
- `logic/` — čistá herní logika bez závislosti na UI (streak, XP, mapa, dokončení lekce, onboarding…)
- `services/` — přístup k datům (zatím mock implementace), jediná cesta, kudy UI čte/zapisuje data
- `store/` — zustand store a jeho migrace
- `data/` — statický obsah (cviky, lekce, milníky, ligy, sezónní texty, copy)
- `hooks/` — sdílené React hooky nad store/services

## Vzhled a odezva (redesign „Nothing Dot“, 2026-10)

- Monochromní tečkový jazyk podle Nothing OS, bez akcentu: „aktivní“ (CTA, rozsvícená tečka, progres) = `text`.
  Barvu v UI nese jen opička. Tmavý i světlý režim jsou plnohodnotné (spec `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`).
- Písmo: **Doto** (dot-matrix, jen ≥ 28 pt: hero čísla, titulky), Inter (text), JetBrains Mono (štítky VERZÁLKAMI, akce v `[ZÁVORKÁCH]`).
- Tečková grafika přes **Skia** v `components/dots/` (`DotPlate`, `DotRing`, `DotRow`, `DotMatrix`, `DotField`, čistá geometrie
  v `geometry.ts`). Každá komponenta je obalená `SkiaGuard`: bez Skia se vykreslí prázdný fallback.
- **Web:** Skia potřebuje CanvasKit dřív než cokoli jiného, proto má web vlastní vstup `index.web.js` (`LoadSkiaWeb`, pak appka)
  a `public/canvaskit.wasm` (zkopírováno z balíčku `canvaskit-wasm`). Nativní vstup je `index.js` (expo-router).
- Dlaždice (`Tile`, radius 28, jediné oddělení = vlasová hrana `edge`), pilulková CTA (`PillButton`), plovoucí tab bar (`FloatingTabBar`).
- Interaktivita: kotouče se pomalu točí a jdou roztočit prstem (`components/map/usePlateSpin.ts`), tečky reagují na dotek vlnou
  (`components/dots/useDotTouch.ts`), dlaždice se při stisku naklopí k prstu. Dokončení lekce = tečky se slétnou do kotouče.
- Pohyb jen z `lib/motion.ts`, haptika a zvuk přes `feedback(id)` v `lib/feedback.ts`. Omezený pohyb: vše jen prolnutí 200 ms.
- Barevný systém (chladný grafit, OKLCH h 255): `docs/design/color-system.md`, CSS export `docs/design/color-system.css`, publikovaná stránka https://claude.ai/artifact/LpUzrZTXNGQoKCopx8fwzy. Tokeny v `theme/palettes.ts` navíc `borderStrong` (hranice ovládacích prvků ≥ 3:1), `focus`, `disabled`, `stateSuccess/Warning/Info` (jen skutečné stavy a data). Kontrast hlídá `theme/__tests__/contrast.test.ts`.
- First run (elite fáze 1): krátký onboarding Cesta → Zrození → mapa, „Finish setup“ / „Set your goals“ po první oslavě, opička průvodce (jedna bublina na obrazovku), let kotouče mapa → lekce → oslava.
- Opička 2.0 (elite fáze 3): ťuknutí na opičku na mapě ukáže krátkou mono repliku (`components/mascot/LineBubble.tsx`, `hooks/useMascotLine.ts`, výběr v `logic/mascotLines.ts` podle dneška, série a denní doby, texty `copy.mascotLines`). Sama nemluví, průvodce má přednost, popisky uzlů pod bublinou na dobu repliky zmizí. Rekord série (`LessonResult.streakRecord`) = v oslavě řádek „NEW RECORD · N DAYS“ a hrdá opička (`prideBeat` v `components/lesson/celebration.ts`).
- Audit (elite fáze 4): stavy přes `components/ui/StateView.tsx` (tečkový skeleton až po 300 ms, chyba s opičkou a Retry, prázdné stavy jako pozvánka); dekorace skryté pro čtečku (`components/dots/DecorCanvas.tsx`); strop zvětšení písma `typeMaxScale` a tabulární číslice z `theme/tokens.ts`, Doto ≥ 28 pt; Reduce Motion = klidná prolnutí (`motion.calmFade`). Ochrana dat: když čtení úložiště selže, `store/db.ts` blokuje zápisy a kořen ukáže chybu s Retry místo onboardingu. Testy `e2e/a11y/` (popisky, velké písmo 1.4× na w320/w390).
- Vstupní test a bezpečnost (elite fáze 5): volitelný test úrovně (`app/fitness-test.tsx`: 7 otázek podle PAR-Q+ 2024, max kliků, plank se stopkami) z Finish setup nebo Nastavení. Dávky lekcí = ~50 % maxima, násobek 0.5–1.5× (`logic/fitnessTest.ts`, 0 = nezadáno = výchozí). Náročné cviky mají štítek CAUTION, disclaimer v testu a Nastavení. Rešerše a meze: `docs/research/2026-10-08-vstupni-test.md`.
- Kurogane + opice v2 (2026-10-12): jediný akcent `live` (#F0333A dark / #D0161D light) jen pro aktuální uzel, oko siluety cviku a živý stav; mapa s kotouči done (plný disk) / current (prstenec teček s červeným středem) / locked (slabý obrys), tečkovaná cesta a karta **Start <lekce>** (`components/ui/StartCard.tsx`). Nová opice (plná silueta, srdcový obličej): 30 póz z reference (+ idle, sad) jako data v `logic/mascotPoses.ts`, každá s živou smyčkou a pohybem rekvizit (`components/mascot/PoseProps.tsx`, `PropMotion.tsx`); pózy v appce: chyba/prázdný stav/zámek, pódium a vlastní řádek ligy (pohár/medaile), stage-up (schody), nastavení, pohyb celého těla v `lib/poseMotion.ts` + `components/mascot/usePoseMotion.ts`, galerie póz v `/dev` (ťuknutí = živé přehrání, „Play all poses“). Archiv opice v1: `old files and designs/`. Barvy, kontrast (WCAG) a typografie: `docs/design/color-typography.md`.
- Splash „Tečkový nápis“ (2026-10-13, nahradil A „Probuzení“): nativní splash je jen černá #0B0B0C, pak `components/splash/AnimatedSplash.tsx`. Nápis OPICE z teček (displej Nothing, zhasnutá matrice je vidět slabě) se rozsvítí sloupec po sloupci zleva. Tečka nad I zčervená (`live`) a mrkne, k tomu lehká haptika. Pak se nápis smrští a odjede na místo nadpisu mapy, zatímco se podklad prolne do mapy (~1.56 s). Opice ve splashi není: po jeho konci na mapě vyskočí zpoza hlavičky a obloukem doskočí na aktuální uzel, s haptikou dopadu. Stane se to jen jednou po studeném startu, ne při návratu na tab (`lib/introHop.ts`, `motion.splashHop`). Tap = skip. Reduce Motion: statický nápis, prolnutí 200 ms a opice se na mapě jen prolne. Časování `splash` je v `lib/motion.ts`, geometrie `dots.splash`, písmo `logic/dotGlyphs.ts` (`SPLASH_GLYPHS`: I s tečkou). E2E: `__OPICE_NO_INTRO__` intro vypíná, `__OPICE_HOLD_INTRO__` ho drží do ťuknutí, testy jsou v `e2e/flows/intro.spec.ts`. Ikony a průhledný `splash-icon.png` generuje `npm run gen:splash`.
- Pull-to-refresh mapy (`components/map/PullRefresh.tsx`): na začátku mapy stáhni obsah dolů. Zpod hlavičky se vynoří opičí hlava (póza `loading`, 12 teček kolem, horní červená) a natáčí se podle tahu. Za prahem přijde lehká haptika (`pullArm`). Po puštění se hlava točí, dokud se profil a cesta znovu nenačtou (`refresh()` z `useServiceQuery` vrací promise), nejméně 600 ms, a pak se schová. Je to vlastní gesto nad scroll offsetem (ne RefreshControl), takže funguje stejně na iOS, Androidu i webu. Reduce Motion: hlava se netočí, jen prolne a pulzuje. Parametry jsou v `motion.pullRefresh`, testy v `e2e/flows/map-refresh.spec.ts` a ve fps testu v `e2e/perf`.
- Opice žije, 26 animací (2026-10-13, plán `docs/superpowers/plans/2026-10-13-opice-26-animaci.md`). Co a kdy hraje, rozhoduje `logic/mascotRepertoire.ts`. Choreografii každé akce na časové ose 0 → 1 počítají worklety v `lib/repertoireMotion.ts`: kostru, celé tělo, houpání, rekvizity v ruce (jdou s dlaní), tečky růstu a ručník. Délky jsou v `repertoire` v `lib/motion.ts`.
  - Přehrávač je `components/mascot/useActPlayer.ts` a opice dostává prop `act`. Mini opička v lekci má prop `train` (cvik + sdílená fáze siluety).
  - Obrazovky hlásí události přes `useMascotAct` (`components/mascot/useMascotAct.ts`). Hraje vždy nejvýš jedna akce: idle nikdy nepřeruší jinou akci, ťuknutí přeruší idle a oslava cokoli (`lib/mascotAct.ts`). Haptika jen u `REPERTOIRE_HAPTIC`, bez zvuku.
  - Mapa: první idle akce po 12 s, další po 20–40 s (`useMapIdleActs`), nikdy během odemčení uzlu, skoku po splashi, příchodu ani pull-to-refresh. Ťuknutí na hlavu = zatřese hlavou, na břicho = chichot, rychlé ťukání = salto. Dlouhý stisk s tahem = visí na prstu. Návrat do appky po ≥ 60 s = zamává a doběhne k uzlu. Ztracená série = posedí a ukáže na Start.
  - Lekce: mini opička vpravo dole u čísla cvičí ve fázi siluety, posledních 3 s výdrže se zatne, v pauze si utře pot a napije se, po přeskoku pokrčí rameny. Oslava = činka nad hlavou s nacvaknutím kotouče (rekord série má přednost: výskok s plamenem a flex). Liga: postup = šplh o stupeň. Stage-up: růst s tečkami. Stavy: offline / chyba / prázdno.
  - Reduce Motion: každá akce = statická póza na 1.6 s.
  - Galerie: `/dev` → „Monkey actions“ (tlačítko pro každou akci a „Play all“). Testy: `lib/__tests__/repertoireMotion.test.ts`, `lib/__tests__/mascotAct.test.ts`, `components/mascot/__tests__/repertoire.test.tsx`, `e2e/flows/repertoire.spec.ts` a perf mapy s běžící idle akcí.
- Intro (do 2026-10-12, nahrazeno splashem): nápis OPICE z teček se rozsvítí zleva, pulz s jemnou haptikou, prolnutí do mapy (~1.2 s, běží souběžně s načítáním). Tap = skip, Reduce Motion = prolnutí 300 ms (`components/intro/DotIntro.tsx`, písmo `logic/dotGlyphs.ts`, hodnoty `motion.dotIntro`). E2E ho vypíná přes `__OPICE_NO_INTRO__`, ověřuje `e2e/flows/intro.spec.ts`.
- UX pass (2026-10-09, spec `docs/superpowers/specs/2026-10-09-ux-pass-design.md`): lekce s pevnou patičkou (název, tip, Next up, DONE 64 pt) a pauzou 30 s mezi cviky (+15 s, Skip rest); po oslavě Easy/Right/Hard → osobní korekce dávek ±10 % v mezích 0.7–1.3 (`logic/progression.ts`); progresivní odhalení Šatník/Liga/Sezóna po 2/3/5 lekcích (`logic/disclosure.ts`, `FeatureLocked`, opakování lekce se počítá); řádek „Next · N min“ a „Streak ends tonight“ na mapě; věty sentence case.
- Dev menu má sekci **Tečky** se všemi tečkovými komponentami pro vizuální kontrolu.
- Nastavení: dva nezávislé přepínače **Haptika** a **Zvuky**; tichý režim iOS = ticho.

## Testy a ověřování (elite fáze 0)

- `npm test` — Jest (logika, komponenty, kontrast, ESLint pravidla, mapa odezvy).
- `npm run test:node` — node testy ochranného hooku a generátoru zvuků; `npm run gen:sounds` přegeneruje `assets/sounds/` (syntetizovaná paleta, elite fáze 2).
- `npm run e2e` — Playwright v `e2e/`: E2E toky (first run, onboarding, lekce, stage-up, liga, reset, tab bar, reakce pozadí mapy) + vizuální regrese 12 obrazovek × 4 šířky × dark/light (baseline `e2e/__screenshots__/`). Běží proti produkčnímu webovému exportu (`dist/` přes `e2e/serve-dist.mjs` na 8083), ~4 min. Chrome ze systému (`CHROME_PATH`), žádné stahování browserů.
- `npm run e2e:update` — vědomě nová baseline snímků (zapsat do LOG proč).
- `npm run e2e:perf` — produkční web export (`dist/`, statický server `e2e/serve-dist.mjs` na 8083): Skia plátna ≤ 12 na obrazovce, čas do interakce mapy ≤ 3 s, medián fps mapy a oslavy ≥ 55.
- Porty: 8081 web pro agenty (nikdy v CI režimu), 8082 Expo Go uživatele za tunelem (8084 = demo server bosse za tunelem, pokud 8082 drží starý proces). Ochranný hook `.claude/hooks/guard.mjs` (testy `node --test .claude/hooks/guard.test.mjs`) a ESLint pravidlo `local/no-worklet-object-capture`.

## Přeskočení cviku

V lekci jde cvik přeskočit („Přeskočit“). Přeskočený objem se nezahodí: rozloží se rovnoměrně do dalších 5 lekcí
(např. skip 50 s výdrže → 5 × +10 s), aby se plnil dlouhodobý cíl. Stropy: dluh max 150 s / 40 opakování,
navýšení cviku max 15 s / 4 opakování a 25 % základu. Lekce platí (série, odemčení), když je odcvičená aspoň
polovina cviků; „Přeskočit“ se nabídne jen dokud to jde. XP základu poměrně. Logika: `logic/adaptive.ts`.

## Tým a workflow

Vývoj vede tým agentů popsaný v [`CLAUDE.md`](./CLAUDE.md): boss plánuje a integruje, design-agent
dělá vizuální systém, motion-agent animace a haptiku, qa-agent ověřuje funkčnost a rating-agent dává
finální hodnocení kroku (postupuje se jen při 100/100). Zdroj pravdy je [`docs/SPEC.md`](./docs/SPEC.md);
průběh práce je v [`docs/LOG.md`](./docs/LOG.md), výsledky QA v [`docs/QA.md`](./docs/QA.md) a finální
hodnocení v [`docs/RATING.md`](./docs/RATING.md).

## Demo

1. `npx expo start --web` (nebo Expo Go), otevři `/dev` (v appce: Profil → Nastavení → Dev menu).
2. **Načíst demo profil**: 12denní streak, 7 hotových lekcí, XP 460 (těsně pod stage 2), rozpracované milníky, cíl váhy a cíl sezóny Winter Arc.
3. Mapa → lekce 8 → oslava (dopad kotouče, jantarový prstenec, +XP, kotouč série na činku, „Zítra: …“; přeskočitelná tapem) → **stage-up** opice → mapa s odemčeným bossem.
4. Liga, Progres, Sezóna, Profil, Šatník, Nastavení. **Skok na konec sezóny** v dev menu otevře recap a převzetí odměny.

**Demo build (prezentace):** `EXPO_PUBLIC_DEMO=1 npx expo start` (`lib/demo.ts`). Bez profilu se rovnou načte demo profil (žádný onboarding; když se založení nepovede, otevře se onboarding) a v lekci jde přeskočit každý cvik, odpočet i běžící časovač u jakéhokoli profilu (přeskok se počítá jako odcvičený). Splash i oslava lekce se přeskočí ťuknutím. Expo Go mimo Wi-Fi: Cloudflare quick tunel podle `docs/HANDOFF.md` (adresa se mění při každém spuštění).

Všechna demo data jsou v jediném souboru `services/mock/demoData.ts`. Výměna za API = nové implementace `services/contracts.ts` v `services/index.ts`.

## Dev menu (`app/dev.tsx`)

| Akce | Co dělá |
|---|---|
| Načíst demo profil | nahradí profil demem, vynuluje posun času |
| +500 XP | přidá událost `dev-xp` (není lekce: nemění mapu, streak ani lekce sezóny; posune stage a ligu) |
| Stage opice | jen zobrazení: auto → 1 → 2 → 3 |
| Monkey actions | 26 animací opice na velké opici (27 tlačítek, přeskok a stojka zvlášť), „Play all“ je přehraje postupně |
| Skok na konec sezóny | posune `now()` na den po konci sezóny 09:00 (`lib/clock.ts`, `devTimeOffsetMs`) |
| Simulace ztráty streaku | posun času o +2 dny |
| Reset časového posunu / Reset appky | vrátí čas / smaže data (téma zůstává) |

## Launch video

Samostatný Remotion projekt v `video/` (appka na něm nezávisí, Metro/Jest/ESLint/tsc ho ignorují). Storyboard: `video/STORYBOARD.md`.

## Stav

Viz [`docs/STATUS.md`](./docs/STATUS.md).

## Zvuky
Všech 9 zvuků v `assets/sounds/` (`tick`, `select`, `snap`, `unlock`, `success`, `error`, `swoosh`, `pop`, `level-up`) je syntetizovaných deterministickým skriptem `scripts/gen-sounds.mjs` (C dur pentatonika, WAV 44.1 kHz mono 16-bit). Přegenerování: `npm run gen:sounds`. Mapa událost → haptika + zvuk je v `lib/feedbackMap.ts`, omezovač opakování (40 ms) v `logic/sfxGate.ts`.
