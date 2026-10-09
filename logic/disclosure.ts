// UX pass U4: méně pojmů pro nováčka a důvod vrátit se zítra. Čisté funkce.
import type { ActivityEvent, ISODate } from '@/types';
import { isLessonEvent } from './activity';

export type Feature = 'wardrobe' | 'league' | 'season';

/** Kolik dokončených lekcí odemkne funkci. */
export const FEATURE_AFTER: Record<Feature, number> = { wardrobe: 2, league: 3, season: 5 };

/** Počet dokončených lekcí (různé pokusy lekcí, ne dev XP). */
export function lessonsDone(activity: readonly Pick<ActivityEvent, 'lessonId'>[]): number {
  return activity.filter((e) => isLessonEvent(e)).length;
}

/** Je funkce odemčená? Profily z doby před odhalováním (bez `guideSeen`) mají vše odemčené, ať starým uživatelům nic nezmizí. */
export function featureOpen(f: Feature, activity: readonly Pick<ActivityEvent, 'lessonId'>[], legacy: boolean): boolean {
  return legacy || lessonsDone(activity) >= FEATURE_AFTER[f];
}

/** Kolik lekcí zbývá do odemčení (0 = odemčeno). */
export function lessonsUntil(f: Feature, activity: readonly Pick<ActivityEvent, 'lessonId'>[]): number {
  return Math.max(0, FEATURE_AFTER[f] - lessonsDone(activity));
}

/** Stav série pro řádek na mapě: dnes hotovo / série dnes skončí, když se necvičí / nic k ztrátě. */
export function streakRisk(days: readonly ISODate[], today: ISODate, streak: number): 'done' | 'atRisk' | 'none' {
  if (days.includes(today)) return 'done';
  return streak > 0 ? 'atRisk' : 'none';
}
