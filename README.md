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
- Dev menu má sekci **Tečky** se všemi tečkovými komponentami pro vizuální kontrolu.
- Nastavení: dva nezávislé přepínače **Haptika** a **Zvuky**; tichý režim iOS = ticho.

## Testy a ověřování (elite fáze 0)

- `npm test` — Jest (logika, komponenty, kontrast, ESLint pravidla, mapa odezvy).
- `npm run test:node` — node testy ochranného hooku a generátoru zvuků; `npm run gen:sounds` přegeneruje `assets/sounds/` (syntetizovaná paleta, elite fáze 2).
- `npm run e2e` — Playwright v `e2e/`: E2E toky (first run, onboarding, lekce, stage-up, liga, reset, tab bar, reakce pozadí mapy) + vizuální regrese 12 obrazovek × 4 šířky × dark/light (baseline `e2e/__screenshots__/`). Běží proti produkčnímu webovému exportu (`dist/` přes `e2e/serve-dist.mjs` na 8083), ~4 min. Chrome ze systému (`CHROME_PATH`), žádné stahování browserů.
- `npm run e2e:update` — vědomě nová baseline snímků (zapsat do LOG proč).
- `npm run e2e:perf` — produkční web export (`dist/`, statický server `e2e/serve-dist.mjs` na 8083): Skia plátna ≤ 12 na obrazovce, čas do interakce mapy ≤ 3 s, medián fps mapy a oslavy ≥ 55.
- Porty: 8081 web pro agenty (nikdy v CI režimu), 8082 Expo Go uživatele za tunelem. Ochranný hook `.claude/hooks/guard.mjs` (testy `node --test .claude/hooks/guard.test.mjs`) a ESLint pravidlo `local/no-worklet-object-capture`.

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

Všechna demo data jsou v jediném souboru `services/mock/demoData.ts`. Výměna za API = nové implementace `services/contracts.ts` v `services/index.ts`.

## Dev menu (`app/dev.tsx`)

| Akce | Co dělá |
|---|---|
| Načíst demo profil | nahradí profil demem, vynuluje posun času |
| +500 XP | přidá událost `dev-xp` (není lekce: nemění mapu, streak ani lekce sezóny; posune stage a ligu) |
| Stage opice | jen zobrazení: auto → 1 → 2 → 3 |
| Skok na konec sezóny | posune `now()` na den po konci sezóny 09:00 (`lib/clock.ts`, `devTimeOffsetMs`) |
| Simulace ztráty streaku | posun času o +2 dny |
| Reset časového posunu / Reset appky | vrátí čas / smaže data (téma zůstává) |

## Launch video

Samostatný Remotion projekt v `video/` (appka na něm nezávisí, Metro/Jest/ESLint/tsc ho ignorují). Storyboard: `video/STORYBOARD.md`.

## Stav

Viz [`docs/STATUS.md`](./docs/STATUS.md).

## Zvuky
Zvukové efekty v `assets/sounds/` (`plate-snap.wav`, `select.wav`, `unlock.wav`) pocházejí od [Kenney](https://kenney.nl/) (licence CC0, public domain), převzaté z SFX knihovny skillu brag a upravené přes ffmpeg (mix, lowpass, WAV 44.1 kHz mono). Zdroje jsou zapsané v `docs/LOG.md` (UX2).
