import type { Exercise } from '@/types';

/** Přechod mezi cviky a příprava (s): přečíst popis, zaujmout pozici. */
const SETUP_S = 20;
/** Průměrné tempo jednoho opakování (s). */
const REP_S = 3;

/** Odhad délky lekce v celých minutách (nahoru, min. 1). Odvozeno z cviků, ne uloženo v datech: změna objemu cviku se propíše sama. */
export function estMinutes(exercises: readonly Pick<Exercise, 'type' | 'amount'>[]): number {
  const s = exercises.reduce((sum, e) => sum + SETUP_S + (e.type === 'hold' ? e.amount : e.amount * REP_S), 0);
  return Math.max(1, Math.ceil(s / 60));
}
