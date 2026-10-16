# Opice: o 10 % lepší než konkurence

Datum: 2026-10-16 · Autor: boss · Stav: návrh, čeká na schválení uživatelem

## Proč

Rychlá rešerše konkurence (2026-10-16, popisy z webů a App Store, appky jsme nezkoušeli):

| Appka | Co má | Co nemá |
|---|---|---|
| Sport Is My Game | kalistenika, „Duolingo“ pozice, staty těla, dungeony, questy | maskota |
| Fito | maskot (medvěd, 50+ animací, zlobí se při vynechání), streaky | kalisteniku, je obecný fitness |
| ELYS Calisthenics | RPG, XP | maskota, lekce |
| Level Up, Lever, Calistack, Ascend, SkillTrees, Workout Log | skill-tree, benchmarky, AI plány | hru a emoce |

Skill-tree a XP jsou standard. Maskot s náladami už má Fito. Volné místo je spojení obojího:
**kalistenika, kde maskot viditelně roste podle toho, co opravdu cvičíš.** Tím má být Opice
o 10 % lepší. Ne víc funkcí, ale jasnější emoce v pěti momentech.

Ověřit před krokem 4: recenze konkurentů (co uživatelům vadí), ceny, počty stažení. Slabiny výše
jsou zatím odhad.

## Pět pák

Každá páka je malá úprava nad plánem B (kroky 4–6), ne nový modul. Vazba na tasky plánu B
je v závorce.

### P1. Opice ukazuje, co cvičíš (Task 26 stage-up, Task 27 progres)
- Dnes roste opice podle celkového XP (stage 1–3). Nově si `logic/` pamatuje i rozložení XP
  podle skupin (tah, tlak, střed, nohy), pak se jemně zesílí příslušné partie (paže, ramena, střed).
- Jen v rámci geometrie stage, žádné nové stage. Data přes `services/`, výpočet v `logic/progress`.
- Rozhodnutí pro uživatele: chceme to už ve fázi 1, nebo až s Rive?

### P2. Dokončení lekce jako vrchol dne (krok 3 hotový, doladit v Task 26)
- Kotouč a opice už jsou. Doplnit: druhý kotouč na ose po druhé lekci dne (osa se viditelně plní),
  jasný sdílitelný snímek po dokončení (kotouč, opice, číslo lekce).
- Podle CLAUDE.md projde zvlášť pečlivě design, motion, QA i rating.

### P3. Laskavý streak (Task 19 streak rollover, Task 22 comeback)
- Den odpočinku se streaku nezapočítává jako výpadek, pokud ho uživatel naplánoval (max. 2 týdně).
- Opice v den odpočinku není smutná, ale odpočívá (nálada `idle` s vlastní větou v `data/copy.ts`).
- Fito trestá, my chráníme tělo. To je odlišení, které jde říct jednou větou.
- Rozhodnutí pro uživatele: limit dnů odpočinku a jestli se plánují dopředu.

### P4. První lekce do dvou minut (onboarding, krok 1–3)
- Dnes má onboarding čtyři kroky (cesta, vize, milníky, váha). Nová varianta: po výběru cesty
  rovnou první lekce, vize a milníky až po prvním kotouči („teď víš, co tě čeká“).
- Měřítko: od prvního otevření k nacvaknutí kotouče do 120 s v QA flow.
- Bez registrace (sedí se SPEC, účty jsou mimo rozsah).

### P5. Jedna věc, kterou nikdo nemá: recap opice (Task 25)
- Recap sezóny už je v plánu B. Rozšířit ho o krátké video nebo animaci „tvoje opice za sezónu“
  (stage na začátku a na konci, počet kotoučů), připravené ke sdílení.
- Motion na to máme z kroku 3 (UX2, tón cinematic). Pro export videa ověřit, co jde v Expo Go.

## Pořadí

1. P3 a P4 (malé, mění retenci hned) do kroku 4 vedle ligy a progresu.
2. P1 a P2 do Task 26 a 27.
3. P5 do Task 25.

Workflow beze změny: boss základ (logic, services, typy), design-agent, motion-agent, qa-agent,
rating-agent 100/100.

## K rozhodnutí uživatelem
- P1: už ve fázi 1, nebo až s Rive?
- P3: kolik dnů odpočinku týdně a jestli se plánují.
- P4: přesunout vizi a milníky až za první lekci?
