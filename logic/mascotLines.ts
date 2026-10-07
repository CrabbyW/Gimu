// Repliky opičky (elite fáze 3, spec §2): čistý výběr kontextu a věty, bez Reactu.
// Texty jsou v `data/copy.ts` (`copy.mascotLines`), sem přicházejí jako parametr.
import type { Rng } from './mascotIdle';

export type LineContext = 'todayDone' | 'streakHot' | 'streakOn' | 'morning' | 'day' | 'evening' | 'night';
export type LineBank = Record<LineContext, readonly string[]>;
export interface Line { id: string; text: string }

export const STREAK_HOT_DAYS = 7;
export const LINE_MAX_CHARS = 32;

export function timeOfDay(hour: number): 'morning' | 'day' | 'evening' | 'night' {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/** Priorita: hotovo dnes > série ≥ 7 > série ≥ 1 > denní doba. Ztracená série (0) = denní doba, žádná výčitka. */
export function lineContext(a: { hour: number; streak: number; todayDone: boolean }): LineContext {
  if (a.todayDone) return 'todayDone';
  if (a.streak >= STREAK_HOT_DAYS) return 'streakHot';
  if (a.streak >= 1) return 'streakOn';
  return timeOfDay(a.hour);
}

/** Náhodná věta z kontextu, nikdy dvakrát stejná za sebou (`lastId`). Prázdný kontext = null. */
export function pickLine(bank: LineBank, ctx: LineContext, rng: Rng, lastId: string | null = null): Line | null {
  const all = bank[ctx].map((text, i) => ({ id: `${ctx}:${i}`, text }));
  const pool = all.length > 1 ? all.filter((l) => l.id !== lastId) : all;
  if (pool.length === 0) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!;
}
