import type { Exercise, Lesson, MascotStage, PlateKg, UserProfile, XpRules } from '@/types';
import { isLessonEvent } from './activity';
import { toISODate } from './dates';
import { nextLessonId } from './map';
import { repairTarget, type SeasonSpan } from './season';
import { stageForXp } from './mascot';
import { activeDays, currentStreak } from './streak';
import { doneRatio, EMPTY_DEBT, lessonCounts, settleDebt } from './adaptive';
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
  /** Běžící sezóna pro comeback opravu (plán B). Bez ní se neopravuje nic (plán A). */
  season?: SeasonSpan | null; repairWindowDays?: number;
  /** Přeskočení (R44): co bylo odcvičené, základní objemy cviků a navýšení z dluhu. Bez něj = vše odcvičené. */
  outcome?: { done: readonly boolean[]; exercises: readonly Pick<Exercise, 'type' | 'amount'>[]; extras: readonly number[] };
}

export function applyLessonCompletion(a: Args): { profile: UserProfile; result: LessonResult } {
  const priorIndex = a.profile.activity.findIndex((e) => e.id === a.attemptId);
  const isRetry = priorIndex !== -1;
  const prior = isRetry ? a.profile.activity[priorIndex] : undefined;
  // Retry (stejné attemptId): přepočítej přesně ve stavu a čase originálního pokusu,
  // ignoruj a.now i pokusy vložené po něm, ať je výsledek idempotentní.
  const events = isRetry ? a.profile.activity.slice(0, priorIndex) : a.profile.activity;
  const now = prior ? new Date(prior.at) : a.now;
  const day = prior ? prior.day : toISODate(now);

  const completedBefore = new Set(events.map((e) => e.lessonId));
  const isReplay = completedBefore.has(a.lesson.id);
  const isFirstToday = !events.some((e) => isLessonEvent(e) && e.day === day);
  const daysAfter = activeDays([...events, { day }]);
  const streak = currentStreak(daysAfter, day);
  if (a.outcome && !lessonCounts(a.outcome.done)) throw new Error('Lekce se nezapočítá: odcvič aspoň polovinu cviků.');
  const full = lessonXp({ isBoss: a.lesson.isBoss, isReplay, isFirstToday, streakDays: streak }, a.rules);
  // Přeskočené cviky: základ lekce poměrně, bonus dne a série zůstávají (série se počítá, lekce platí).
  const base = a.outcome ? Math.round(full.base * doneRatio(a.outcome.done)) : full.base;
  const xp = { ...full, base, total: base + full.firstOfDay + full.streak };

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

  if (isRetry) return { profile: a.profile, result };
  const repairsDate = repairTarget(events, a.season ?? null, day, a.repairWindowDays ?? 3, toISODate(new Date(a.profile.createdAt)));
  const event = { id: a.attemptId, at: now.toISOString(), day, lessonId: a.lesson.id, xp: xp.total, ...(repairsDate ? { repairsDate } : {}) };
  const trainingDebt = a.outcome
    ? settleDebt(a.profile.trainingDebt ?? EMPTY_DEBT, a.outcome.exercises, a.outcome.extras, a.outcome.done)
    : a.profile.trainingDebt;
  return { profile: { ...a.profile, activity: [...a.profile.activity, event], ...(trainingDebt ? { trainingDebt } : {}) }, result };
}
