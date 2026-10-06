// Reakce opičky (Nothing Dot fáze 3, spec §4.4): čistý výběr reakce na událost, bez Reactu a animací.
// Přehrání řeší `components/mascot/` (motion); obrazovky jen hlásí události.

export type ReactionId =
  | 'hop' | 'flip' | 'cuddle' | 'gaze' | 'lookDown' | 'dizzy' | 'sleep' | 'wave'
  | 'nod' | 'celebrate' | 'proud' | 'sad' | 'joyJump' | 'shrug' | 'spinFollow';

export type MascotEvent =
  | { type: 'tap'; at: number } | { type: 'longPress' } | { type: 'touchMove' }
  | { type: 'scroll'; velocity: number } | { type: 'idle' } | { type: 'appReturn'; awayMs: number }
  | { type: 'lessonStart' } | { type: 'lessonDone' } | { type: 'streakUp' } | { type: 'streakLost' }
  | { type: 'leagueUp' } | { type: 'leagueDown' } | { type: 'plateSpin' };

/** `taps` = časy nedávných ťuknutí (pro trojité ťuknutí); `lastAt` = kdy hrála poslední reakce. */
export interface ReactionState { lastId: ReactionId | null; lastAt: number; taps: number[] }

/** Vyšší číslo přebije nižší. Od `IMPORTANT` výš reakce přeskočí cooldown (události ze hry, ne hraní si). */
export const REACTION_PRIORITY: Record<ReactionId, number> = {
  celebrate: 9, joyJump: 8, proud: 7, sad: 7, shrug: 6, wave: 5, nod: 5,
  flip: 4, cuddle: 4, spinFollow: 3, dizzy: 3, hop: 2, lookDown: 1, gaze: 1, sleep: 0,
};
const IMPORTANT = 5;

/** Po reakci opička chvíli nereaguje na hraní si (žádná fronta, žádné zaseknutí při ťukání). */
export const REACTION_COOLDOWN_MS = 1200;
export const TRIPLE_TAP_WINDOW_MS = 600;
export const IDLE_MS = 20000;
export const WAVE_AFTER_AWAY_MS = 60000;
/** Rychlost scrollu (pt/s), od které se opičce zatočí hlava. */
export const DIZZY_VELOCITY = 2500;

/** Tři ťuknutí v okně = salto, jinak poskok. `taps` obsahuje i aktuální ťuknutí `now`. */
export function tapKind(taps: readonly number[], now: number): 'hop' | 'flip' {
  return taps.filter((t) => now - t <= TRIPLE_TAP_WINDOW_MS).length >= 3 ? 'flip' : 'hop';
}

export const shouldWave = (awayMs: number) => awayMs >= WAVE_AFTER_AWAY_MS;

/** Nečinnost se počítá jen na zaostřené obrazovce (opička na jiném tabu neusíná). */
export const isIdle = (lastInteractionAt: number, now: number, focused: boolean) =>
  focused && now - lastInteractionAt >= IDLE_MS;

/** Událost → reakce (null = událost reakci nevyvolá). Pro ťuknutí potřebuje nedávná ťuknutí včetně aktuálního. */
export function eventToReaction(e: MascotEvent, taps: readonly number[]): ReactionId | null {
  switch (e.type) {
    case 'tap': return tapKind(taps, e.at);
    case 'longPress': return 'cuddle';
    case 'touchMove': return 'gaze';
    case 'scroll':
      if (Math.abs(e.velocity) >= DIZZY_VELOCITY) return 'dizzy';
      return e.velocity > 0 ? 'lookDown' : null;
    case 'idle': return 'sleep';
    case 'appReturn': return shouldWave(e.awayMs) ? 'wave' : null;
    case 'lessonStart': return 'nod';
    case 'lessonDone': return 'celebrate';
    case 'streakUp': return 'proud';
    case 'streakLost': return 'sad';
    case 'leagueUp': return 'joyJump';
    case 'leagueDown': return 'shrug';
    case 'plateSpin': return 'spinFollow';
  }
}

/**
 * Vybere reakci a vrátí nový stav. V cooldownu po poslední reakci projde jen důležitá reakce (priorita ≥ 5)
 * a jen pokud má vyšší prioritu než ta, která právě hraje; ostatní se zahodí (žádná fronta).
 */
export function pickReaction(e: MascotEvent, s: ReactionState, now: number): { id: ReactionId | null; state: ReactionState } {
  const taps = e.type === 'tap' ? [...s.taps.filter((t) => now - t <= TRIPLE_TAP_WINDOW_MS), e.at] : s.taps;
  const id = eventToReaction(e, taps);
  const base = { ...s, taps };
  if (!id) return { id: null, state: base };
  const cooling = now - s.lastAt < REACTION_COOLDOWN_MS;
  if (cooling) {
    const p = REACTION_PRIORITY[id];
    const beatsCurrent = s.lastId == null || p > REACTION_PRIORITY[s.lastId];
    if (p < IMPORTANT || !beatsCurrent) return { id: null, state: base };
  }
  // Po saltu se série ťuknutí vynuluje, ať čtvrté ťuknutí nespustí další salto.
  return { id, state: { lastId: id, lastAt: now, taps: id === 'flip' ? [] : taps } };
}

/** Omezený pohyb: skoky a rotace se nahradí změnou nálady nebo očí. */
export function degrade(id: ReactionId, reduced: boolean): ReactionId {
  if (!reduced) return id;
  switch (id) {
    case 'flip': case 'hop': case 'joyJump': return 'celebrate';
    case 'dizzy': case 'spinFollow': return 'lookDown';
    case 'wave': case 'nod': case 'shrug': return 'gaze';
    default: return id;
  }
}
