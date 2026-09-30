# RATING: krok 3 (spec §12 krok 3 + DotLoader + UX1 + UX2 + opravy 0d24483), kolo 1

Datum: 2026-09-30 · rating-agent · větev `faze1/core-loop` @ 0d24483
Rozsah: maskot stage 2–3, nálady celebrate a sad, kotvy, kosmetika, Rive stub, DotLoader (požadavek uživatele), UX1 (výběr vize a milníků, R36/R37), UX2 (motion overhaul, Kenney CC0 SFX, R38–R40), opravy 0d24483 (R41). Kroky 1–2 jen regrese. Body, které `docs/QA.md` značí ⚠️ plán B, se nepočítají jako chybějící.

## Skóre: 65/100

| # | Kategorie | Max | Body | Stav |
|---|---|---|---|---|
| 1 | Funkčnost | 25 | 0 | ❌ |
| 2 | Shoda se specifikací | 15 | 15 | ✅ |
| 3 | Architektura a kód | 15 | 15 | ✅ |
| 4 | Vizuální kvalita | 20 | 20 | ✅ |
| 5 | Motion | 15 | 15 | ✅ |
| 6 | Dokumentace | 10 | 0 | ❌ |

## Ověření
- `npm test`: 34 sad, 261/261 ✅
- `npx tsc --noEmit`: bez chyb ✅
- `npx expo lint`: exit 0 ✅
- `docs/QA.md`: gate A2, SCHVÁLENO na c451b69.

## Nesplněná kritéria

### 1. Funkčnost (0/25)
- **1.1 (qa)** `docs/QA.md`: tabulka „Spec bod po bodu“ gate A2 přepsala tabulku kroku 3 (eccd914) a body spec §12 kroku 3 v ní nejsou: stage 2 a 3, prahy 500/2000, nálada celebrate, nálada sad, kotvy stage 1–3, kosmetika na kotvách, Rive stub, DotLoader. Zůstal jen řádek „Stage 3 ramena, zimní šála“. Kritérium „všechny body specifikace pro tento krok jsou ✅ v docs/QA.md“ tak aktuální QA.md nesplňuje. Oprava: do QA.md vrátit (znovu ověřit) řádky kroku 3 vedle řádků UX1/UX2.
- **1.2 (qa)** Commit 0d24483 (`OnboardingFrame` brána `firedRef`, odstranění `lift` v `components/map/LessonMap.tsx`, R41 `composeDreamSentence` v `logic/onboarding.ts`, `hooks/useOnboardingDraft.ts`, `app/onboarding/dream.tsx`) přišel po verdiktu SCHVÁLENO (c451b69) a qa-agent ho neschválil. SCHVÁLENO tak nepokrývá hodnocený stav kódu (CLAUDE.md: „Nic není hotové, dokud to neschválí qa-agent“). Oprava: QA re-check 0d24483 (trojklik Pokračovat, jeden poskok na mapě, uložení a obnova věty vize po návratu na krok).

### 6. Dokumentace (0/10)
- **6.1 (boss)** `README.md` sekce „Stav“ (ř. 44–49) je zastaralá: uvádí hotové kroky 1–2, „Rating kroku 2 je v přípravě“ a „maskot stage 2–3“ jako budoucí plán B. Chybí krok 3 (stage 2–3, nálady, kosmetika, Rive stub), DotLoader, UX1 a UX2. (Záznamy v `docs/LOG.md` od design, motion, qa i boss jsou kompletní; odstavec o zvucích Kenney v README je v pořádku.)

## Splněné kategorie (stručně)
- **Shoda se specifikací:** body §12 kroku 3 implementované (`SvgMascot` stage 1–3, celebrate/sad, kotvy s testy, kosmetické vrstvy, `RiveMascot` stub). Odchylky a přídavky (DotLoader R34, UX1 R36/R37, UX2 R38–R40, R41, R31–R35) jsou zapsané v `docs/LOG.md`.
- **Architektura:** žádné `any`; TODO jen s fází (`hooks/useServiceQuery.ts`, `services/contracts.ts`); hex jen v komentáři `components/mascot/palette.ts` a v testu; `composeDreamSentence` v `logic/`, karty vize přes hook, motion parametry v `lib/motion.ts` (R33); mrtvé `HOP_LIFT`/`HOP_CROUCH` odstraněny.
- **Vizuál / motion:** hodnoceno z kódu, snímků (t15–t17, dotloader, ux1/r3, ux2, qa-step3*, qa-a2*) a reportů. Pružiny s ζ 0.68–0.84, reduce motion přes `useMotionSafe`, haptika u výběru, odemčení, výdrže a oslavy, dotykové plochy a stavy dle QA.

## K ruční kontrole (bez srážky bodů)
1. Zvuky `plate-snap`, `select`, `unlock` na iOS a Androidu (hlasitost, `playsInSilentMode: false`, mix s hudbou).
2. Délky nativních stack přechodů (kořen fade 250 ms, lekce slide_from_bottom 350 ms, zrození fade 300 ms), na webu neověřitelné.
3. Haptika (tick u výběru vize, Light u odemčení, Medium na konci výdrže, oslava) na zařízení.
4. Count-up +XP běží na JS (rAF): plynulost na slabším Androidu při zátěži.
5. Jeden poskok opice na mapě po odemčení (0d24483) a poskok celebrate bez propadu pod klid.
6. Kontrast šály Winter Arc (`SEASON_MATERIAL.winterArc`) v dark režimu na zařízení.
7. Stage 3 deltoidy a trapéz: už nepůsobí jako límec na reálném displeji.
8. DotLoader: plynulost vlny a záře na zařízení, statická varianta s reduce motion.
9. Rive stub: build s odkomentovaným importem jen v dev buildu (Expo Go beze změny).
10. Nálada sad a `cosmetics` zatím nemají zdroj v appce (krok 4), vizuálně ověřit až tam.

## Doporučení (mimo skóre)
- `docs/SPEC.md` §7.1 (ř. 362) pořád říká, že `dreamBody` ukládá titulek karty; po R41 ukládá „Titulek. Řádek“. UX1 spec aktualizoval, R41 ne. Doporučuji sladit (boss).
- Glyf „half“ opticky sedí níž (UX1 otevřené, design).
