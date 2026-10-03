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

---

# Demo fáze 4, kolo 1 (qa-agent, 2026-10-02)

**Verdikt: NESCHVÁLENO** (logika, persist a dvojí tapy na nákup a převzetí jsou v pořádku; layout na 320 a 375 pt a dvojí tap na CTA oslavy ne)

## Automaticky
- `npm test` 391/391, `npm run typecheck` čistý, `npm run lint` čistý, `npx expo-doctor` 21/21.
- Boundary grep `rg -P "@/(store|data/(?!copy)|services/mock)" app components`: jediný nález je `components/mascot/__tests__/cosmetics.test.ts` (test, ten smí). OK.
- Hardcoded hex a čísla ve stylech v `app/` a `components/`: nic (jen hex v komentáři `palette.ts`).
- Playwright: flow `tools/flows/qa-f4.mjs` (celý průchod + všech 7 akcí dev menu + aria snapshoty `*.ax.txt` + detekce ploch < 44 pt), `qa-f4b.mjs` (dvojí tap na Koupit a Pokračovat, prázdný profil), `qa-f4c.mjs` (profil bez vah). Harness `tools/shoot-vp.mjs` (env `VW`/`VH`). Viewporty 390×844, 375×667, 320×568, 430×932, light i dark. Snímky v `shots/demo-f4/`.

## Co funguje
- Průchod onboarding → mapa → lekce → oslava → stage-up (Stage 02 · Teenager) → mapa; liga, sezóna, progres, profil, šatník, nastavení se načtou bez pageerror ve všech 4 viewportech a obou tématech.
- Dev menu: všech 7 akcí funguje (demo, +500 XP, stage auto/1/2/3, skok na konec sezóny, ztráta streaku, reset posunu, reset appky s potvrzením → onboarding).
- Konec sezóny: tab Sezóna → recap 5/5 → „Převzít odměnu“ dvojklikem → „Převzato“, převzetí proběhne jednou (guard `claimed || claiming` + idempotentní claim v logice).
- Šatník: dvojklik na „Tílko Ember“ (60) → jeden dialog, banány 96 → 36, strženo jednou. Málo banánů → věta místo dialogu.
- Persist: po reloadu zůstane stav (mapa, XP, liga).
- Profil bez vah (cíl lose, `weights: []`): Progres nepadá, prázdný graf s cílovou linií + „Zatím bez záznamu“ + CTA zápisu.
- Notifikace na webu (≈ denied): toggle neaktivní s vysvětlením, test tlačítko neaktivní.

## Bugy
### Critical
- žádný

### Important
1. **Dvojí tap na „Pokračovat“ v oslavě propadne do tab baru.** Postup: lekce `bc-1-8` → oslava → rychlý dvojklik na „Pokračovat“ (SE i 430). Výsledek: skončí na tabu **Sezóna** místo na mapě nebo stage-upu (druhý klik dopadne na tab bar pod místem CTA). Soubory `components/lesson/LessonCompleteScene.tsx` / CTA bar. Potřeba guard (jedna navigace) nebo blokovat vstup během přechodu. Boss.
2. **Liga: auto-scroll na vlastní řádek odroluje hlavičku.** Postup: demo → tab Liga na 375×667. Odznak úrovně, POZICE 6/16, TVOJE XP a odpočet nejsou vidět, první řádek je oříznutý pod hlavičkou. `app/(tabs)/league.tsx:58` (`scrollToIndex viewPosition 0.5`). Návrh: scrollovat jen když vlastní řádek není ve viewportu, nebo hlavičku nechat mimo FlatList. Design-agent / boss.
3. **Oslava na 320 pt:** titulek „Kotouč na ose.“ se zalomí a druhý řádek „ose.“ překryje kotouče; opice překrývá číslici „4“ v +44 (s 3 ciframi to bude horší); rozpis XP se zalomí na dva řádky. `shots/demo-f4/dark-xs-15-celebrate.png`. Design-agent (layout), motion-agent (slam 1.2× musí mít rezervu).
4. **320 pt: popisky tab baru se ořezávají** („TRÉNI…“, „PROGR…“) a název sezóny „WINTER A…“. `shots/demo-f4/light-xs-04-season.png`. Design-agent.

