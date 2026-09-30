# QA: krok 3, gate A3

Datum: 2026-09-30 · qa-agent · větev `faze1/core-loop` · rozsah: celý spec §12 krok 3 (maskot stage 2–3, nálady, kotvy, kosmetika, Rive stub, DotLoader), UX1 (`a584337`), UX2 (`70768e9`) a opravy `0d24483` (R41: double-tap guard, jednoduchý poskok na mapě, `composeDreamSentence`). Tato tabulka nahrazuje a scaluje dohromady `eccd914` (krok 3) i A2 (UX1+UX2); žádný bod nebyl jen zkopírován — každý byl znovu ověřen (testy, zdrojové soubory, snímky).

**Verdikt: SCHVÁLENO**

## Build a testy (znovu spuštěno teď)
- `npm test`: 34 suites, 261/261 ✅
- `npx tsc --noEmit` ✅ bez chyb
- `npx expo lint` ✅ bez chyb
- `npx expo-doctor` 21/21 ✅
- Web export + `qa-a3` flow (light i dark, port 8099): žádný pageerror ani console.error. Server po ověření ukončen (`taskkill`), `web-build` smazán.

## Spec bod po bodu

| Bod | Stav | Důkaz |
|---|---|---|
| §7.1 krok 1: výběr cesty | ✅ | `qa-a3` `01-triple-path`: 3 cesty, radiogroup, „Pokračovat“ vyžaduje výběr |
| §7.1 krok 2: karty vize + „Vlastní…“ (R36) | ✅ | `components/onboarding/__tests__/dream.test.tsx` zelený; `qa-a3` `02-dream-picked`: 6 karet + „Vlastní…“, právě jedna vybraná (proužek + akcentní glyf) |
| §7.1 krok 3: milníky ≥6 na cestu (R37) | ✅ | `components/onboarding/__tests__/milestones.test.tsx` zelený; 9 checkboxů na cestu, výběr 1–3 |
| §7.1 krok 4: váha, validace | ✅ | `logic/onboarding.ts` `weightFieldErrors` + testy; 0/abc/999/1e2/−80/29/špatný směr zamítnuty |
| Změna cesty po výběru vize | ✅ | `data/__tests__/onboardingChoices.test.ts`; předvolená vize se vymaže, vlastní text zůstane |
| Stage 2 a 3 (`SvgMascot` z `STAGE_GEOMETRY`) | ✅ | `components/mascot/__tests__/SvgMascot.test.tsx` zelený; 3 čitelné siluety |
| Stage podle prahů 500 / 2000 | ✅ | `logic/__tests__/mascot.test.ts`: 499/500/1999/2000/99999/−10 pokryto |
| Nálada celebrate | ✅ | `components/mascot/__tests__/SvgMascot.test.tsx`, `components/lesson/__tests__/celebration.test.ts`; paže nahoru dle stage, reduce motion = statická póza |
| Nálada sad | ✅ | `SvgMascot.test.tsx` pokrývá pózu (uši dolů, smutná pusa). Zdroj v appce (streak/liga) je až krok 4 — plán B, nesráží body |
| Kotvy stage 1–3 | ✅ | `components/mascot/__tests__/anchors.test.ts` zelený pro stage 1–3 |
| Kosmetika na kotvách | ✅ | `components/mascot/__tests__/cosmetics.test.ts` zelený; tílko, mikina, šála (outfit i sezónní), čelenka, potítka, opasek |
| Rive stub | ✅ | `components/mascot/__tests__/riveInputs.test.ts` zelený; `RiveMascot.tsx` kompiluje, import zakomentovaný, Expo Go beze změny |
| DotLoader (požadavek uživatele) | ✅ | `lib/__tests__/dotLoader.test.ts` zelený; použit v `_layout`, `index`, `(tabs)/index`, `lesson/[id]` |
| Zrození → mapa → lekce → oslava → odemčení → XP | ✅ | `logic/__tests__/lessonFlow.test.ts`, `unlockSequence.test.ts`; `qa-a3` `07-map-initial`, `08-celebration` |
| Persist po reloadu | ✅ | `store/__tests__/migrate.test.ts`; předchozí `qa-a2/*-11-map-reload` |
| Rychlé klepání (Pokračovat, Hotovo) | ✅ | viz R41 níže — nyní přesně 1 krok/aktivace na trojklik |
| Reduce motion | ✅ | `useMotionSafe`, `ReduceMotion.System`; press/selection/stagger/hop skáčou na konec |
| Zvuky: `click.wav` odstraněn, expo-audio chyby ošetřeny | ✅ | žádný odkaz v kódu; `setAudioModeAsync().catch`, `play()` v try/catch |
| Architektura (žádné hex/literály mimo theme, data jen v `services/`/`logic/`) | ✅ | grep bez nálezu mimo komentář `mascot/palette.ts` a testy; motion parametry v `lib/motion.ts` |
| Liga, sezóna, šatník UI, progres, notifikace, dev menu | ⚠️ plán B | kroky 4–5, mimo rozsah |

