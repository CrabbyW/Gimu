# Rating: Nothing Dot fáze 2 (14787b4..37b0f5b)

**Skóre: 65/100**

Ověřeno: `tsc --noEmit` 0 chyb, `jest` 62 sad / 552 testů zelených, `eslint .` 0 chyb.

| Kategorie | Body | Stav |
|---|---|---|
| 1. Funkčnost | 0/25 | nesplněno |
| 2. Shoda se specifikací | 15/15 | splněno |
| 3. Architektura a kód | 15/15 | splněno |
| 4. Vizuální kvalita | 20/20 | splněno |
| 5. Motion | 15/15 | splněno |
| 6. Dokumentace | 0/10 | nesplněno |

## 1. Funkčnost (0/25)
- `docs/QA.md` (sekce fáze 2, ř. 1–38): QA hodnotila jen 14787b4..071733b. T3 Liga je pořád „✅ … ⚠️ viz N1“ a N1/N2 jsou pořád ⚠️. Nejsou zapsané jako OPRAVENO ani ověřené. Body specifikace tedy nejsou všechny ✅. **qa**
- Commit 37b0f5b přišel po verdiktu SCHVÁLENO a mění sdílené komponenty (`PillButton`, `RoundCta`, `BigActionBar` mají nový režim `onGold`, `app/(tabs)/league.tsx` přeskládává pořadí bloků, `theme/palettes.ts` má nový token `onGoldPill`). QA tyto změny znovu neověřila: chybí snímek ligy a stage-up v obou režimech a kontrola, že ostatní CTA nezměnila vzhled. Na aktuálním HEAD tedy SCHVÁLENO není. **qa** (spustit ověření má **boss**)

## 6. Dokumentace (0/10)
- `docs/LOG.md`: chybí záznam bosse za fázi 2. Boss napsal plán (c5fa195, db4aa19), rozpočet Skia pláten na webu (93e3b9e, `components/dots/canvasBudget.ts`), čistou logiku (d10db82, `podiumLayout`, `progress/layout`) a přepis SPEC §6–7 (071733b). Poslední záznam bosse je „Nothing Dot fáze 1“ (ř. 674). Zápisy design, motion a qa existují. README je aktuální. **boss**

## Co je splněno (pro konzistenci příštích kol)
- Shoda: úkoly 1–10 z plánu jsou pokryté. Přidané věci (DotBurst, `onGold`, `onGoldPill`, `from="bottom"`, tokeny `dots.*` a `size.*`) jsou zapsané v LOG.
- Architektura: v diffu nejsou `any` ani hex hodnoty mimo `theme/`, spacing a typografie jdou z tokenů. Jediné nové TODO má fázi (`season-recap.tsx:34`). Čistá geometrie a layout (`podiumLayout`, `canvasBudget`, `dotGlyph`) leží v `components/`, stejně jako `dots/geometry.ts` ve fázi 1. Nejde o herní logiku, takže to hodnotím stejně jako ve fázi 1.
- Vizuál: tečkový jazyk drží ve všech obrazovkách a v obou režimech. Stavy jsou navržené: prázdné pódium, zhasnutá aktivita, zamčená odměna, chyba cílů. Kontrast CTA na zlaté pokrývá test. Dotykové plochy mají 44 pt nebo `size.pill` 56.
- Motion: nástupy jdou přes `Reveal` (žádné layout `entering`), pružiny (`motion.pop`, `motion.settle`), haptika při výběru a dosažení. Reduce motion je ošetřený v 6 souborech fáze 2. Interakce neblokuje.

## K ruční kontrole (bez srážky)
- Stage-up na zařízení: CTA `onGold` v light i dark, viditelnost staré opičky v prvním snímku.
- Plynulost RingShatter a DotBurst na slabém Androidu.
- Scroll ligy k vlastnímu řádku za 2. obrazovkou (demo profil ho nespustí).
- Podstavec profilu na 320 pt, hero sezóny na 360 pt.

## Doporučení (mimo skóre)
- `app/stage-up.tsx:98` `withTiming(1, { duration: 1 })` je okamžitý přepínač. Čistší je přiřazení hodnoty nebo pojmenovaná konstanta v `lib/motion`.
- Rubrika neříká, jestli commity po verdiktu QA vyžadují nové QA. Doporučuji to tam výslovně doplnit.

## Cesta ke 100/100
1. qa: ověřit 37b0f5b (liga 320 a 390, stage-up light a dark, ostatní CTA beze změny), v `docs/QA.md` označit N1–N3 jako OPRAVENO, T3 bez ⚠️, verdikt pro HEAD, zápis v LOG.
2. boss: zápis do `docs/LOG.md` za fázi 2 (plán, canvasBudget, logika, SPEC §6–7, vlastní rozhodnutí, co zůstává otevřené).
