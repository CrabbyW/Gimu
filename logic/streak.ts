import type { ActivityEvent, ISODate } from '@/types';
import { addDays, diffDays } from './dates';

export function activeDays(events: Pick<ActivityEvent, 'day'>[]): ISODate[] {
  return [...new Set(events.map((e) => e.day))].sort();
}

export function currentStreak(days: ISODate[], today: ISODate): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(cursor)) { n++; cursor = addDays(cursor, -1); }
  return n;
}

export function longestStreak(days: ISODate[]): number {
  let best = 0; let run = 0; let prev: ISODate | undefined;
  for (const day of [...days].sort()) {
    run = prev !== undefined && diffDays(day, prev) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = day;
  }
  return best;
}

export function isStreakBroken(days: ISODate[], today: ISODate): boolean {
  const last = days.at(-1);
  return last !== undefined && diffDays(today, last) >= 2;
}
