# QA — krok 2 (core loop), kolo 1

Datum: 2026-09-30 · qa-agent · větev `faze1/core-loop` · rozsah spec §12 kroky 1–2 (+ plán task 14).

**Verdikt: NESCHVÁLENO** (2 blokující nálezy: ztráta dat opakovaným onboardingem, `expo-doctor` červený).

## Build a nástroje

| Kontrola | Výsledek |
|---|---|
| `npm test` | ✅ 25 suites, 198 testů (197 + 1 nový) |
| `tsc --noEmit` | ✅ i bez vygenerovaných typed routes (`.expo/types`, `expo-env.d.ts` odsunuty) |
| `expo lint` | ✅ čisto |
| `npx expo-doctor` | ❌ 20/21 — chybí peer `expo-asset` pro `expo-audio` |
| hranice `@/(store\|data\|services/mock)` v app/components | ✅ jen `@/data/copy` (Ruling R1) |
| web build + flow | ✅ žádný pageerror / console.error |

Výstupy příkazů: `docs/superpowers/plans/2026-09-29-opice-faze1-core-loop.review.md`.

## Flow (web, light i dark)

Čistý profil → onboarding → mapa → lekce 1 (reps + hold) → oslava → odemčení → reload.

- ✅ Čistý localStorage → `/onboarding/path`.
- ✅ Onboarding uloží profil (`weightGoal lose 82.5→76`, 8 týdnů mock váhy, `activity` prázdná) → mapa, uzel 1 `aktuální`, uzel 2 `zamčená`.
- ✅ Lekce 1 obsahuje reps i hold; odpočet, Start/Pauza fungují.
- ✅ Oslava: +32 XP = lekce 20 + první dnes 10 + streak 2 (spec §4: +2/den). CTA zamčené ~1,6 s (R29).
- ✅ Pokračovat → mapa, uzel 2 `aktuální`, sekvence odemčení.
- ✅ Reload: uzel 1 `dokončená`, uzel 2 `aktuální`, TopBar 32 XP, streak 1 — persist drží.
- ✅ Boss (8 hotových lekcí): +52 = boss 40 + 10 + 2, všech 8 kotoučů na ose, uzel bosse `dokončená`, 308 XP.

## Edge cases

| Případ | Výsledek |
|---|---|
| Prázdná cesta / sen / milníky (0, 1) / váha | ✅ Pokračovat neaktivní; sen s mezerami nebo „ab“ neprojde |
| Váha 0, abc, 999, 1e2, -80, 29 | ✅ „Zadej číslo mezi 30 a 250 kg.“, zůstává na kroku |
| Váha špatný směr (hubnutí 80→90) | ✅ chyba směru u cílové váhy |
| Dvojklik Hotovo / Pokračovat / Jdeme trénovat / Ukončit | ✅ jen 1 záznam v `activity`, jedna navigace |
| Quit uprostřed (z mapy) | ✅ dialog, „Trénovat dál“ zůstane, potvrzení → mapa, nic se neuloží |
| Quit v lekci otevřené přímo URL | ⚠️ potvrzení nic neudělá (`router.back()` bez historie), viz problém 4 |
| Neznámé id lekce | ✅ „Nepodařilo se načíst lekci. Zkusit znovu“ |
| Zamčená lekce přes URL / deep link | ❌→✅ šlo ji dokončit mimo pořadí (i bosse). **Opraveno** b006c93 (guard v `completeLesson` + test). UX zbývá, viz problém 3 |
| Onboarding při existujícím profilu | ❌ `/onboarding/*` je dostupný (deep link, na webu Zpět), dokončení přepíše profil a smaže `activity`, viz problém 1 |
| Ztráta streaku, konec sezóny, reset v dev menu | ⚠️ plán B |

## Spec bod po bodu (rozsah kroků 1–2)

