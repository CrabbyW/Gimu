/**
 * Zapojení repertoáru opičky (motion-agent): kdy smí začít další akce. Rozhodnutí CO hrát je v
 * `logic/mascotRepertoire` (pickMapIdle, eventToRepertoire); tady jen pravidla přehrávače:
 * najednou nejvýš jedna akce; idle (priorita 0) nikdy nepřeruší běžící akci ani akci od uživatele;
 * událost nebo ťuknutí (1) přeruší idle; oslava (2) přeruší cokoli.
 */
export const PRIO = { idle: 0, user: 1, moment: 2 } as const;
export type ActPriority = (typeof PRIO)[keyof typeof PRIO];

export interface ActGate {
  /** Do kdy běží aktuální akce (ms, Date.now). */
  until: number;
  /** Priorita běžící akce (−1 = nic neběží). */
  prio: number;
}
export const IDLE_GATE: ActGate = { until: 0, prio: -1 };

/** Smí začít akce s prioritou `prio`? Po doběhnutí vždy; během běhu jen vyšší priorita. */
export function canStart(g: ActGate, now: number, prio: number): boolean {
  return now >= g.until || prio > g.prio;
}

export interface IdleGateInput {
  focused: boolean;
  reduced: boolean;
  /** Mapa právě hraje vlastní sekvenci: odemčení uzlu, skok po splashi, pull-to-refresh. */
  blocked: boolean;
  /** Běží jiná akce (jedna najednou). */
  busy: boolean;
}

/** Idle akce na mapě smí začít jen na zaostřené mapě, bez omezení pohybu, mimo sekvence a jinou akci. */
export function idleMayStart(i: IdleGateInput): boolean {
  return i.focused && !i.reduced && !i.blocked && !i.busy;
}

/** Když idle nesmí (blokováno, běží akce), další pokus za tolik ms (ne celou pauzu 20–40 s). */
export const IDLE_RETRY_MS = 3000;
