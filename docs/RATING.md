# Rating — fáze 3 Nothing Dot + následné změny (9ee1707..HEAD)

**Skóre: 50/100**

Ověřeno: `tsc --noEmit` 0 chyb, jest 67 sad / 673 testů zelené, `eslint .` exit 0.

| Kategorie | Body | Stav |
|---|---|---|
| 1. Funkčnost | 0/25 | nesplněno |
| 2. Shoda se specifikací | 0/15 | nesplněno |
| 3. Architektura a kód | 15/15 | splněno |
| 4. Vizuální kvalita | 20/20 | splněno (ověřeno čtením kódu a QA, zbytek ruční kontrola) |
| 5. Motion | 15/15 | splněno (zbytek ruční kontrola) |
| 6. Dokumentace | 0/10 | nesplněno |

## Nesplněná kritéria

### 1. Funkčnost (qa)
- Poslední SCHVÁLENO (docs/LOG.md ř. 806, QA a309eb2..8b0b325) nepokrývá commity 43cb2db (FloatingTabBar jedno ťuknutí, Tap+Pan Race), 25f442e (opička idle: logic/mascotIdle.ts, components/mascot/*), c3ca0d8 (barevný systém theme/palettes.ts, borderStrong/focus/disabled, TextField/Toggle) a 3dc9561 (app/lesson/[id].tsx skip během časovače, theme/tokens.ts závoj). Chybí verdikt qa-agenta a ✅ body v docs/QA.md. — **qa**

### 2. Shoda se specifikací (boss)
- 3dc9561 (demo skip během časovače + změna závoje v theme/tokens.ts) nemá žádný záznam v docs/LOG.md; nelze ověřit, že změna je dokumentovaná/odsouhlasená. — **boss** (skip) / **design** (závoj)

### 6. Dokumentace
- docs/LOG.md: chybí záznam ke commitu 3dc9561 (boss + design). — **boss/design**
- docs/LOG.md: chybí záznam qa-agenta k poslední sadě změn (viz bod 1). — **qa**
- README.md (poslední změna před c3ca0d8) nezmiňuje barevný systém (docs/design/color-system.md, .css, nové tokeny borderStrong/focus/disabled/state*). — **boss**

## K ruční kontrole (bez srážky)
- Haptický podpis oslavy dokončení lekce a plynulost kotouč + opička na iPhonu.
- Tab bar: jedno ťuknutí vs. přejetí, VoiceOver aktivace.
- Idle opičky: četnost, dobíhání uší/šálu, zamávání na profilu.
- Závoj pod hlavičkou mapy v light i dark (čitelnost), Doto 24 pt na 320 pt.
- Kontrast nových barev na zařízení.

## Co udělat pro 100
1. qa-agent: QA 8b0b325..HEAD (4 commity výše), zápis do docs/QA.md + LOG, verdikt SCHVÁLENO.
2. boss/design-agent: záznam v LOG k 3dc9561.
3. boss: aktualizovat README (barevný systém, export).
