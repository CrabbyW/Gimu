import type { ActivityEvent, ISODate } from '@/types';
import { isLessonEvent } from './activity';
import { addDays, diffDays } from './dates';

export interface SeasonSpan { startDate: ISODate; endDate: ISODate }

/** Všechny dny sezóny včetně obou krajů. */
export function seasonDays(s: SeasonSpan): ISODate[] {
  const n = diffDays(s.endDate, s.startDate) + 1;
  return Array.from({ length: n }, (_, i) => addDays(s.startDate, i));
}

/**
 * Zameškané dny v comeback okně (today-1 … today-windowDays), oříznuté na sezónu a na den založení profilu.
 * Zameškaný = žádná lekční událost a žádná oprava. Nejstarší první. Opravy platí jen pro cíl sezóny, ne pro streak.
 */
export function repairableDays(events: ActivityEvent[], s: SeasonSpan, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate[] {
  const active = new Set(events.filter(isLessonEvent).map((e) => e.day));
  const repaired = new Set(events.flatMap((e) => (e.repairsDate ? [e.repairsDate] : [])));
  const out: ISODate[] = [];
  for (let k = windowDays; k >= 1; k--) {
    const d = addDays(today, -k);
    if (d < s.startDate || d > s.endDate || d < joinedDay) continue;
    if (!active.has(d) && !repaired.has(d)) out.push(d);
  }
  return out;
}

/** Den, který opraví právě dokončovaná lekce: jen druhá a další lekce dne v běžící sezóně. */
export function repairTarget(before: ActivityEvent[], s: SeasonSpan | null, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate | null {
  if (!s || today < s.startDate || today > s.endDate) return null;
  if (!before.some((e) => isLessonEvent(e) && e.day === today)) return null;
  return repairableDays(before, s, today, windowDays, joinedDay)[0] ?? null;
}