### Minor
5. **Dev menu: telemetrie posunu se zalamuje** („POSUN: +0 / D 0 H“) už na 375 pt. `app/dev.tsx` (Telemetry). Design-agent (nezalomitelné mezery nebo dva řádky).
6. **Web a11y ligy:** každá opice v řádku má label „Tvoje opice“ i u cizích hráčů a `accessible` řádku na webu nespojí obsah (aria strom čte „1“, „Kuba_Shyb 358 XP 2“ … rozsekaně). Nadpisy „LIGA“ i „POSTUP“ jsou oba `heading level 1`. Na nativu `accessible` obsah sloučí (ověřit ručně). `components/league/LeagueRow.tsx`, `SvgMascot.tsx`. Boss/design.
7. **Přímý vstup na tab bez profilu** (deep link `/progress` po resetu) = nekonečný DotLoader místo přesměrování na onboarding. `app/(tabs)/progress.tsx:43` (a obdobně ostatní taby). Boss.
8. Recap slide Odměna: opice bez nasazené kosmetiky (mikina chybí), na mapě ji má. Ověřit záměr (design-agent).
9. CTA „Pokračovat“ v oslavě je zarovnané doprava s prázdnou levou částí lišty; zkontrolovat, že to je záměr (design-agent).

## Opraveno v tomto kole
- `ErrorState` dostal prop `edges`; v tabech pod `TabHeader` se předává `[]`, na mapě (bez hlavičky) `['top']`. Dřív se safe-area zdvojovala. `components/ui/ErrorState.tsx`, `app/(tabs)/{index,league,profile,progress,season}.tsx`.
- Dev menu „Zpět“ měl plochu 34×14 pt → `minHeight/minWidth size.hit`. `app/dev.tsx`.
- Po opravách: test 391/391, typecheck a lint čisté.

## K ruční kontrole (zařízení)
- VoiceOver/TalkBack: pořadí v recapu (šipka „Předchozí snímek“ je v aria stromu až za obsahem), modální fokus v recapu, stage-upu, šatníku a dialogu nákupu, sloučení řádku ligy, oznámení `accessibilityLiveRegion` v dev menu.
- Dvojí tap na „Pokračovat“ (bug 1) na fyzickém zařízení (rychlost tapu ~150 ms).
- Reduce motion na nových animacích (web snímky motion-agenta existují, systémové nastavení na iOS/Android ne).
- Skutečné `denied` notifikace na iOS/Android (web vrací „nejde“).
- Na 320×568 byla CTA oslavy na snímku 1.8 s po dokončení oříznutá spodním okrajem (na 375 a 430 po 5 s v pořádku) — ověřit, že po doběhnutí nástupu je celá vidět.
- Haptika a zvuk v rámu dopadu.

---

# Demo fáze 4, kolo 2 (qa-agent, 2026-10-02)

Zúžené kolo: 320×568 a 390×844 dark, light jen oslava. Flowy `tools/flows/qa-f4d-*.mjs`, `qa-f4r-*.mjs`; snímky `shots/demo-f4c/`.

## Build
- `npm test` 46 sad / 391 testů ✅, `npm run typecheck` ✅, `npm run lint` ✅. Žádný pageerror ani console.error v žádném běhu.

## Re-check bugů 1–9
1. ❌ **Dvojí tap propadá do tab baru (stále).** Ref guard funguje (jedna navigace), ale druhý tap ~120 ms po prvním dopadne po `dismissTo` na tab bar mapy. Repro 320×568: demo → `/lesson/bc-1-1` → oslava → dva tapy na „Pokračovat“ (120 ms) → skončí na `/season`. Totéž ze stage-upu (`bc-1-8` → stage-up → dvojtap → `/season`). Oslava → stage-up je OK (stage-up je celoobrazovkový). Na nativu možná překryje přechod modalu, ověřit ručně. Návrh: po příchodu na mapu ignorovat tapy tab baru ~300 ms, nebo navigovat až po odeznění press-out. Boss.
2. ✅ Hlavička ligy mimo scroll, POZICE/TVOJE XP viditelné na 320 i 390.
3. ⚠️ Titulek i +44 vs opice OK (překryv nenaměřen během slamu ani v klidu, dark i light). Rozpis XP se na 320 stále láme na 2 řádky (kosmetika). Design-agent.
4. ✅ Tab bar na 320 bez ořezu, „WINTER ARC“ celý.
5. ✅ Telemetrie dev menu: dva řádky, bez zalomení uvnitř hodnoty.
6. ✅ (web) Jeden `heading` „LIGA“, řádky čtené souvisle. Label opic cizích hráčů nekontrolován do hloubky.
7. ✅ `/progress`, `/league`, `/season`, `/profile` bez profilu → `/onboarding/path`.
8., 9. Záměr design-agenta, neověřováno.

