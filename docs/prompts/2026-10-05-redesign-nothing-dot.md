# Giga prompt: Redesign „Nothing Dot“ + Widget Tiles + motion

> Vstup pro `/superpowers:brainstorming`. Zdroj: rozhovor 2026-10-05. Reference v `images/1.png`–`images/5.png`.

## Kontext
Gamifikovaná kalistenika s maskotem opice (Expo / React Native, expo-router, Reanimated). Specifikace `docs/SPEC.md`, tým agentů a workflow v `CLAUDE.md`. Aktuální směr „Teplá litina / Chalk & Iron“ (teplá hnědočerná, jantarový akcent, litinové kotouče se zrnem) uživatel po polish kole hodnotí: **„pořád to vypadá hrozně“**. Chce **redesign s wow efektem**.

## Rozhodnuto uživatelem
1. **Hlavní směr: Nothing Dot** (jazyk Nothing OS, obr. 1 a 3)
   - čistá čerň (ne #000, např. #0B0B0C), bílá, šedé stupně
   - dot-matrix display písmo (např. Doto / Ndot styl) na čísla a hlavní nadpisy
   - mono utility štítky VERZÁLKAMI se širokým prostrkáním, akce v hranatých závorkách `[ZAČÍT]`, `[POKRAČOVAT]`
   - grafika skládaná z teček: kotouč, progres, prstence (obr. 3 – tečkový kruh s plnějším vnitřním prstencem), mřížky
   - bílé pilulkové primární CTA přes celou šířku dole (obr. 1), sekundární tlačítka tmavé pilulky
   - stavový řádek nahoře: štítek vlevo, živý údaj vpravo s tečkou (obr. 1 „INTERSTELLAR ● 00:30“)
2. **Prvky Widget Tiles** (obr. 2 a 5)
   - zaoblené dlaždice (velký radius) na černé, jemná světelná hrana, žádné těžké stíny
   - velká čísla s malou jednotkou („200 lbs“ → „20 kg“, „3/8 lekcí“)
   - zářící bílé tečky v mřížkách aktivity (glow na aktivních, tlumené neaktivní)
   - tečkový řádek progresu (obr. 5 „Day 67 %“ – plné vs. zhasnuté tečky)
   - kulaté ikonové tlačítka v hlavičce, plovoucí tab bar jako pilulka
3. **Maskot: zůstává dnešní barevná opička** (s šálem, náladami, animacemi) jako **jediný barevný prvek** v monochromním světě — je subjektem každé obrazovky, kde je.
4. **Víc pohybu, animace obecně** — appka má působit živě. Viz sekce Motion.
5. **Akcent: žádný.** Primární CTA, progres a aktivní tečky = zářivá bílá. Jedinou barvu v UI nese opička.
6. **Dark i light, oba plnohodnotné.** Light = papírově bílá s černými tečkami (obr. 3), volba v Nastavení. Bez akcentu: v light je „aktivní“ = sytá čerň.
7. **Kotouč = tečkový** (soustředné prstence teček, hustota/počet prstenců = kg, číslo kg dot-matrix). **Pomalu se otáčí** (ambientně, stále). Zamčený = tlumené obrysové tečky, aktuální = svítí, dokončený = plný a zářící. Dokončení lekce = kotouč se poskládá z teček.
8. **„Celá appka musí být interaktivní“** — prvky reagují na dotek, ne jen na tap:
   - **Tečky reagují na dotek** — pod prstem se rozsvítí / rozvlní (mřížky, kotouč, pozadí).
   - **Fyzická manipulace** — kotouč jde roztočit prstem (setrvačnost, návrat do pomalé rotace), dlaždice se při stisku 3D naklopí.
   - **Opička reaguje** — cca 15 reakcí (ťuknutí, sledování prstu očima, reakce na scroll, na dokončení, na sérii…).
   - Gyroskop a gesta místo tlačítek: NE.
9. **Priorita: animace a design jsou klíčové.** Wow > úspornost.

## Cíle (úspěch)
- První dojem „wow, to je prémiový produkt“ (úroveň Nothing OS / Apple widget), ne hobby appka.
- Konzistentní systém: každá obrazovka mluví stejným jazykem teček, dlaždic a mono štítků.
- Pohyb nese stav (tečky se rozsvěcují = pokrok), není dekorace.

## Motion (požadavek „více animací“)
- **Tečkové animace jako podpis:** tečky se rozsvěcují postupně (scan / wave) při nástupu dat, počítání čísel tečka po tečce, progres se „nabíjí“.
- **Orchestrovaný nástup každé obrazovky** (hlavička → hero → dlaždice ve vlně), 400–600 ms, ease-out `cubic-bezier(0.22,1,0.36,1)`.
- **Mikrointerakce:** stisk dlaždice/tlačítka (scale + rozjasnění hrany), přepnutí tabu (pilulka klouže), haptika na klíčových místech.
- **Dokončení lekce (kotouč + opice)** = hlavní wow moment: tečkový kotouč se poskládá z teček, nacvakne, opička slaví, tečky prší / pulzují. Musí projít všemi agenty obzvlášť pečlivě (CLAUDE.md).
- **Ambientní život:** živý údaj ve stavovém řádku (tečka bliká), jemné „dýchání“ aktivního uzlu, opička idle animace.
- Pravidla: žádný bounce/spring na klikatelném, Reduce Motion vždy (fallback = prolnutí), hodnoty jen v `lib/motion.ts`, 60 fps na středním Androidu.

## Rozsah
- Všechny obrazovky: onboarding, mapa (Trénink), lekce + dokončení, stage-up, liga, progres, sezóna, profil + šatník, nastavení + cíle.
- Přepsat `docs/SPEC.md` §6 (design systém), §6.7 (motion) a dotčené části §7; `theme/` (palety, tokeny, typografie, fonty), UI komponenty, grafika kotoučů.
- Beze změny: herní logika `logic/`, `services/`, data, navigace, maskot (vzhled).

## Otevřené otázky pro brainstorming
1. Akcent: jeden signální (Nothing červená ~#D71921?) vs. žádný (jen bílá, barvu nese opička). Pozor: opička má šál a barvy, akcent s ní nesmí soupeřit.
2. Světlý režim: zrušit (jen dark, jako Nothing), nebo zachovat (obr. 3 je světlý)?
3. Dot-matrix písmo: jen čísla a hero, nebo i nadpisy? Licence (Doto = OFL, Google Fonts).
4. Kotouče: tečkový kruh (obr. 3) místo litiny — jak zachovat čitelnost kg a barevné kódování váhy (SPEC §6.5) bez barev? (tečková hustota / počet prstenců?)
5. Mapa lekcí: jak vypadá cesta a uzly v tečkovém jazyce?
6. Sezónní override (`theme/seasons.ts`): co s ním v monochromu?
7. Výkon: stovky animovaných teček (SVG vs. Skia?) — technický spike.
8. Pořadí: celý systém najednou, nebo nejdřív design system + 1 vlajková obrazovka (mapa + dokončení lekce) jako ověření, pak zbytek?

## Omezení
- Tokeny jen z `theme/`, data přes `services/`, logika v `logic/` (CLAUDE.md).
- Skill `aesthetic` (Never list), ikonky Lucide outline 1.5 px, žádné gradienty mimo hloubku, žádný čistý #000/#FFF.
- Reálná česká copy, žádné placeholdery ani vymyšlená telemetrie.
- Workflow: boss → design-agent → motion-agent → qa-agent → rating-agent (100/100).
