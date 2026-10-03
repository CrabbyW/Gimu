import type { ISODate, Mood } from '@/types';
import { isStreakBroken, longestStreak } from './streak';

export type MoodEvent = 'lessonComplete' | 'milestone' | null;

/** Nálada opičky (MVP: idle / celebrate / sad). Priorita: událost > přerušená série > klid.
 *  Smutek jen když bylo co ztratit (nejdelší série ≥ 2), aby nový uživatel po jednom dni nedostal výčitku. */
export function mascotMood(days: ISODate[], today: ISODate, event: MoodEvent = null): Mood {
  if (event) return 'celebrate';
  if (isStreakBroken(days, today) && longestStreak(days) >= 2) return 'sad';
  return 'idle';
}

/** Stav dne pro řádek „Dnes hotovo / Dnes čeká“ (náhrada denního cíle: série = 1 lekce denně). */
export const todayStatus = (days: readonly ISODate[], today: ISODate): 'done' | 'pending' => (days.includes(today) ? 'done' : 'pending');
