# Nothing Dot — fáze 3 (15 reakcí opičky) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Opička reaguje na uživatele a na dění v appce. Má 15 reakcí podle spec §4.4 a všechny staví na existujících kresbách, náladách a transformacích, bez nových kreseb.

**Architecture:**
- **Výběr reakce** je čistá testovaná logika v `logic/mascotReactions.ts`: událost → reakce, priorita, cooldown, rozpoznání trojitého ťuknutí, nečinnosti a rychlého scrollu.
- **Přehrání** řeší `components/mascot/` (motion-agent). `SvgMascot` dostane volitelné props `reaction` (id a klíč přehrání) a `gaze` (sdílený bod pohledu); hook `useMascotReactions` spojí události z obrazovky s logikou.
- Obrazovky jen hlásí události.

**Tech Stack:** Reanimated 4.5 (shared values, UI vlákno), Gesture Handler 2.32, expo-haptics přes `lib/feedback`, Jest.

**Spec:** `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md` §4.4. Navazuje na fáze 1 a 2, obě s ratingem 100/100.

## Global Constraints
- Opička zůstává jediným barevným prvkem a její vzhled se nemění. Žádné nové kresby, jen nálady `idle | happy | celebrate | sad`, oči (`eyeRy`, `droop`), dech a transformace těla, hlavy a celé opičky.
- Hodnoty pohybu jen v `lib/motion.ts` (nový blok `motion.reactions`). Spring je povolený, protože opička není tlačítko, které by uživatel mačkal kvůli akci. Ťuknutí na opičku je hra, ne příkaz.
- Reduce Motion: reakce se přehraje jen jako změna nálady nebo očí, bez poskoků, rotací a salta.
- Reakce nesmí blokovat interakci (`pointerEvents` beze změny) a nesmí se řetězit do nekonečna (cooldown).
- Logika jen v `logic/`, pohyb v `components/mascot/`, copy česky v `data/copy.ts` (popisky pro čtečku).
- Každý agent zapisuje do `docs/LOG.md`. Workflow: boss (logika) → motion-agent → QA → rating 100/100.

## Review Focus
- Rychlé ťukání 10× za sebou: nejvýš jedno salto a pak cooldown, žádná fronta reakcí ani zaseknutá opička. Test `pickReaction` s cooldownem a `tapKind` se sérií ťuknutí.
- Souběh událostí (dokončení lekce a série +1 ve stejném okamžiku): vyhraje vyšší priorita, druhá se zahodí. Test priority.
- Reduce Motion: salto, poskok i točení hlavy se degradují na změnu nálady a očí. Test `degrade`.
- Návrat do appky po krátké době (< 60 s) opičku nemává. Test `shouldWave`.
- Opička mimo obrazovku (jiný tab): nečinnost se nepočítá, `isIdle` vyžaduje zaostření. Test.

---

### Task 1: Logika reakcí (boss, TDD)

**Files:**
- Create: `logic/mascotReactions.ts`, `logic/__tests__/mascotReactions.test.ts`

**Interfaces:**
- Produces:
```ts
export type ReactionId =
  | 'hop' | 'flip' | 'cuddle' | 'gaze' | 'lookDown' | 'dizzy' | 'sleep' | 'wave'
  | 'nod' | 'celebrate' | 'proud' | 'sad' | 'joyJump' | 'shrug' | 'spinFollow';
export type MascotEvent =
  | { type: 'tap'; at: number } | { type: 'longPress' } | { type: 'touchMove' }
  | { type: 'scroll'; velocity: number } | { type: 'idle' } | { type: 'appReturn'; awayMs: number }
  | { type: 'lessonStart' } | { type: 'lessonDone' } | { type: 'streakUp' } | { type: 'streakLost' }
  | { type: 'leagueUp' } | { type: 'leagueDown' } | { type: 'plateSpin' };
export interface ReactionState { lastId: ReactionId | null; lastAt: number; taps: number[] }
export const REACTION_PRIORITY: Record<ReactionId, number>;
export const REACTION_COOLDOWN_MS: number;      // 1200
export const TRIPLE_TAP_WINDOW_MS: number;      // 600
export const IDLE_MS: number;                   // 20000
export const WAVE_AFTER_AWAY_MS: number;        // 60000
export const DIZZY_VELOCITY: number;            // 2500 pt/s
export function tapKind(taps: readonly number[], now: number): 'hop' | 'flip';
export function eventToReaction(e: MascotEvent, taps: readonly number[]): ReactionId | null;
export function pickReaction(e: MascotEvent, s: ReactionState, now: number): { id: ReactionId | null; state: ReactionState };
export function degrade(id: ReactionId, reduced: boolean): ReactionId;
export function shouldWave(awayMs: number): boolean;
export function isIdle(lastInteractionAt: number, now: number, focused: boolean): boolean;
```
Mapování (spec §4.4):
| Událost | Reakce |
|---|---|
| tap | hop (trojité ťuknutí v 600 ms = flip) |
| longPress | cuddle |
| touchMove | gaze |
| scroll dolů | lookDown |
| scroll rychle (\|v\| ≥ 2500) | dizzy |
| idle | sleep |
| appReturn ≥ 60 s | wave, jinak null |
| lessonStart | nod |
| lessonDone | celebrate |
| streakUp | proud |
| streakLost | sad |
| leagueUp | joyJump |
| leagueDown | shrug |
| plateSpin | spinFollow |

