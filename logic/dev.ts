// Dev menu (spec §7.10): čisté výpočty pro posun času, dev XP a přepínání stage.
import { DEV_XP_LESSON_ID } from './activity';
import { addDays, parseISODate, toISODate } from './dates';
import type { SeasonSpan } from './season';
import type { ActivityEvent, MascotStage } from '@/types';

const DAY_MS = 86_400_000;

export function devXpEvent(amount: number, now: Date): ActivityEvent {
  return { id: `${DEV_XP_LESSON_ID}-${now.getTime()}`, at: now.toISOString(), day: toISODate(now), lessonId: DEV_XP_LESSON_ID, xp: amount };
}

/** Posun v ms, po kterém `now()` = den po konci sezóny v 09:00 místního času (DST-safe: počítá se z kalendářního data). */
export function seasonEndOffset(s: SeasonSpan, realNow: Date): number {
  const target = parseISODate(addDays(s.endDate, 1));
  target.setHours(9, 0, 0, 0);
  return target.getTime() - realNow.getTime();
}

export const streakLossOffset = (currentOffset: number): number => currentOffset + 2 * DAY_MS;

const CYCLE: readonly (MascotStage | null)[] = [null, 1, 2, 3];
export const nextStageOverride = (o: MascotStage | null): MascotStage | null => CYCLE[(CYCLE.indexOf(o) + 1) % CYCLE.length] ?? null;
