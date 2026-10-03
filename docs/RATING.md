# Rating R43 (Chalk & Iron + φ geometrie + GoldenFigure), kolo 2

**Skóre: 100/100** (BOSS 100, DESIGN 100)

Ověřeno: tsc 0 chyb, jest 396/396, expo lint bez chyb, QA SCHVÁLENO.

| Kategorie | Body |
|---|---|
| Funkčnost | 25/25 |
| Shoda se specifikací | 15/15 |
| Architektura a kód | 15/15 |
| Vizuální kvalita | 20/20 |
| Motion | 15/15 |
| Dokumentace | 10/10 |

Srážky z kola 1 opraveny: `stroke.plate/check/hairline` v `theme/tokens.ts`, žádné číselné `strokeWidth` v `Plate.tsx` ani `components/lesson/*`, `HAIRLINE` odstraněn, README bez „ember“, záznam boss R43 v `docs/LOG.md`.

## K ruční kontrole (nestrženo)
- Figura na 375×667 / 390×844 nesahá do titulku; čitelnost linek `c.rule` v dark i light.
- Android: plátno figury s negativním odsazením bez ořezu.
- Kotouč 25 kg: číslo na účaří 29 se nedotýká lemu ani náboje.
- Reduce motion: figura jen prolne.
- Haptika dopadu na zařízení.

---

# R44 · UX/pocit

**Skóre: 75/100**

| Kategorie | Body | Stav |
|---|---|---|
| 1. Funkčnost | 25/25 | QA R44 kolo 1 + 2 SCHVÁLENO, jest 51/51 sad (458 testů), tsc a lint bez chyb |
| 2. Shoda se specifikací | 0/15 | nesplněno |
| 3. Architektura a kód | 15/15 | žádné `any`, TODO jen s fází, bez hardcoded barev mimo test |
| 4. Vizuální kvalita | 20/20 | čteno z kódu, zbytek v sekci K ruční kontrole |
| 5. Motion | 15/15 | oslava, vtlačení, shake, reduce motion (6 souborů), AHAP |
| 6. Dokumentace | 0/10 | nesplněno |

## Nesplněná kritéria

### 2. Shoda se specifikací (0/15)
1. Opička na kotouči: spec Teplá litina (`docs/superpowers/specs/2026-10-03-tepla-litina-redesign-design.md:186-187`) chce vrstvy `MonkeyBack`/`MonkeyFront` a šál. Neexistují. Opička je jedna vrstva nad kotoučem (LOG.md, design-agent část A, „Otevřené“). Patří: **design**.
2. Jantarová hrana šálu při každé oslavě (spec ř. 318, motion spec): bez šálu ji nejde vykreslit ani animovat (LOG.md, motion-agent MVP, „Otevřené“). Patří: **design + motion**.
3. Mřížka aktivity „dnes hotovo“ (spec ř. 274): `GridCell` nezná stav dneška, takže se dnešek vždy kreslí prstencem a odcvičený dnešek se nerozliší (LOG.md, design-agent část B). Patří: **boss** (logic/progress) + **design**.
4. Text připomínky: `services/mock/LocalNotificationService.ts:33` volá `copy.notifications.reminder(streakNow())` bez minut. Při sérii 0 tak chybí „Stačí N minut“ z původního zadání (připomínka). Patří: **boss**.
5. Hlavička ligy je pořád původní (Stat/Telemetry) a TierBadge má 72 místo 56 ze specifikace (LOG.md, design-agent část B). Patří: **design**.

Zápis „otevřené“ v LOG.md odchylku od specifikace neomlouvá. Kritérium „nic ze specifikace nechybí“ zůstává nesplněné.

### 6. Dokumentace (0/10)
1. `README.md` se v rozsahu 9901140..HEAD nezměnil. Chybí v něm přeskočení cviku s adaptivním dluhem (5 lekcí, stropy, lekce se počítá od poloviny), krok připomínky v onboardingu, zamčená liga do 1. lekce a nastavení haptiky a zvuku. Patří: **boss**.

## K ruční kontrole (bez srážky bodů)
- Odezva tlačítek pod 100 ms a „těžký“ pocit pružin na zařízení.
- AHAP haptika na fyzickém iPhonu, ducking hudby.
- Kontrast AA jantaru (`accentGraphic`) na tmavém povrchu v reálném zobrazení, štítky uzlů při velkém Dynamic Type (možný překryv, LOG design A).
- Zamčená liga (přelom týdne, dev-xp), stavy StreakBarbell (×K, čeká, přerušený).
- Neořezaný titulek „Trénink“ na úzkých zařízeních.

## Doporučení (mimo skóre)
- Rubrika neměří „okamžitou odměnu“ a latenci jako samostatné kritérium. Pro UX kroky by stálo za to přidat měřitelný test (např. čas od ťuknutí po haptiku).

---

# R44 · kód/spec

**Skóre: 75/100** (commity 9901140..HEAD)

| Kategorie | Body | Stav |
|---|---|---|
| 1. Funkčnost | 25/25 | QA R44 kolo 1 a 2 SCHVÁLENO; jest 51 sad / 458 testů zelených; tsc 0 chyb; ESLint na souborech kroku 0 chyb (11 warnings) |
| 2. Shoda se specifikací | 15/15 | odchylky (přeskočení s dluhem, motion kolo 2) zapsané v LOG |
| 3. Architektura a kód | 0/15 | hodnoty mimo theme/, mrtvý kód |
| 4. Vizuální kvalita | 20/20 | z pohledu kódu: tokeny, stavy (zamčená liga, prázdné, chyba) přítomné |
| 5. Motion | 15/15 | MVP §9 implementováno, reduce motion větve, haptika přes lib/feedback (holdDone, haptics.tick používané) |
| 6. Dokumentace | 0/10 | README/STATUS neaktualizované |

