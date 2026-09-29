import { LESSONS_BY_PATH } from '@/data/lessons';
import { STAGE_THRESHOLDS, XP_RULES } from '@/data/xp';
import { applyLessonCompletion } from '@/logic/completion';
import { buildInitialProfile } from '@/logic/onboarding';
import type { UserProfile } from '@/types';

const path = LESSONS_BY_PATH.bodyControl;
const lesson = (id: string) => path.find((l) => l.id === id)!;
const base = (): UserProfile => buildInitialProfile({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } }, new Date(2026, 8, 29, 10));
const run = (profile: UserProfile, id: string, now: Date, attemptId = `a-${id}-${now.getTime()}`) =>
  applyLessonCompletion({ profile, lesson: lesson(id), pathLessons: path, now, attemptId, rules: XP_RULES, thresholds: STAGE_THRESHOLDS });

test('první lekce: 32 XP, odemkne druhou, streak 1', () => {
  const { profile, result } = run(base(), 'bc-1-1', new Date(2026, 8, 29, 10));
  expect(result.xp.total).toBe(32); expect(result.unlockedLessonId).toBe('bc-1-2'); expect(result.streak).toBe(1);
  expect(profile.activity).toHaveLength(1); expect(profile.activity[0]!.day).toBe('2026-09-29');
  expect(result.completedPlates).toEqual([5]);
});
test('druhá lekce týž den: bez bonusu první dnes', () => {
  const a = run(base(), 'bc-1-1', new Date(2026, 8, 29, 10));
  const b = run(a.profile, 'bc-1-2', new Date(2026, 8, 29, 18));
  expect(b.result.xp).toMatchObject({ base: 20, firstOfDay: 0, streak: 2 });
  expect(b.result.completedPlates).toEqual([5, 5]);
});
test('opakování hotové lekce: 10 XP základ, nic neodemkne', () => {
  const a = run(base(), 'bc-1-1', new Date(2026, 8, 29, 10));
  const b = run(a.profile, 'bc-1-1', new Date(2026, 8, 29, 11));
  expect(b.result.xp.baseKind).toBe('replay'); expect(b.result.unlockedLessonId).toBeNull();
});
test('stejný attemptId dvakrát: idempotentní, XP se nepřičte dvakrát', () => {
  const now = new Date(2026, 8, 29, 10);
  const a = run(base(), 'bc-1-1', now, 'attempt-1');
  const b = run(a.profile, 'bc-1-1', now, 'attempt-1');
  expect(b.profile.activity).toHaveLength(1); expect(b.result).toEqual(a.result);
});
test('lekce ve 23:59 a 00:01 jsou dva různé dny (streak 2, obě first-of-day)', () => {
  const a = run(base(), 'bc-1-1', new Date(2026, 8, 29, 23, 59));
  const b = run(a.profile, 'bc-1-2', new Date(2026, 8, 30, 0, 1));
  expect(b.result.xp.firstOfDay).toBe(10); expect(b.result.streak).toBe(2);
});
test('přechod stage se hlásí', () => {
  let p = base();
  p = { ...p, activity: [{ id: 'dev', at: new Date(2026, 8, 28).toISOString(), day: '2026-09-28', lessonId: 'dev-xp', xp: 480 }] };
  const r = run(p, 'bc-1-1', new Date(2026, 8, 29, 10));
  expect(r.result.stageBefore).toBe(1); expect(r.result.stageAfter).toBe(2);
});