## Nové
10. ❌ **Liga 320 pt: „TVOJE XP“ hodnota naráží na pravý okraj** (176 končí na x=319 z 320, jednotka „XP“ mimo obraz). `shots/demo-f4c/xs/dark-league.png`. Při 4ciferném XP se ořízne. Design-agent (`app/(tabs)/league.tsx` hlavička: zmenšit číslo / zalomit).

## Motion regrese
- Po 2.5 s na mapě, lize, progresu, profilu, sezóně, šatníku nic viditelného v obraze s opacitou < 0.1 (nálezy detektoru byly jen položky schované pod hlavičkou / mimo scroll; po scrollu nahoru i dolů vše viditelné).
- Návrat na tab (Liga ↔ Trénink, vzorek po 150 ms): obsah hned viditelný, sekvence se nepřehrává ✅.
- Reduce motion: vše viditelné po 300 ms na všech 6 obrazovkách ✅.

## Verdikt: NESCHVÁLENO
Blokuje bug 1 (dvojí tap → tab Sezóna, reprodukovatelné na webu) a 10 (ořez XP v lize na 320). Ostatní opravy z kola 1 drží, motion pass bez regresí.

### Boss: opravy po kole 2 (2026-10-02)
- **Bug 1:** `lib/navGuard.ts`, oslava a stage-up při odchodu volají `markNavigation()`, tab bar 600 ms ignoruje `tabPress` (`screenListeners` v `app/(tabs)/_layout.tsx`). Ověřeno na 320×568 dvěma tapy 120 ms po sobě: oslava → `/`, stage-up → `/?unlocked=bc-1-boss`.
- **Bug 10:** hlavička ligy na kompaktním displeji má pozici o stupeň menší (Stat M) a užší mezery. Na 320 je XP i jednotka uvnitř obrazu.
- **Bug 3 (rozpis XP):** zalomení na 320 jde jen mezi položkami a nic se neořízne. Je to záměrné rozhodnutí design-agenta (LOG, kolo 1), ne bug.

## Demo fáze 4, kolo 3

- Bug 1 (dvojtap „Pokračovat“, 120 ms, dark, 320×568 i 390×844): OK. Replay bc-1-1 → `/` (mapa); bc-1-8 oslava → `/stage-up?from=1&to=2&unlocked=bc-1-boss`; stage-up dvojtap → `/?unlocked=bc-1-boss` (mapa). Žádný propad do jiného tabu. Flow `tools/flows/bug1b.mjs`.
- Bug 10 (liga 320 pt): OK. Demo profil (3ciferné XP) i po 3× dev „+500 XP“ (1676 XP) — číslo i jednotka „XP“ celé v hlavičce i v řádku žebříčku, nic neořezáno. Dlouhé jméno soupeře zkráceno elipsou („Kuba_Sh...“) — záměrné, ne bug. Flow `tools/flows/bug10.mjs`, snímky `shots/demo-f4d/bug10-320|390/`.
- `npm test` 46/46 suites, 391/391 testů; `npm run typecheck` čisté; `npm run lint` čisté.

Verdikt: **SCHVÁLENO** (bugy 2–9 ověřeny v kole 2).

## R44 kolo 1 (Teplá litina + pohyb/haptika, 9901140..a553e9e)

**Verdikt: SCHVÁLENO** (s poznámkami níže; žádný blokující nález)

### Automatické kontroly
- `npx tsc --noEmit`: 0 chyb · `npx expo lint`: 0 · `npx jest`: 50 sad / 445 testů prošlo.
- grep `#[0-9A-Fa-f]{6}` v app/ components/ (mimo palettes/tokens/mascot/testy): 0 výskytů.
- `Flame` ikona: 0 · systémová modrá (`#007AFF`/systemBlue): 0.

### Dokončení lekce (LessonCompleteScene)
- ✅ XP uložené před scénou: `completeLesson` se čeká v `app/lesson/[id].tsx`, scéna dostává hotový `result`; dvojí „Hotovo“ hlídá `completing` ref, dvojí „Pokračovat“ `leaving` ref.
- ✅ skipToEnd idempotentní (`once` gate), bez haptiky/zvuku; ruší kroky z UI vlákna i haptický vzor.
- ✅ AppState `background` → skipToEnd; listener odebrán při unmountu.
- ✅ Ducking: `setDucking(true)` při vstupu, `teardown` (once) vrací `false` při skipu i unmountu.
- ✅ Přerušený pád (`done === false` u vedoucího kotouče) → skipToEnd.
- ✅ Reduce Motion: rozhodnuto jednou (`useState(reduced)`), konečné stavy hned, haptika a zvuk zachovány, CTA po prolnutí.
- ✅ Max 8 XP ticků (`xpTickStep`, testováno v celebrationMotion.test.ts); skip = bez ticků.
- ✅ „Zítra: …“ přes `nextLessonId` + estMinutes; konec cesty → `copy.lesson.sectionDone`.
- ✅ Kotouč série jen při `firstOfDay > 0`.

