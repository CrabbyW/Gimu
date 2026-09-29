import type { ActivityEvent, XpRules } from '@/types';

export interface LessonXpInput { isBoss: boolean; isReplay: boolean; isFirstToday: boolean; streakDays: number }
export interface XpBreakdown { base: number; baseKind: 'lesson' | 'boss' | 'replay'; firstOfDay: number; streak: number; total: number }

export function lessonXp(i: LessonXpInput, r: XpRules): XpBreakdown {
  const baseKind = i.isReplay ? 'replay' : i.isBoss ? 'boss' : 'lesson';
  const base = baseKind === 'replay' ? r.replay : baseKind === 'boss' ? r.boss : r.lesson;
  const firstOfDay = i.isFirstToday ? r.firstOfDay : 0;
  const streak = Math.min(i.streakDays * r.streakPerDay, r.streakBonusCap);
  return { base, baseKind, firstOfDay, streak, total: base + firstOfDay + streak };
}

export function totalXp(events: Pick<ActivityEvent, 'xp'>[]): number {
  return events.reduce((s, e) => s + e.xp, 0);
}
