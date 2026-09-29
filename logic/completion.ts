import type { Lesson, MascotStage, PlateKg, UserProfile, XpRules } from '@/types';
import { toISODate } from './dates';
import { nextLessonId } from './map';
import { stageForXp } from './mascot';
import { activeDays, currentStreak } from './streak';
import { lessonXp, totalXp, type XpBreakdown } from './xp';

export interface LessonResult {
  attemptId: string; lessonId: string; xp: XpBreakdown;
  totalXpBefore: number; totalXpAfter: number;
  stageBefore: MascotStage; stageAfter: MascotStage;
  unlockedLessonId: string | null; streak: number; completedPlates: PlateKg[];
}

interface Args {
  profile: UserProfile; lesson: Lesson; pathLessons: Lesson[]; now: Date;
  attemptId: string; rules: XpRules; thresholds: readonly number[];
}

export function applyLessonCompletion(a: Args): { profile: UserProfile; result: LessonResult } {
  const prior = a.profile.activity.find((e) => e.id === a.attemptId);
  const events = prior ? a.profile.activity.filter((e) => e.id !== a.attemptId) : a.profile.activity;

  const day = toISODate(a.now);
  const completedBefore = new Set(events.map((e) => e.lessonId));
  const isReplay = completedBefore.has(a.lesson.id);
  const isFirstToday = !events.some((e) => e.day === day);
  const daysAfter = activeDays([...events, { day }]);
  const streak = currentStreak(daysAfter, day);
  const xp = lessonXp({ isBoss: a.lesson.isBoss, isReplay, isFirstToday, streakDays: streak }, a.rules);

  const totalXpBefore = totalXp(events);
  const totalXpAfter = totalXpBefore + xp.total;
  const completedAfter = new Set([...completedBefore, a.lesson.id]);
  const sectionLessons = a.pathLessons.filter((l) => l.section === a.lesson.section);

  const result: LessonResult = {
    attemptId: a.attemptId, lessonId: a.lesson.id, xp, totalXpBefore, totalXpAfter,
    stageBefore: stageForXp(totalXpBefore, a.thresholds), stageAfter: stageForXp(totalXpAfter, a.thresholds),
    unlockedLessonId: isReplay ? null : nextLessonId(a.pathLessons, completedAfter),
    streak,
    completedPlates: [...sectionLessons].sort((x, y) => x.order - y.order)
      .filter((l) => !l.isBoss && completedAfter.has(l.id)).map((l) => l.plateKg),
  };

  if (prior) return { profile: a.profile, result: { ...result, xp: { ...xp, total: prior.xp } } };
  const event = { id: a.attemptId, at: a.now.toISOString(), day, lessonId: a.lesson.id, xp: xp.total };
  return { profile: { ...a.profile, activity: [...a.profile.activity, event] }, result };
}
