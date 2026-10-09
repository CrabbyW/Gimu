import { useMemo } from 'react';
import { now } from '@/lib/clock';
import { toISODate } from '@/logic/dates';
import { streakRisk } from '@/logic/disclosure';
import { activeDays, currentStreak } from '@/logic/streak';
import type { LessonPathView } from '@/services/contracts';
import type { UserProfile } from '@/types';

/** Řádek „důvod se vrátit“ na mapě: další lekce s minutami a stav série. */
export interface ReturnLine {
  next: { title: string; minutes: number } | null;
  risk: 'done' | 'atRisk' | 'none';
}

/** Čistý výpočet: další lekce = aktuální uzel cesty; minuty z `minutesOf` (chybí = bez řádku Next). */
export function returnLineOf(
  profile: Pick<UserProfile, 'activity'>,
  view: LessonPathView,
  minutesOf: Record<string, number>,
  today: string,
): ReturnLine {
  const days = activeDays(profile.activity);
  const risk = streakRisk(days, today, currentStreak(days, today));
  const id = view.currentLessonId;
  const node = id ? view.sections.flatMap((s) => s.nodes).find((n) => n.lesson.id === id) : undefined;
  const minutes = id ? minutesOf[id] : undefined;
  return { next: node && minutes !== undefined ? { title: node.lesson.title, minutes } : null, risk };
}

export function useReturnLine(profile: UserProfile | null, view: LessonPathView | null, minutesOf: Record<string, number>): ReturnLine | null {
  const today = toISODate(now());
  return useMemo(() => (profile && view ? returnLineOf(profile, view, minutesOf, today) : null), [profile, view, minutesOf, today]);
}