### Ostatní
- ✅ Nálada opičky: `sad` jen při přerušené sérii a `longestStreak ≥ 2` (logic/mascotMood.ts).
- ✅ Přepínače haptika/zvuk nezávislé (lib/haptics.ts `hapticsEnabled`, lib/sound.ts `soundEnabled`).
- ✅ Onboarding připomínka: odmítnuté oprávnění / chyba neblokuje (try/catch, pokračuje na zrození).
- ✅ badgeProgress, estMinutes: pokryto v logic/__tests__/redesign.test.ts.
- ✅ Tab bar 320 pt: nejdelší popisek „Trénink“/„Progres“ v 11 pt se vejde do 64 pt slotu.

### Opraveno v tomto kole (drobnosti)
1. `app/onboarding/reminder.tsx`: rychlé dvojí ťuknutí na „Pokračovat“ / „Bez připomínky“ pushlo `/onboarding/birth` dvakrát. Přidán `leaving` ref, reset přes `useFocusEffect` (návrat Zpět funguje).

### Nálezy (nezávažné, k ruční kontrole)
- MINOR (design-agent): popisek tabu nemá `numberOfLines={1}` / `adjustsFontSizeToFit`; při velkém Dynamic Type se může zalomit. Ověřit na zařízení 320 pt s největším písmem.
- INFO (motion-agent): AppState reaguje jen na `background`, ne `inactive` (Control Center na iOS animaci nepřeskočí). Spec to připouští; ověřit ručně.
- K ruční kontrole: haptika AHAP na fyzickém iPhonu, ducking hudby, zamčená liga (dev-xp, přelom týdne) a StreakBarbell stavy (×K, čeká, přerušený) vizuálně — logika testy prošla, vizuál jsem neověřoval na zařízení.

## R44 kolo 2 (přeskočení)

Kontroly: `tsc --noEmit` 0 chyb; jest 51 suites / 458 testů zelených; eslint na změněných souborech 0 chyb (50 chyb celého repa je jen v `.agents/skills/**`, mimo appku).

Ověřeno ✅
- Matematika dluhu: 50 s → 5 × 10 s → 0; strop dluhu 150 s / 40 opak.; strop na cvik min(15 s / 4 opak., 25 % základu, aspoň 1); malý zbytek doběhne (minShare / min s dluhem); smíšený hold+reps doběhne nezávisle, lekce bez daného typu dluh nemění (nový test).
- Přeskočený cvik s navýšením: navýšení se neodečte, přičte se jen základ (test).
- Idempotence retry: `isRetry` vrací původní profil dřív, než se sahá na `trainingDebt` → dluh se nezapočítá dvakrát (nový test přes službu, profil je identický objekt).
- canSkip: lekce s 1 cvikem nejde přeskočit, slepá ulička nevznikne (2 cviky: jen první).
- Skip jen v idle/paused výdrži, ne v countdown/running/done; před skipem `pause()`.
- Migrace: profil bez `trainingDebt` projde, poškozený dluh (záporný, string, bez share, null, číslo) se zahodí a profil zůstane (nový test).
- XP: base = round(full × poměr), boss z 40 (nový test), bonusy dne a série beze změny.
- Texty „Přeskočit“, „+N s za přeskočené cviky“, „+N opak. za přeskočené cviky“ česky v `data/copy.ts`.

Opraveno v tomto kole
- `logic/completion.ts`: odmítnutí výsledku, jehož `done`/`extras` nesedí na počet cviků (dřív by nesouhlasná délka tiše zkreslila dluh i „platí od poloviny“).
- `services/__tests__/MockLessonService.test.ts`: tautologická aserce `base < base/(2/3)+1` nahrazena přesnou hodnotou 13.

Drobnosti (neblokují)
- Retry vrací XP přepočítané z aktuálního `done`, ne `prior.xp`; při stejném attemptId z UI je `done` vždy stejné, takže v praxi shodné. (boss/logika)
- Běžící výdrž skrývá „Přeskočit“, uživatel musí nejdřív pauznout — záměr, ale UX zvážit (design-agent).
- Navýšení platí i na replay a boss lekci; spec to neřeší, ponecháno.

Verdikt: SCHVÁLENO