## R41 (`0d24483`) — znovu ověřeno na webu (flow `qa-a3.mjs`, light i dark, port 8099)

- **Trojklik na Pokračovat posune přesně o jeden krok.** Ověřeno na 3 různých krocích (cesta→vize, vize→milníky, milníky→váha/zrození): `qa-a3` log `after triple-tap ... url` ukazuje vždy přesně následující krok, ne přeskočený. Kryto i testem `components/onboarding/__tests__/OnboardingFrame.test.tsx` (trojité ťuknutí = 1 volání `onContinue`, rozostření+zaostření bránu znovu otevře).
- **Jeden poskok opice na mapě po odemčení.** Ověřeno v kódu (`git show 0d24483 -- components/map/LessonMap.tsx`): `lift` shared value i konstanty `HOP_LIFT`/`HOP_CROUCH` byly smazány, `mascotStyle` už nepřičítá `lift.value` k `translateY` — svislý skok teď hraje výhradně `<Mascot />` (mood „happy“, `motion.hop`), mapa jen vodorovný přejezd. Dřívější zdvojení (mapa + maskot) je tím strukturálně vyloučené, ne jen ztlumené.
- **Karta vize ukládá „Titulek. Řádek“ a výběr přežije návrat na krok.** `logic/onboarding.ts`: `composeDreamSentence = (title, line) => \`${title}. ${line}\``; `hooks/useOnboardingDraft.ts` `useDreamOptions` z toho skládá `sentence`, kterým se karta poznává při obnově (`dream.tsx`: `selectedId = options.find(o => o.sentence === dreamBody)`). `qa-a3` screenshoty `02-dream-picked` a `04-dream-return-selected`: karta „Muscle-up“ vybraná (proužek + akcentní glyf) shodně před i po `goBack()` na krok vize. Kryto testy `dream.test.tsx` (obnova výběru po návratu) a `onboardingChoices.test.ts` (unikátnost/délka/validita vět).
- **Vlastní text zůstává.** `qa-a3` `05-custom-kept`: text „Deset čistých shybů.“ vyplněný v poli „Tvoje vize“, po `Pokračovat` → `goBack()` je pole stále vyplněné stejnou hodnotou.

## Architektura
✅ Žádné hex barvy v `app/`, `components/`, `lib/`, `hooks/` (jen komentář v `mascot/palette.ts` a testy). ✅ Žádné numerické literály padding/margin/gap/borderRadius/fontSize v komponentách — spacing a radius ze škály §6.6. ✅ Motion parametry v `lib/motion.ts`. ✅ Validace a skládání vize (`composeDreamSentence`, `isDreamValid`, `weightFieldErrors`) jen v `logic/`.

## Otevřené (neblokuje, s vlastníkem)
- **design:** dark kontrast šály Winter Arc (`SEASON_MATERIAL.winterArc`) — K ruční kontrole na zařízení.
- **design:** stage 3 ramena/trapéz ještě ověřit na reálném displeji, jestli nepůsobí jako límec.
- **motion:** count-up +XP běží na JS (rAF) — plynulost na slabším Androidu při zátěži neověřena.
- **boss:** zvuky (`plate-snap`, `select`, `unlock`) neslyšeny na zařízení (hlasitost, `playsInSilentMode: false`, mix s hudbou).
- **boss:** nálada sad a `cosmetics` zatím nemají zdroj v appce — plán B pro krok 4 (liga/streak, šatník).
- **boss:** `docs/SPEC.md` §7.1 (ř. 362) ještě popisuje `dreamBody` jako titulek karty; po R41 ukládá „Titulek. Řádek“ — sladit spec s kódem (rating už toto hlásil jako doporučení, ne nález).
- **README.md** stav (ř. 44–49) byl zastaralý dle RATING kolo 1 — mimo rozsah QA, viz LOG boss.

Snímky: `.superpowers/sdd/2026-09-29-opice-faze1-core-loop/tools/shots/qa-a3` (nové, tento gate), dříve `qa-step3`, `qa-a2`, `qa-a2-r2`, `qa-a2-rm`. Dočasné flow skripty jsou mimo repo (`tools/flows/qa-a3.mjs`), appka beze změny krom oprav popsaných níže. Server ukončen, `web-build` smazán.