## Nesplněná kritéria
### 3. Architektura a kód
- `components/map/PlateNode.tsx:25`: `const BREATH = { low: 0.6, scale: 1.03, still: 0.8 }` – lokální konstanta pohybu, ne z `theme/`. **motion**
- `components/map/BarbellBoss.tsx:103`: natvrdo `opacity: 0.8`, `0.4`, `0.03` (duplikát hodnot dechu, ne z theme). **motion**
- `data/copy.ts:206` `milestoneBinaryTitle`, `data/copy.ts:207` `milestoneSheetTitle`, `data/copy.ts:280` `daysLeftUnit` – přidané v R44, nikde nepoužité (mrtvý kód). **design**
### 6. Dokumentace
- `README.md` ani `docs/STATUS.md` (na který README v sekci „Stav“ odkazuje) nebyly v 9901140..HEAD změněny; chybí Teplá litina, přeskočení cviku s adaptivním dluhem, nastavení haptiky/zvuku, zamčená liga. **boss**
- LOG záznamy design/motion/qa/boss jsou kompletní (to je OK).

## K ruční kontrole
- Pocit dechu uzlu/bosse a AHAP vzorů na iOS zařízení.

## Doporučení (mimo skóre)
- `npx eslint .` hlásí 50 chyb, všechny v neverzované složce `.agents/skills/...` (Remotion ukázky). Přidat `.agents` do ignore v ESLint configu, ať je `lint` čistý i bez filtru.
- `components/ui/StreakBarbell.tsx:36-37` geometrie SVG je v komponentě; zvážit přesun do theme (není jednoznačně porušení).

---

# R44 · UX/pocit · kolo 2

**Skóre: 100/100** (commity 9ce438e..HEAD: 3114fac, cc4eb6c, cba5eef)

| Kategorie | Body | Stav |
|---|---|---|
| 1. Funkčnost | 25/25 | QA kolo 3 SCHVÁLENO; jest 51 sad / 466 testů zelených; tsc 0 chyb; eslint 0 chyb |
| 2. Shoda se specifikací | 15/15 | všech 5 nálezů z kola 1 opraveno (viz níže) |
| 3. Architektura a kód | 15/15 | pohybové konstanty přesunuté do lib/motion, mrtvé texty odstraněné |
| 4. Vizuální kvalita | 20/20 | dnešek v mřížce rozlišený, hlavička ligy s TierBadge 56 (`size.tierBadge`) |
| 5. Motion | 15/15 | jantarová hrana šálu v oslavě (`scarfEdge` v LessonCompleteScene.tsx:283) |
| 6. Dokumentace | 10/10 | README, docs/STATUS.md a LOG.md aktualizované |

## Ověřené opravy z kola 1
1. MonkeyBack/MonkeyFront se šálem: components/mascot/index.tsx, SvgMascot.tsx, použití v LessonMap.tsx, test v SvgMascot.test.tsx.
2. Jantarová hrana šálu: `scarfEdge={mood === cheer}` v LessonCompleteScene.
3. Dnešek v mřížce: `todayDone` v components/progress/ActivityGrid.tsx (plná tečka s prstencem), počet aktivních dní ho započítá.
4. Minuty v připomínce: LocalNotificationService.ts:51 volá `reminder(streakNow(), nextLessonMinutes())`.
5. Hlavička ligy: TierBadge 56 pt přes `size.tierBadge`, původní Stat/Telemetry v app/(tabs)/league.tsx už nejsou.
6. README a STATUS doplněné.

## K ruční kontrole (bez srážky bodů)
- Vrstvení MonkeyBack/kotouč/MonkeyFront a šál na zařízení, viditelnost jantarové hrany při oslavě.
- Haptika AHAP, odezva pod 100 ms, pocit pružin, reduce motion na zařízení.
- Kontrast AA jantaru na tmavém povrchu, velký Dynamic Type u štítků uzlů.

## Doporučení (mimo skóre)
- Stav dneška se skládá ve view (`todayDone` prop) místo v `logic/progress.activityGrid`. Funguje to, ale čistší by byl stav `'todayDone'` přímo v GridCell.

# R44 · kód/spec · kolo 2

**Skóre: 100/100** (commity 9ce438e..HEAD: 3114fac, cc4eb6c, cba5eef)

| Kategorie | Body | Stav |
|---|---|---|
| 1. Funkčnost | 25/25 | QA kolo 3 SCHVÁLENO; jest 51 sad / 466 testů zelených; `tsc --noEmit` 0 chyb; `npx eslint .` 0 chyb, 0 varování |
| 2. Shoda se specifikací | 15/15 | změny kola 2 zapsané v LOG |
| 3. Architektura a kód | 15/15 | PlateNode `BREATH = motion.breath` (lib/motion), BarbellBoss bez natvrdo opacit; mrtvé copy klíče odstraněny (0 výskytů); TODO jen s fází; žádné `any` |
| 4. Vizuální kvalita | 20/20 | beze změny oproti kolu 1 (kód) |
| 5. Motion | 15/15 | konstanty pohybu centralizované, reduce motion větve zachované |
| 6. Dokumentace | 10/10 | README (+21 ř.), docs/STATUS.md (+13 ř.), LOG (+23 ř.) aktualizované |

## Nesplněná kritéria
Žádná.

## K ruční kontrole
- Pocit dechu uzlu/bosse a AHAP vzorů na iOS zařízení.
