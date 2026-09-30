# RATING: krok 3 (spec §12 krok 3 + DotLoader + UX1 + UX2 + opravy 0d24483), kolo 2

Datum: 2026-09-30 · rating-agent · větev `faze1/core-loop` @ 1c5d772 (kód beze změny od 0d24483)
Rozsah: maskot stage 2–3, nálady celebrate a sad, kotvy, kosmetika, Rive stub, DotLoader (požadavek uživatele), UX1 (R36/R37), UX2 (R38–R40), opravy 0d24483 (R41). Kroky 1–2 jen regrese. Body, které `docs/QA.md` značí ⚠️ plán B, se nepočítají jako chybějící.

## Skóre: 100/100

| # | Kategorie | Max | Body | Stav |
|---|---|---|---|---|
| 1 | Funkčnost | 25 | 25 | ✅ |
| 2 | Shoda se specifikací | 15 | 15 | ✅ |
| 3 | Architektura a kód | 15 | 15 | ✅ |
| 4 | Vizuální kvalita | 20 | 20 | ✅ |
| 5 | Motion | 15 | 15 | ✅ |
| 6 | Dokumentace | 10 | 10 | ✅ |

## Ověření
- `npm test`: 34 sad, 261/261 ✅
- `npx tsc --noEmit`: bez chyb ✅
- `npx expo lint`: exit 0 ✅
- `docs/QA.md`: gate A3, SCHVÁLENO; pokrývá hodnocený stav kódu (0d24483 znovu ověřen, po něm jen commity dokumentace).

## Nesplněná kritéria
Žádná.

## Stav nálezů z kola 1
- **1.1 (qa)** opraveno: `docs/QA.md` A3 má jednu tabulku se všemi body §12 kroku 3 (stage 2 a 3, prahy 500/2000, celebrate, sad, kotvy, kosmetika, Rive stub, DotLoader) i UX1/UX2, vše ✅ nebo ⚠️ plán B.
- **1.2 (qa)** opraveno: sekce R41 v `docs/QA.md` ověřuje 0d24483 (trojklik, jeden poskok, věta vize a obnova výběru, vlastní text).
- **6.1 (boss)** opraveno: `README.md` sekce „Stav“ uvádí krok 3, DotLoader, UX1, UX2 a další plán B.

## Splněné kategorie (stručně)
- **Funkčnost:** SCHVÁLENO A3, testy/tsc/lint čisté, všechny body kroku ✅ v QA.md.
- **Shoda se specifikací:** body §12 kroku 3 implementované; přídavky (DotLoader R34, UX1 R36/R37, UX2 R38–R40, R41) zapsané v `docs/LOG.md`; SPEC §7.1 teď odpovídá R41.
- **Architektura:** žádné `any`, TODO jen s fází, hex jen v komentáři `components/mascot/palette.ts` a testech, logika vize v `logic/onboarding.ts`, motion parametry v `lib/motion.ts`.
- **Vizuál / motion:** beze změny kódu proti kolu 1, hodnocení stejné (konzistence).
- **Dokumentace:** LOG záznamy od design, motion, qa i boss; README aktuální.

## K ruční kontrole (bez srážky bodů)
1. Zvuky `plate-snap`, `select`, `unlock` na iOS a Androidu (hlasitost, `playsInSilentMode: false`, mix s hudbou).
2. Délky nativních stack přechodů (kořen fade 250 ms, lekce slide_from_bottom 350 ms, zrození fade 300 ms), na webu neověřitelné.
3. Haptika (tick u výběru vize, Light u odemčení, Medium na konci výdrže, oslava) na zařízení.
4. Count-up +XP běží na JS (rAF): plynulost na slabším Androidu při zátěži.
5. Jeden poskok opice na mapě po odemčení a poskok celebrate bez propadu pod klid, na zařízení.
6. Kontrast šály Winter Arc (`SEASON_MATERIAL.winterArc`) v dark režimu na zařízení.
7. Stage 3 deltoidy a trapéz: nepůsobí jako límec na reálném displeji.
8. DotLoader: plynulost vlny a záře na zařízení, statická varianta s reduce motion.
9. Rive stub: build s odkomentovaným importem jen v dev buildu (Expo Go beze změny).
10. Nálada sad a `cosmetics` zatím nemají zdroj v appce (krok 4), vizuálně ověřit až tam.

## Doporučení (mimo skóre)
- `docs/QA.md` sekce „Otevřené“ ještě uvádí SPEC §7.1 a README jako otevřené, ale db69d21 je už opravil; a věta „appka beze změny krom oprav popsaných níže“ odkazuje na opravy, které A3 nedělal. Sladit při příštím gate (qa).
- K commitu db69d21 (README, SPEC) není samostatný záznam boss v `docs/LOG.md`; doporučuji doplnit (boss).
- Glyf „half“ opticky sedí níž (UX1 otevřené, design).
