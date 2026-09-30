# QA — krok 2 (core loop), kolo 2

Datum: 2026-09-30 · qa-agent · větev `faze1/core-loop` · rozsah spec §12 kroky 1–2. Ověřené opravy: cbc9b83, e413bca, 77301b7.

**Verdikt: SCHVÁLENO**

## Build a nástroje

| Kontrola | Výsledek |
|---|---|
| `npm test` | ✅ 26 suites, 200 testů |
| `tsc --noEmit` | ✅ |
| `expo lint` | ✅ exit 0 |
| `npx expo-doctor` | ✅ 21/21 |
| web export + flow (light i dark) | ✅ žádný pageerror ani console.error |

Flow skript: `.superpowers/sdd/2026-09-29-opice-faze1-core-loop/tools/flows/qa-r2.mjs`, snímky `tools/shots/qa-r2`.

## Problémy z kola 1

| # | Problém | Stav | Důkaz |
|---|---|---|---|
| 1 | Opakovaný onboarding smaže data | ✅ opraveno | `/onboarding/path`, `/weight`, `/birth` s profilem → `/`, `activity` zůstává 1; webové Zpět → `/`, cesta `power` beze změny. Service druhý onboarding odmítne (`MockUserService.test.ts`). |
| 2 | `expo-doctor` chce `expo-asset` | ✅ opraveno | `21/21 checks passed`, `expo-asset ~57.0.18` v package.json a pluginech. |
| 3 | Zamčená lekce přes URL se spustí | ✅ opraveno | `/lesson/pw-1-5` ukáže „Nejdřív dokonči předchozí lekci.“ a „Zpět na mapu“, žádné Start ani Hotovo (`dark-06-locked.png`). Tlačítko vede na `/`. Aktuální i dokončená lekce se dál otevřou. |
| 4 | Ukončení lekce bez historie nic neudělá | ✅ opraveno | `/lesson/pw-1-2` přímo URL → Ukončit → potvrdit → `/`, nic se neuloží. |
| 5 | Hardcoded typografie a `MASCOT_COLORS` | ✅ opraveno | Všech 5 míst z kola 1 bere hodnoty z tokenů, `MASCOT_COLORS` je re-export tokenu `theme.mascot`. Zbytky viz problém B. |

## Regrese flow (web, light i dark)

✅ Čistý profil → `/onboarding/path` → 4 kroky → zrození (`01-birth.png`) → „Jdeme trénovat“ (dvojklik) → mapa. Lekce 1 → oslava, +32 XP → Pokračovat → uzel 2 `aktuální` → reload: uzel 1 `dokončená`, uzel 2 `aktuální`.

Zrození: `completeOnboarding` zvýší `revision`, takže nový redirect v `onboarding/_layout` se spustí souběžně s `router.replace('/(tabs)')` v `birth.tsx`. Obojí vede na stejnou obrazovku. Ověřeno bez dvojité navigace a bez chyb.

## Diff scan

- `getLesson` počítá stav uzlu v rámci cesty lekce. Lekce jiné cesty, než má profil, je tedy `locked`, což je správně.
- `LessonDetail.state` je nové povinné pole kontraktu. Jiná implementace zatím není (fáze 2 ho musí doplnit).
- Test count: LOG boss uvádí 201, skutečně je 200. Jen nepřesnost v zápisu.

## Spec bod po bodu (rozsah kroků 1–2)

| Spec | Stav | Poznámka |
|---|---|---|
| §1 cíl a rozsah (core loop) | ✅ | |
| §2 stack (Expo 57, router, reanimated, zustand, svg) | ✅ | doctor 21/21 |
| §3.1 struktura složek | ✅ | |
| §3.2 tok dat přes services, `now` jako parametr | ✅ | |
| §3.3 typy | ✅ | názvy dle R9 |
| §3.4 contracts | ✅ | služby plánu B `notImplemented` záměrně |
| §4 XP rozpis | ✅ | testy + ověřeno v UI |
| §4 streak (přelom dne/měsíce, mezera) | ✅ | testy |
| §4 stavy uzlů mapy | ✅ | testy + UI; guard při dokončení i při otevření |
| §4 stage prahy | ✅ | testy |
| §4 liga, comeback, cíl sezóny, graf váhy | ⚠️ plán B | |
| §5 obsah (cesty, lekce, cviky) | ✅ | |
| §6.1–6.2 směr, palety, kontrast | ✅ | contrast test |
| §6.3 sezónní override | ⚠️ plán B | |
| §6.4 typografie | ✅ | tokeny `input`, `inputLarge`, `counter`, `badgeLabel`; drobné zbytky viz problém B (nemá vliv na vzhled) |
| §6.5 kotouče | ✅ | |
| §6.6 tvary a spacing | ✅ | |
| §6.7 motion | ✅ | pružiny jen na odměnách |
| §6.8 výjimky skillu | ✅ | |
| §7.1 onboarding (5 kroků, validace, zrození) | ✅ | s profilem přesměruje na mapu; service druhý onboarding odmítne |
| §7.2 mapa | ✅ | |
| §7.3 lekce + oslava | ✅ | krok 8 stage-up → plán B |
| §7.4–7.10 stage-up, liga, progres, sezóna, šatník, notifikace, dev menu | ⚠️ plán B | |
| §8 maskot stage 1 idle/happy | ✅ | stages 2–3, celebrate, sad → plán B |
| §9 hydratace, migrate, error stav, přerušená lekce, změna dne | ✅ | notifikace → plán B |
| §10 testy logiky (krok 1–2) | ✅ | liga/sezóna/recap → plán B |
| §10 vizuální kontrola proti „Never“ | ✅ | review soubor, Step 4 |
| §11 roadmapa TODO | ✅ | |
| README | ✅ | aktuální, viz LOG 2026-09-30 (rating oprava kolo 1) |

## Otevřené problémy (neblokující)

A. **K ruční kontrole na zařízení** — uživatel: zvuk `click` v tichém režimu iOS, haptika, Android hardware Zpět v lekci a na zrození, deep link na zamčenou lekci a na `/onboarding/path` s existujícím profilem (redirect bez probliknutí formuláře).
B. **Drobné literály mimo theme** — design-agent: `components/map/BarbellBoss.tsx:67` (SVG `fontSize={11}`), `components/map/Plate.tsx:62` (`fontSize={22}` ve viewBoxu 100), `components/ui/Stat.tsx:13` (velikosti M/L/XL 56/88/120), `DotSteps.tsx` gap 6, `Barbell.tsx` radius 2. Vzhled to neovlivní, jde o úklid.
C. Plán B (liga, sezóna, stage-up, dev menu, README) — ⚠️ podle plánu.
