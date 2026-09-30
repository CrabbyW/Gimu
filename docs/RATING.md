# RATING — krok 2 (spec §12 kroky 1–2), kolo 1

Datum: 2026-09-30 · rating-agent · větev `faze1/core-loop` @ 2e80585
Rozsah: scaffolding, theme, typy, logika, onboarding, mapa lekcí, lekce, oslava dokončení, maskot stage 1. Body označené v `docs/QA.md` jako ⚠️ plán B se nepočítají jako chybějící.

## Skóre: 70/100

| # | Kategorie | Max | Body | Stav |
|---|---|---|---|---|
| 1 | Funkčnost | 25 | 25 | ✅ |
| 2 | Shoda se specifikací | 15 | 0 | ❌ |
| 3 | Architektura a kód | 15 | 0 | ❌ |
| 4 | Vizuální kvalita | 20 | 20 | ✅ |
| 5 | Motion | 15 | 15 | ✅ |
| 6 | Dokumentace | 10 | 10 | ✅ |

## Ověření

- `npm test`: 26 sad, 200/200 ✅
- `npx tsc --noEmit`: bez chyb ✅
- `npx expo lint`: exit 0 ✅
- `docs/QA.md`: verdikt SCHVÁLENO (kolo 2), všechny body kroků 1–2 ✅, zbytek ⚠️ plán B.

## Nesplněná kritéria

### 2. Shoda se specifikací (0/15)
Kritérium: nic navíc nebylo přidáno bez zápisu v `docs/LOG.md`.

1. **`theme/tokens.ts:2`**: `space.xs_plus: 6` je mimo spacing škálu ze spec §6.6 (`4 8 16 24 40 64 104`). Přidal to commit 77301b7 („design: poslední literály do theme“) kvůli `components/ui/DotSteps.tsx:40`. V `docs/LOG.md` k tomu není žádný zápis. Poslední zápis design-agenta naopak tvrdí, že `gap: 6` „ponecháno“. Ruling v `progress.md` taky chybí. **Vlastník: design** (zápis do LOG / rozhodnutí: boss).
2. **`theme/tokens.ts:3`**: `radius.xs: 2` je mimo radiusy ze spec §6.6 (8, 20, full). Zavedl ho stejný commit 77301b7 pro `components/lesson/Barbell.tsx:133` (objímka) a v LOG k tomu zápis není. **Vlastník: design** (zápis do LOG: boss).
3. **`theme/tokens.ts:3`**: `radius.m: 12` je mimo spec §6.6 a v `app/`, `components/` ani `hooks/` se nikde nepoužívá. Je to token navíc bez zápisu v LOG a zároveň mrtvý kód. **Vlastník: design**.

Oprava: tokeny buď sladit se spec (6 → 4 nebo 8, 2 → 0 nebo 8, 12 odstranit), nebo odchylku zapsat jako rozhodnutí (Ruling) do `docs/LOG.md` a případně do spec §6.6.

### 3. Architektura a kód (0/15)
Kritérium: hodnoty jen z `theme/`. Kritérium mrtvého kódu viz bod 2.3.

Rozměry dotykových ploch a prvků jsou v komponentách zapsané natvrdo místo tokenu v `theme/`. Minimum 44 pt ze spec §6.6 je navíc zduplikované ve třech souborech:
1. `components/lesson/LessonProgress.tsx:10`: `const HIT = 44`
2. `components/map/NodePopover.tsx:18`: `const CLOSE_HIT = 44`
3. `components/map/PlateNode.tsx:19`: `const MIN_HIT = 56`
4. `components/onboarding/MilestoneChip.tsx:43`: `minHeight: 44`
5. `components/onboarding/PathCard.tsx:32`: `minHeight: 120`
6. `components/ui/BigActionBar.tsx:28,36`: `minHeight: 96`
7. `components/ui/Button.tsx:34`: `minHeight: 56`
8. `components/ui/SegmentedControl.tsx:37`: `minHeight: 48`
9. `components/ui/TextField.tsx:33`: `minHeight: 48`
10. `components/ui/TopBar.tsx:52`: `height: 32`
11. `theme/tokens.ts:3`: nepoužívaný `radius.m` (mrtvý kód, viz 2.3)

**Vlastník: design** (primitiva a obrazovky). Oprava: přidat do `theme/tokens.ts` např. `size = { hit: 44, control: 48, button: 56, … }` a tyto literály nahradit.

Poznámka: souřadnice uvnitř SVG viewBoxu (maskot, kotouče, osa, BarbellBoss) jsou geometrie kresby, ne designové tokeny, a za chybu je nepočítám. Animační konstanty v `lib/motion.ts` jsou v pořádku. `any` v kódu není. Všechny TODO odkazují na fázi (`services/contracts.ts:43,49`, `hooks/useServiceQuery.ts:20`, `store/migrate.ts:42`). Data jdou přes `services/` a logika je v `logic/`: grep na `@/data/*` mimo `copy` (R1) i na přímý AsyncStorage v UI je čistý.

## Splněné kategorie (stručně)

- **Funkčnost**: SCHVÁLENO, 200 testů, tsc a lint čisté, všechny body kroků 1–2 ✅.
- **Vizuál**: snímky `qa-r2` a `step2-design-r3` (light i dark) ukazují estetiku Chalk & Ember. Kotouče, činka, display číslice a mono štítky působí jako gym kultura, ne generický fitness. Je tu jasná hierarchie a všechny stavy: zamčený (`dark-06-locked`), dokončený, aktuální, chyba (`ErrorState`) a prázdný/načítání. Kontrast AA hlídá test (R12, R14, R24) a dotykové plochy jsou ≥ 44 pt.
- **Motion**: oslava podle spec §7.3 a §6.7 (pád, `seat` pružina, Heavy + click při dopadu, +XP pop, opice + Success) a odemčení uzlu s Light. Reduce motion má variantu všude. Blokace CTA na ~1,6 s je rozhodnutí R29. Animace běží na UI vlákně a stav se ukládá před nimi.
- **Dokumentace**: v LOG jsou zápisy boss, design, motion i qa a README je aktuální.

## K ruční kontrole (na zařízení, bez vlivu na skóre)

1. Zvuk `click` při dopadu kotouče. V tichém režimu iOS musí mlčet a cizí hudbu nesmí přerušit.
2. Haptika: Heavy při dopadu, Success u opice (+420 ms), Light při odemčení uzlu, Medium na konci výdrže a Success při zrození.
3. Hardwarové Zpět na Androidu: v lekci otevře dialog ukončení, na zrození je blokované (R21).
4. Deep link na zamčenou lekci (ErrorState) a na `/onboarding/path` s existujícím profilem (redirect bez probliknutí formuláře).
5. Plynulost pružin (`seat`, `rattle`, `hop`, `unlock`) na reálném zařízení a chování s reduce motion zapnutým v systému.
6. Odpočet výdrže při přechodu aplikace na pozadí a zpět (pauza).
7. Čitelnost kotoučů a štítků na mapě na malém displeji a v light režimu na slunci.

## Doporučení (mimo skóre)

- Rubrika nemá explicitní kritérium pro velikostní tokeny (rozměry prvků). Doporučuji ho v CLAUDE.md rozšířit na „barvy, fonty, spacing, radiusy a rozměry“, aby se to v dalších krocích nepletlo.
- `docs/QA.md` označuje README jako ⚠️ plán B, přitom README je teď aktuální. Při příští QA ho stačí přepnout na ✅.
