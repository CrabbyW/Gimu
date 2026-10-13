# Opice: 26 animací (kolo „opice žije“)

Uživatel (2026-10-13) schválil všech 26 návrhů. Pravidlo pro celý repertoár: najednou nejvýš jedna akce,
idle akce jen jednou za 20–40 s, žádný zvuk, haptika jen u akcí, které spustí uživatel (ťuknutí, dokončení).
Reduce Motion: každá akce degraduje na statickou pózu / prolnutí (`degrade`).

Stav: **existuje** = už je v `logic/mascotIdle.ts` / `logic/mascotReactions.ts` / pózách, jen zkontrolovat
na nové opici v2; **nové** = doplnit.

## Spouštění (boss → `logic/`, čisté funkce s testy)
- Idle (`IdleActionId`, `pickIdleAction`): nové akce `warmup` (krouží rameny / dřep), `boredSit` (sedí, houpe nohama),
  `pointStart` (ukáže na kartu Start po N s bez akce), `plateHop` (přeskok na sousední kotouč a zpět),
  `handstandPlate` (stojka na kotouči). Denní doba: ráno `morningStretch`, večer `eveningTowel`
  (`timeOfDay(now)` v logic). `streakAtRisk` (nervózní přecházení + hodinky) když `copy` „Streak ends tonight“.
- Reakce (`MascotEvent` → `ReactionId`): `tap` na hlavu = `headShake`, na břicho = `giggle` (zóna ťuknutí z
  geometrie), rychlé ťukání = existující `flip`; `longPress` = `hangFinger` (visí na prstu, nahrazuje `cuddle`
  jen pro dlouhý stisk s pohybem); `gaze` za prstem/scrollem existuje (`gaze`, `lookDown`).
- Lekce: `lessonStart` (existuje `nod`), nové události `holdFinal3s` → `strain`, `rest` → `wipeSweat`,
  `exerciseSkip` → `shrug` (existuje), `lessonDone` → `liftBarbell` (místo obecné `celebrate`),
  `streakRecord` → `flameJump`, `leagueUp` → `climbPodium`, `stageUp` → existující levelUp + `grow`.
- Návrat: `appReturn` ≥ 60 s → `waveRun` (zamává oběma rukama a doběhne k aktuálnímu uzlu), `streakLost`
  → `sadThenPoint` (posedí, pak ukáže na Start — bez výčitky).
- Stavy: offline → `wifiShake`, chyba → `ropeTangle`, prázdný → `peekBox` (navazuje na pózy offline/fail/empty).

| # | Animace | Typ | Stav | Kreslí | Hýbe |
|---|---|---|---|---|---|
| 1 | rozcvička | idle | nové | design | motion |
| 2 | nuda na kotouči | idle | nové | design | motion |
| 3 | usínání, ťuk = probuzení | idle/reakce | existuje (sleep) | — | motion (v2) |
| 4 | pohled za prstem/scrollem | reakce | existuje (gaze/lookDown) | — | motion (v2 oči) |
| 5 | ukazuje na Start | idle | nové | design | motion |
| 6 | přeskok / stojka na kotouči | idle | nové | — (pózy existují) | motion |
| 7 | ťuk na hlavu | reakce | nové | — | motion |
| 8 | ťuk na břicho | reakce | nové | design (smích) | motion |
| 9 | rychlé ťukání = salto | reakce | existuje (flip) | — | motion (v2) |
| 10 | visí na prstu | reakce | nové | — (hang) | motion |
| 11 | cvičí s tebou v lekci | lekce | nové | design (mini) | motion |
| 12 | posledních 3 s výdrže | lekce | nové | design (zatnutí) | motion |
| 13 | pauza: pot, lahev | lekce | nové | design (ručník, lahev) | motion |
| 14 | přeskočený cvik | lekce | existuje (shrug) | — | motion (v2) |
| 15 | činka nad hlavou + nacvaknutí | oslava | nové | design (činka) | motion |
| 16 | rekord série: plamen + flex | oslava | nové (pózy streak/flex) | — | motion |
| 17 | šplh na pódium | liga | nové | — (levelUp) | motion |
| 18 | růst opice | stage-up | existuje (levelUp) | — | motion (tečky rostou) |
| 19 | ráno protahování | denní | nové (stretch) | — | motion |
| 20 | večer čelenka + ručník | denní | nové | design (čelenka, ručník) | motion |
| 21 | návrat: mávání + doběhne | návrat | částečně (wave) | — | motion |
| 22 | série v ohrožení | denní | nové | design (hodinky) | motion |
| 23 | ztracená série | stav | částečně (sad) | — | motion |
| 24 | offline wifi | stav | póza existuje | — | motion (zapojení) |
| 25 | chyba: zamotané lano | stav | nové | design (lano) | motion |
| 26 | prázdná krabice | stav | póza existuje (empty) | — | motion |

## Pořadí
1. boss: logika spouštění + typy + testy (výše), zapojení událostí z obrazovek (lekce: holdFinal3s, rest, skip; oslava; liga; app return; offline/error/empty).
2. design-agent: nové pózy a rekvizity (činka, ručník, lahev, čelenka, hodinky, lano, smích, zatnutí, mini opice v lekci) do `logic/mascotPoses.ts` + `PoseProps`.
3. motion-agent: přehrání všech 26 (`reactionMotion`, `poseMotion`, `PropMotion`), priority a cooldowny, výkon.
4. qa-agent → rating-agent.

## Ověření
tsc, jest (logika spouštění: deterministicky přes `rng`/`now`), eslint, e2e (galerie akcí v /dev s tlačítkem pro každou
z 26 akcí — e2e projde všechny bez chyby), e2e:perf (mapa ≥ 55 fps s běžícím idle), iPhone checklist.
