# Rating — Nothing Dot fáze 1 (db940b8..257aafb)

**Skóre: 15/100**

Ověřeno: `tsc --noEmit` 0 chyb, `jest` 59 sad / 535 testů OK, `eslint .` bez chyb. QA SCHVÁLENO v docs/LOG.md.

| Kategorie | Body | Stav |
|---|---|---|
| 1. Funkčnost | 0/25 | nesplněno |
| 2. Shoda se specifikací | 0/15 | nesplněno |
| 3. Architektura a kód | 0/15 | nesplněno |
| 4. Vizuální kvalita | 0/20 | nesplněno |
| 5. Motion | 15/15 | splněno |
| 6. Dokumentace | 0/10 | nesplněno |


## Nesplněná kritéria
1. Funkčnost
   - `docs/QA.md` se v rozsahu db940b8..257aafb vůbec neměnil: body fáze 1 Nothing Dot tam nejsou jako ✅ (QA zapsalo jen do LOG.md). — qa
2. Shoda se specifikací
   - Plán úkol 5 krok 5: dev obrazovka „Tečky“ (`app/dev.tsx`) nepřidána (LOG design-agent ji vede jako otevřenou, ne jako rozhodnutí). — design / boss
   - Popover uzlu a `NodeLabel` zůstaly Inter/Card místo tečkového jazyka (LOG design-agent, otevřené). — design
3. Architektura a kód
   - `components/map/Plate.tsx:23` komentář odkazuje na smazaný `GoldenFigure` (mrtvý odkaz). — boss
4. Vizuální kvalita
   - Oslava (`m-done-1300-dark.png`): rozpis XP se stále zalamuje uvnitř položky („streak“ / „+14“ na dalším řádku), přestože commit 257aafb tvrdí opak. — design
6. Dokumentace
   - Chybí záznam bosse v docs/LOG.md k fázi 1 (plán, integrace, smazání Barbell/XpPop/GoldenFigure, haptika CTA → light). — boss
   - README.md se nezměnil (nový font Doto, CanvasKit/`public/canvaskit.wasm`, `index.web.js`, tečkový systém nezdokumentovány). — boss

## K ruční kontrole
- Scroll mapy vs. roztočení kotouče prstem, tick haptika po 30°, success haptika při nacvaknutí.
- Plynulost Skia/Reanimated na zařízení, Doto s diakritikou, čitelnost `dotOff` v light.
- Dotykové plochy 44 pt u pilulek a tab baru na zařízení.

## Doporučení (mimo skóre)
- „Zítra: Boss: Plná osa“ — dvojtečka dvakrát za sebou.
