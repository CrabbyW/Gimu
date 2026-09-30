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

## Tým a workflow

Vývoj vede tým agentů popsaný v [`CLAUDE.md`](./CLAUDE.md): boss plánuje a integruje, design-agent
dělá vizuální systém, motion-agent animace a haptiku, qa-agent ověřuje funkčnost a rating-agent dává
finální hodnocení kroku (postupuje se jen při 100/100). Zdroj pravdy je [`docs/SPEC.md`](./docs/SPEC.md);
průběh práce je v [`docs/LOG.md`](./docs/LOG.md), výsledky QA v [`docs/QA.md`](./docs/QA.md) a finální
hodnocení v [`docs/RATING.md`](./docs/RATING.md).

## Stav

- **Krok 1–2** (scaffolding, onboarding, mapa lekcí, lekce s cviky, oslava dokončení, odemykání): QA schváleno, rating 100/100.
- **Krok 3** (maskot stage 2–3, nálady celebrate a sad, kotvy, kosmetické vrstvy, sezónní šála, Rive stub): hotovo a v hodnocení.
- **Na přání uživatele:** `DotLoader` (nativní port loaderu Echo Ring z @dotmatrix) ve všech stavech načítání; onboarding s výběrem vize těla a širší nabídkou milníků (UX1); přepracovaný pohyb celé appky podle skillu brag, tón cinematic, se zvuky Kenney (UX2).
- **Další:** plán B, kroky 4–6 ([`docs/superpowers/plans/2026-09-30-opice-faze1-planB.md`](./docs/superpowers/plans/2026-09-30-opice-faze1-planB.md)): liga, progres, sezóna s recapem, šatník, notifikace, dev menu.

## Zvuky
Zvukové efekty v `assets/sounds/` (`plate-snap.wav`, `select.wav`, `unlock.wav`) pocházejí od [Kenney](https://kenney.nl/) (licence CC0, public domain), převzaté z SFX knihovny skillu brag a upravené přes ffmpeg (mix, lowpass, WAV 44.1 kHz mono). Zdroje jsou zapsané v `docs/LOG.md` (UX2).
