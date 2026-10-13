// Repertoár opičky v2 (plán docs/superpowers/plans/2026-10-13-opice-26-animaci.md): čisté rozhodování,
// KDY a CO opička hraje — bez Reactu a animací. Přehrání řeší components/mascot (motion), pózy logic/mascotPoses.
// Pravidla: najednou nejvýš jedna akce, idle jednou za 20–40 s, haptika jen u akcí od uživatele.

import type { Rng } from './mascotIdle';

/** Nové akce (vedle stávajících `IdleActionId` a `ReactionId`). */
export type RepertoireId =
  // idle na mapě
  | 'warmup' | 'boredSit' | 'pointStart' | 'plateHop' | 'handstandPlate'
  // denní doba / stav série
  | 'morningStretch' | 'eveningTowel' | 'streakAtRisk' | 'sadThenPoint'
  // ťuknutí
  | 'headShake' | 'giggle' | 'hangFinger'
  // lekce
  | 'trainAlong' | 'strain' | 'wipeSweat'
  // úspěch
  | 'liftBarbell' | 'flameJump' | 'climbPodium' | 'grow'
  // návrat
  | 'waveRun'
  // systémové stavy
  | 'wifiShake' | 'ropeTangle' | 'peekBox';

export const IDLE_PAUSE_MS = { min: 20_000, max: 40_000 } as const;
/** Bez akce uživatele tak dlouho → opička ukáže na kartu Start. */
export const POINT_START_AFTER_MS = 25_000;
/** Návrat po delší pauze → zamává a doběhne k lekci. */
export const WAVE_RUN_AFTER_MS = 60_000;
/** Výdrž: posledních N ms = zatnutí. */
export const STRAIN_LAST_MS = 3_000;

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

/** Denní doba z místní hodiny: ráno 5–10, den 10–18, večer 18–23, noc jinak. */
export function timeOfDay(now: Date): TimeOfDay {
  const h = now.getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 18) return 'day';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

/** Pauza před další idle akcí (rovnoměrně 20–40 s). */
export const nextPause = (rng: Rng): number =>
  Math.round(IDLE_PAUSE_MS.min + rng() * (IDLE_PAUSE_MS.max - IDLE_PAUSE_MS.min));

export interface MapIdleInput {
  now: Date;
  /** ms od poslední interakce uživatele (ťuknutí, scroll). */
  sinceInteractionMs: number;
  /** Série dnes ještě neodcvičená a končí dnes večer („Streak ends tonight“). */
  streakAtRisk: boolean;
  /** Sousední uzel existuje (přeskok má kam). */
  hasNeighbour: boolean;
  last: RepertoireId | null;
}

const MAP_IDLE: readonly RepertoireId[] = ['warmup', 'boredSit', 'plateHop', 'handstandPlate'];

/**
 * Výběr idle akce na mapě. Priority: série v ohrožení > ukázat na Start (dlouho bez akce) > denní doba
 * (jednou za den-dobu řeší volající přes `last`) > náhodná akce z repertoáru. Poslední akce se neopakuje.
 */
export function pickMapIdle(rng: Rng, i: MapIdleInput): RepertoireId | null {
  if (i.streakAtRisk && i.last !== 'streakAtRisk') return 'streakAtRisk';
  if (i.sinceInteractionMs >= POINT_START_AFTER_MS && i.last !== 'pointStart') return 'pointStart';
  const tod = timeOfDay(i.now);
  if (tod === 'morning' && i.last !== 'morningStretch' && rng() < 0.3) return 'morningStretch';
  if (tod === 'evening' && i.last !== 'eveningTowel' && rng() < 0.3) return 'eveningTowel';
  const pool = MAP_IDLE.filter((id) => id !== i.last && (id !== 'plateHop' || i.hasNeighbour));
  if (pool.length === 0) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))] ?? null;
}

/** Zóna ťuknutí na opičce (souřadnice v jejím čtvercovém plátně 0–1): hlava nahoře, břicho dole. */
export function tapZone(y01: number): 'head' | 'belly' {
  return y01 < 0.5 ? 'head' : 'belly';
}

export type RepertoireEvent =
  | { type: 'tapZone'; zone: 'head' | 'belly' }
  | { type: 'longPressDrag' }
  | { type: 'holdRemaining'; ms: number }
  | { type: 'rest' }
  | { type: 'exerciseActive' }
  | { type: 'lessonDone' }
  | { type: 'streakRecord' }
  | { type: 'leagueUp' }
  | { type: 'stageUp' }
  | { type: 'appReturn'; awayMs: number }
  | { type: 'streakLost' }
  | { type: 'offline' } | { type: 'error' } | { type: 'empty' };

/** Událost → akce repertoáru (null = nic). Rekord série má přednost před obyčejným dokončením — řeší volající pořadím. */
export function eventToRepertoire(e: RepertoireEvent): RepertoireId | null {
  switch (e.type) {
    case 'tapZone': return e.zone === 'head' ? 'headShake' : 'giggle';
    case 'longPressDrag': return 'hangFinger';
    case 'holdRemaining': return e.ms > 0 && e.ms <= STRAIN_LAST_MS ? 'strain' : null;
    case 'rest': return 'wipeSweat';
    case 'exerciseActive': return 'trainAlong';
    case 'lessonDone': return 'liftBarbell';
    case 'streakRecord': return 'flameJump';
    case 'leagueUp': return 'climbPodium';
    case 'stageUp': return 'grow';
    case 'appReturn': return e.awayMs >= WAVE_RUN_AFTER_MS ? 'waveRun' : null;
    case 'streakLost': return 'sadThenPoint';
    case 'offline': return 'wifiShake';
    case 'error': return 'ropeTangle';
    case 'empty': return 'peekBox';
  }
}

/** Haptika jen u akcí, které spustil uživatel nebo jeho úspěch (ne u idle). */
export const REPERTOIRE_HAPTIC: ReadonlySet<RepertoireId> = new Set<RepertoireId>([
  'headShake', 'giggle', 'hangFinger', 'liftBarbell', 'flameJump', 'climbPodium', 'grow',
]);
