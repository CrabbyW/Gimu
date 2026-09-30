import type { ActivityEvent, ISODate } from '@/types';

/** Událost z dev menu „přidat XP“: jen XP (stage, liga, banány), ne lekce (ruling 17). */
export const DEV_XP_LESSON_ID = 'dev-xp';

export const isLessonEvent = (e: Pick<ActivityEvent, 'lessonId'>): boolean => e.lessonId !== DEV_XP_LESSON_ID;

const between = (day: ISODate, from: ISODate, to: ISODate): boolean => from <= day && day <= to;

/** Lekční události (bez dev-xp) se dnem v [from, to] včetně hranic. */
export function lessonEventsBetween(events: ActivityEvent[], from: ISODate, to: ISODate): ActivityEvent[] {
  return events.filter((e) => isLessonEvent(e) && between(e.day, from, to));
}

/** Součet XP se dnem v [from, to] včetně dev-xp (XP je XP). */
export function xpBetween(events: ActivityEvent[], from: ISODate, to: ISODate): number {
  return events.reduce((sum, e) => (between(e.day, from, to) ? sum + e.xp : sum), 0);
}
