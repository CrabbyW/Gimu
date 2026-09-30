# QA: krok 3, gate A2 (UX1 + UX2)

Datum: 2026-09-30 · qa-agent · větev `faze1/core-loop` · rozsah: re-check kroku 3 po UX1 (`a584337`) a UX2 (`70768e9`), regresní průchod core loopu.

**Verdikt: SCHVÁLENO**

## Build a testy
- `npm test`: 33 suites, 257/257 ✅
- `npm run typecheck` ✅ · `npm run lint` ✅ · `npx expo-doctor` 21/21 ✅
- Web export a flow `qa-step2`, `qa-r2`, `qa-a2`, `qa-a2-rm` (light i dark): žádný pageerror ani console.error ✅

## Spec bod po bodu
| Bod | Stav | Důkaz |
|---|---|---|
| §7.1 krok 1: výběr cesty | ✅ | 3 cesty, „Pokračovat“ bez výběru zakázané |
| §7.1 krok 2: karty vize + „Vlastní…“ (R36) | ✅ | každá cesta 6 karet + „Vlastní…“, vybraná právě jedna (proužek + akcentní glyf), prázdný/mezery/„ab“ vlastní text blokuje, pole ořízne na 140 znaků |
| Změna cesty po výběru vize | ✅ | předvolená vize se vymaže (Pokračovat zakázané), vlastní text zůstane |
| §7.1 krok 3: milníky ≥6 na cestu (R37) | ✅ | 9 checkboxů na každé cestě (7 + 2 obecné), výběr 1–3 funguje |
| §7.1 krok 4: váha, validace | ✅ | 0, abc, 999, 1e2, −80, 29 a špatný směr cíle zamítnuto s českou chybou |
| Zrození → mapa → lekce → oslava → odemčení → XP | ✅ | `qa-a2/*-05..10`, uzel 2 přejde na „aktuální“, XP v top baru |
| Persist po reloadu | ✅ | `*-11-map-reload`, `qa-a2-r2/*-04-reload` |
| Rychlé klepání (Hotovo, Jdeme trénovat, Pokračovat v oslavě) | ✅ | dblclick → 1 aktivita, 1 navigace |
| Reduce motion | ✅ | celý loop s `reducedMotion: reduce` projde, press/selection/stagger skočí na konec (`useMotionSafe`, ReduceMotion.System) |
| Motion UX2 (press, stagger, oslava, hop) | ✅ | oslava: kotouče, +XP, rozpis; žádné chyby. Délky nativních stack přechodů na webu neověřitelné |
| Zvuky: `click.wav` odstraněn | ✅ | žádný odkaz v kódu; `assets/sounds` = plate-snap, select, unlock |
| Zvuky: chyby expo-audio | ✅ | `setAudioModeAsync().catch`, `seekTo().catch`, `play()` v try/catch |
| Stage 3 ramena, zimní šála | ✅ | UX1 opraveno (deltoidy, `SEASON_MATERIAL.winterArc`) |
| Liga, sezóna, šatník UI, progres, notifikace, dev menu | ⚠️ plán B | kroky 4–5 |

## Architektura
✅ Žádné hex barvy v `app/`, `components/`, `lib/`, `hooks/` (jen komentář v `mascot/palette.ts`). ✅ Žádné numerické literály padding/margin/gap/borderRadius/fontSize v komponentách, spacing a radius ze škály §6.6, rozměry jako tokeny. ✅ Motion parametry v `lib/motion.ts` (R33). ✅ Validace a délka vize v `logic/onboarding.ts`.

## Rozbité / otevřené (neblokuje)
- ⚠️ **boss:** rychlé dvojité klepnutí na „Pokračovat“ v onboardingu posune o dva kroky (web: milníky → váha → zrození, krok váhy se přeskočí s výchozím „bez cíle“). Repro: krok 3, vyber milníky, trojklik na Pokračovat. Nevzniká neplatný stav, ale uživatel krok nevidí. Návrh: zámek navigace v `OnboardingFrame` (ignorovat onContinue do blur).
- ⚠️ **motion:** count-up +XP běží na JS; na snímku 1,2 s je +31 z 32 (dopočítá se). Dvojitý poskok opice na mapě (UX2 obava).
- ⚠️ **boss:** zvuky neslyšeny na zařízení, K ruční kontrole.
- ⚠️ **design:** `dreamBody` ukládá titulek karty, ne větu (UX1 obava), rozhodnout pro Progres v kroku 5.

## Opravy
- Žádná oprava v appce. V nástrojích (mimo repo) `flows/qa-r2.mjs`: po načtení se nechá doběhnout stagger (`tick 800`), jinak klik na kartu padal na překrytí při zmrazených hodinách. Nové flow `qa-a2.mjs`, `qa-a2-rm.mjs`.

Snímky: `.superpowers/sdd/2026-09-29-opice-faze1-core-loop/tools/shots/qa-a2`, `qa-a2-edge`, `qa-a2-r2`, `qa-a2-rm`. Server ukončen, web-build smazán, dočasné routy žádné.
