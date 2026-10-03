# Opice

Gamifikovaná kalistenika s maskotem opice. Uživatel plní lekce cviků (opakování i výdrž),
sbírá XP a odemyká uzly na mapě, kterou vede přes ligy a sezónní vzhledy — opice roste
a mění náladu podle postupu.

## Stack

- Expo SDK 57, Expo Router (navigace ze souborové struktury `app/`)
- React Native 0.86 + React 19, TypeScript (strict)
- react-native-reanimated pro animace, react-native-svg pro maskota a herní grafiku
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

## Vzhled a odezva (R44 „Teplá litina“)

- Teplá hnědočerná báze, mléčná křída, jediný akcent jantar `#F2A33A` jen pro primární akci, sérii, progres a oslavu
  (spec `docs/superpowers/specs/2026-10-03-tepla-litina-redesign-design.md`).
- Série = činka, na kterou každý den přibude kotouč (`components/ui/StreakBarbell.tsx`).
- Liga je zamčená do první lekce; ozubené kolo nastavení je jen na Profilu.
- Pohyb, haptika a zvuk podle `docs/superpowers/specs/2026-10-03-motion-haptics-sound-design.md`: pružiny Kotouč / Šál
  a timing Cvak v `lib/motion.ts`, `feedback(id)` v `lib/feedback.ts` (haptika + zvuk ve stejném ticku).
  Oslavné vzory: AHAP soubory v `assets/haptics/` (pro budoucí dev build), v Expo Go jejich aproximace `APPROX` v `lib/haptics.ts`.
- Nastavení: dva nezávislé přepínače **Haptika** a **Zvuky**; tichý režim iOS = ticho.
- Onboarding končí krokem **Připomínka** (výběr hodiny).

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