| Spec | Stav | Poznámka |
|---|---|---|
| §1 cíl a rozsah (core loop) | ✅ | |
| §2 stack (Expo 57, router, reanimated, zustand, svg) | ⚠️ | doctor: chybí `expo-asset` (problém 2) |
| §3.1 struktura složek | ✅ | |
| §3.2 tok dat přes services, `now` jako parametr | ✅ | |
| §3.3 typy | ✅ | názvy dle R9 |
| §3.4 contracts | ✅ | služby plánu B `notImplemented` záměrně |
| §4 XP rozpis | ✅ | testy + ověřeno v UI |
| §4 streak (přelom dne/měsíce, mezera) | ✅ | testy |
| §4 stavy uzlů mapy | ✅ | testy + UI; nově i guard při dokončení |
| §4 stage prahy | ✅ | testy |
| §4 liga, comeback, cíl sezóny, graf váhy | ⚠️ plán B | |
| §5 obsah (cesty, lekce, cviky) | ✅ | |
| §6.1–6.2 směr, palety, kontrast | ✅ | contrast test |
| §6.3 sezónní override | ⚠️ plán B | |
| §6.4 typografie | ⚠️ | hardcoded velikosti mimo theme (problém 5) |
| §6.5 kotouče | ✅ | |
| §6.6 tvary a spacing | ✅ | |
| §6.7 motion | ✅ | pružiny jen na odměnách |
| §6.8 výjimky skillu | ✅ | |
| §7.1 onboarding (5 kroků, validace, zrození) | ❌ | funguje, ale není „jen při prvním spuštění“ (problém 1) |
| §7.2 mapa | ✅ | |
| §7.3 lekce + oslava | ✅ | krok 8 stage-up → plán B |
| §7.4–7.10 stage-up, liga, progres, sezóna, šatník, notifikace, dev menu | ⚠️ plán B | |
| §8 maskot stage 1 idle/happy | ✅ | stages 2–3, celebrate, sad → plán B |
| §9 hydratace, migrate, error stav, přerušená lekce, změna dne | ✅ | notifikace → plán B |
| §10 testy logiky (krok 1–2) | ✅ | liga/sezóna/recap → plán B |
| §10 vizuální kontrola proti „Never“ | ✅ | review soubor, Step 4 |
| §11 roadmapa TODO | ✅ | |
| README | ⚠️ plán B | |

## Opraveno v tomto kole

- `b006c93` fix: zamčenou lekci nejde dokončit (deep link) — `services/mock/MockLessonService.ts`, test v `services/__tests__/MockLessonService.test.ts`.

## Otevřené problémy

1. **[blokující] Opakovaný onboarding smaže data** — boss. Repro: mít profil s lekcemi → otevřít `/onboarding/path` (deep link; na webu Zpět z mapy) → projít onboarding → `activity` = []. Oprava: v `app/onboarding/_layout.tsx` přesměrovat na `/(tabs)`, když profil existuje (a/nebo `completeOnboarding` odmítne přepsat existující profil mimo dev reset).
2. **[blokující] `expo-doctor` červený** — boss (dependency z motion kroku). `npx expo install expo-asset`, jinak hrozí pád mimo Expo Go.
3. **Zamčená lekce přes URL** — boss. Data už jsou chráněná, ale obrazovka lekci normálně spustí a na konci selže (`Alert` „Nepodařilo se načíst výsledek lekce“, na webu nic). `app/lesson/[id].tsx` má zamčenou lekci vůbec nespustit (ErrorState nebo přesměrování na mapu).
4. **Quit v lekci bez historie** — boss. `confirmQuit(() => router.back())` při otevření přes deep link nic neudělá. Použít `router.canGoBack() ? router.back() : router.replace('/(tabs)')`.
5. **Hardcoded typografie mimo theme** — design. `app/onboarding/dream.tsx:46` (22/32), `components/ui/TextField.tsx:33` (20/28), `components/ui/TopBar.tsx:11` (32/32) a `:67` (10/12), `MASCOT_COLORS` v `components/mascot/palette.ts`. Přesunout do `theme/`.
6. **K ruční kontrole na zařízení** — uživatel. Zvuk `click` v tichém režimu iOS, haptika, Android hardware Zpět v lekci/zrození.