Priorita: celebrate 9, joyJump 8, proud 7, sad 7, shrug 6, wave 5, nod 5, flip 4, cuddle 4, spinFollow 3, dizzy 3, hop 2, lookDown 1, gaze 1, sleep 0.

Cooldown platí pro reakce s prioritou < 5. Reakce s prioritou ≥ 5 ho přeskočí, ale v rámci cooldownu nepřebije vyšší prioritu.

`degrade(reduced=true)`:
| Reakce | Degraduje na |
|---|---|
| flip, hop, joyJump | celebrate |
| dizzy, spinFollow | lookDown |
| wave, nod, shrug | gaze |

Ostatní reakce zůstávají stejné.

- [ ] **Step 1:** Napsat testy pro každou funkci, včetně Review Focus:
  - 10 ťuknutí po 50 ms → jen jedna reakce, pak null až do vypršení cooldownu;
  - lessonDone a streakUp ve stejném ms → celebrate;
  - degrade;
  - shouldWave(30000) = false;
  - isIdle(…, focused=false) = false.
- [ ] **Step 2:** FAIL. **Step 3:** Implementace. **Step 4:** PASS a `tsc`. **Step 5:** Commit `feat(nothing): logika reakcí opičky`.

### Task 2: Přehrání reakcí (motion-agent)

**Files:**
- Modify: `components/mascot/SvgMascot.tsx`, `components/mascot/types.ts`, `lib/motion.ts` (`motion.reactions`)
- Create: `components/mascot/useMascotReactions.ts`, `components/mascot/ReactiveMascot.tsx` (obal s gesty)

**Interfaces:**
- `MascotProps` dostane:
  - `reaction?: { id: ReactionId; key: number }`: nový `key` znamená přehrát;
  - `gaze?: SharedValue<{ x: number; y: number } | null>`: pohled pupil a hlavy, v souřadnicích plátna.
- `ReactiveMascot` (props jako `Mascot` plus `onReaction?`): Tap, LongPress a Pan přes GestureDetector, simultánně se scrollem. Ze zdrojů volá `pickReaction`.
- `useMascotReactions(focused: boolean)` vrací:
  - `report(e: MascotEvent)` pro obrazovky;
  - `reaction` a `gaze` pro opičku;
  - nečinnost (časovač, jen při `focused`) a `appReturn` (AppState).

Animace všech 15 reakcí:
| Reakce | Pohyb |
|---|---|
| hop | poskok |
| flip | salto: rotace 360° kolem středu a poskok |
| cuddle | oči zavřené, mood happy, mírné zmáčknutí |
| gaze | pupily a hlava za bodem |
| lookDown | droop |
| dizzy | kývání hlavy ±12° se zhášením |
| sleep | oči zavřené, pomalý dech; probudí ji jakýkoli dotek |
| wave | náklon těla ze strany na stranu 3× |
| nod | dvojí kývnutí hlavou |
| celebrate | mood celebrate a scarfEdge |
| proud | vypnutí: scaleY 1.06 a zdvih |
| sad | mood sad a droop |
| joyJump | vysoký skok se zmáčknutím |
| shrug | zdvih ramen, translateY těla nahoru a dolů a hlava na stranu |
| spinFollow | hlava se otáčí za úhlem kotouče (sdílená hodnota z `usePlateSpin`) |

Haptika: tap → `selection`, flip a joyJump → `success`, ostatní bez haptiky. Reduce Motion přes `degrade`.

- [ ] Steps: implementace, testy renderu (`reaction` prop přehraje bez pádu, Reduce Motion), tsc, jest, eslint, commit `feat(nothing): reakce opičky`.

### Task 3: Napojení na obrazovky (motion-agent)

- **Mapa** (`app/(tabs)/index.tsx`, `LessonMap`): sedící opička je `ReactiveMascot`.
  - Ťuknutí, podržení a tah prstu po mapě (gaze, z `useDotTouch`).
  - Scroll mapy: rychlost → lookDown nebo dizzy.
  - Roztočení kotouče → spinFollow.
  - Nečinnost → sleep; návrat do appky → wave; ztráta série → sad.
- **Lekce:** start → nod. **Oslava:** lessonDone → celebrate, série +1 → proud (po celebrate).
- **Liga:** `LeagueResultBanner` povýšení → joyJump, sestup → shrug.
- **Profil:** velká opička je `ReactiveMascot` (tap, podržení, gaze).
- [ ] Steps: napojení, ruční ověření na webu (tap, trojité ťuknutí, podržení, tah), tsc, jest, eslint, commit `feat(nothing): napojení reakcí opičky`.

### Task 4: SPEC, LOG, QA, rating
- [ ] SPEC §8 Maskot doplnit o reakce (tabulka událost → reakce). LOG. QA (max 3 kola), rating (100/100, max 5 kol). HANDOFF a README.
