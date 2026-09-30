# RATING — krok 2 (spec §12 kroky 1–2), kolo 2

Datum: 2026-09-30 · rating-agent · větev `faze1/core-loop` @ b6bd977
Rozsah: scaffolding, theme, typy, logika, onboarding, mapa lekcí, lekce, oslava dokončení, maskot stage 1. Body označené v `docs/QA.md` jako ⚠️ plán B se nepočítají jako chybějící. Hodnoceno znovu od nuly podle rubriky.

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

- `npm test`: 26 sad, 200/200 ✅
- `npx tsc --noEmit`: bez chyb ✅
- `npx expo lint`: exit 0 ✅
- `docs/QA.md`: verdikt SCHVÁLENO (kolo 3), všechny body kroků 1–2 ✅, zbytek ⚠️ plán B.

## Nesplněná kritéria

Žádná.

## Uzavření nálezů z kola 1

- **2.1 `space.xs_plus` (6)**: odstraněn, `DotSteps` používá `space.s` (8). `space` teď přesně odpovídá spec §6.6. Zápis je v LOG (design-agent, rating oprava kolo 1).
- **2.2 `radius.xs` (2)**: odstraněn z `radius` a přesunut do `material.collarRadius`. Ruling „geometrie materiálu činky není UI radius §6.6“ je v LOG a odkazuje na něj komentář v `theme/tokens.ts`. `radius` = `{ s: 8, l: 20, full: 999 }` podle spec.
- **2.3 / 3.11 `radius.m`**: odstraněn. Grep na `radius.m`, `radius.xs` a `xs_plus` je čistý.
- **3.1–3.10 rozměrové literály**: nahrazeny tokeny `theme/tokens.ts` → `size` (exportováno přes `theme/index.ts` a `Theme.size`). Každý token se používá (hit 4×, hitLarge 3×, control 2×, actionBar 2×, pathCard 1×, topBarBadge 1×, collarRadius 1×), takže nic není mrtvý kód. Grep na číselné `width/height/minHeight/gap/padding/margin/borderRadius/fontSize` v `app/`, `components/` a `hooks/` nic nenašel. Hex barvy se vyskytují jen v komentáři a testu.
- `any` v kódu není. Všechna TODO odkazují na fázi (`hooks/useServiceQuery.ts:20`, `services/contracts.ts:43,49`, `store/migrate.ts:42`). Data jdou přes `services/` a logika je v `logic/`, tady se od kola 1 nic nezměnilo.

## Splněné kategorie (stručně)

- **Funkčnost**: SCHVÁLENO (kolo 3), testy, tsc i lint jsou čisté a všechny body kroků 1–2 jsou ✅.
- **Shoda se specifikací**: tokeny odpovídají spec §6.6. Nové skupiny `size` a `material` jsou zapsané v LOG.
- **Vizuál**: estetika Chalk & Ember a všechny stavy zůstávají stejné jako v kole 1. Jediná vizuální změna je mezera v `DotSteps` (6 → 8), kterou QA ověřila na snímcích `tools/shots/qa-step2-r3`. Minimum 44 pt má teď jediný zdroj, `size.hit`.
- **Motion**: beze změny od kola 1 (spec §7.3 a §6.7, reduce motion, pružiny na UI vlákně).
- **Dokumentace**: v LOG jsou zápisy boss, design, motion a qa, včetně oprav po ratingu. README je aktuální a v QA.md označené ✅.

## K ruční kontrole (na zařízení, bez vlivu na skóre)

1. Zvuk `click` při dopadu kotouče. V tichém režimu iOS musí mlčet a cizí hudbu nesmí přerušit.
2. Haptika: Heavy při dopadu, Success u opice (+420 ms), Light při odemčení uzlu, Medium na konci výdrže a Success při zrození.
3. Hardwarové Zpět na Androidu: v lekci otevře dialog ukončení, na zrození je blokované (R21).
4. Deep link na zamčenou lekci (ErrorState) a na `/onboarding/path` s existujícím profilem (redirect bez probliknutí formuláře).
5. Plynulost pružin (`seat`, `rattle`, `hop`, `unlock`) na reálném zařízení a chování se systémovým reduce motion.
6. Odpočet výdrže při přechodu aplikace na pozadí a zpět (pauza).
7. Čitelnost kotoučů a štítků na mapě na malém displeji a v light režimu na slunci.
8. `DotSteps` s mezerou 8 pt na nejužším displeji (např. iPhone SE): řádek teček se nesmí zalomit ani přetéct.

## Doporučení (mimo skóre)

- Rubrika i CLAUDE.md pořád zmiňují jen „barvy, fonty, spacing“. Doporučuji pravidlo rozšířit na „barvy, fonty, spacing, radiusy, rozměry“, protože `size` a `material` už v theme existují.
- Ruling o `material` tokenech zapsal design-agent „podle rozhodnutí boss“. Pro dohledatelnost by bylo lepší, kdyby ho boss potvrdil vlastním zápisem v LOG.
