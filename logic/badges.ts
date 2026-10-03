import type { ActivityEvent, Lesson } from '@/types';
import { isLessonEvent } from './activity';
import { activeDays, longestStreak } from './streak';

export type BadgeRule =
  | { kind: 'lessons' | 'streak' | 'boss' | 'xp'; n: number }
  | { kind: 'exercise'; exerciseId: string };
export interface BadgeDef { id: string; name: string; rule: BadgeRule }
export interface BadgeProgress { id: string; name: string; earned: boolean; current: number; target: number }

/** Podmínka česky pod zamčenou siluetou. */
export function badgeCondition(rule: BadgeRule): string {
  switch (rule.kind) {
    case 'lessons': return rule.n === 1 ? 'Dokonči první lekci' : `Dokonči ${rule.n} lekcí`;
    case 'streak': return `Cvič ${rule.n} dní v řadě`;
    case 'boss': return 'Poraz bosse sekce';
    case 'xp': return `Získej ${rule.n} XP`;
    case 'exercise': return 'Odcvič ho v lekci';
  }
}

/** Stav všech odznaků z historie aktivity. Odznak, jednou získaný, se neodebírá (série se počítá jako nejdelší, ne aktuální). */
export function badgeProgress(defs: readonly BadgeDef[], activity: ActivityEvent[], lessonsById: ReadonlyMap<string, Lesson>): BadgeProgress[] {
  const lessonEvents = activity.filter(isLessonEvent);
  const doneLessons = lessonEvents.map((e) => lessonsById.get(e.lessonId)).filter((l): l is Lesson => l !== undefined);
  const xp = activity.reduce((s, e) => s + e.xp, 0);
  const streak = longestStreak(activeDays(activity));
  const value = (r: BadgeRule): [number, number] => {
    switch (r.kind) {
      case 'lessons': return [lessonEvents.length, r.n];
      case 'streak': return [streak, r.n];
      case 'boss': return [doneLessons.filter((l) => l.isBoss).length, r.n];
      case 'xp': return [xp, r.n];
      case 'exercise': return [doneLessons.some((l) => l.exerciseIds.includes(r.exerciseId)) ? 1 : 0, 1];
    }
  };
  return defs.map((d) => {
    const [cur, target] = value(d.rule);
    return { id: d.id, name: d.name, earned: cur >= target, current: Math.min(cur, target), target };
  });
}
