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
test('retry s pozdějším now vrátí identický výsledek jako original attempt', () => {
  const now = new Date(2026, 8, 29, 10);
  const a = run(base(), 'bc-1-1', now, 'attempt-1');
  const laterNow = new Date(2026, 8, 30, 9); // jiný den, jiný "now"
  const b = run(a.profile, 'bc-1-1', laterNow, 'attempt-1');
  expect(b.result).toEqual(a.result);
  expect(b.profile).toEqual(a.profile);
});
test('retry po mezilehlém pokusu vrátí identický výsledek jako original attempt', () => {
  const now = new Date(2026, 8, 29, 10);
  const a = run(base(), 'bc-1-1', now, 'attempt-1');
  const c = run(a.profile, 'bc-1-2', new Date(2026, 8, 29, 18), 'attempt-2');
  const retry = run(c.profile, 'bc-1-1', new Date(2026, 8, 30, 9), 'attempt-1');
  expect(retry.result).toEqual(a.result);
});
test('přechod stage se hlásí', () => {
  let p = base();
  p = { ...p, activity: [{ id: 'dev', at: new Date(2026, 8, 28).toISOString(), day: '2026-09-28', lessonId: 'dev-xp', xp: 480 }] };
  const r = run(p, 'bc-1-1', new Date(2026, 8, 29, 10));
  expect(r.result.stageBefore).toBe(1); expect(r.result.stageAfter).toBe(2);
});
test('dev-xp dnes nezruší bonus za první lekci dne', () => {
  const profile = { ...base(), activity: [{ id: 'd1', at: '2026-10-01T08:00:00.000Z', day: '2026-10-01', lessonId: 'dev-xp', xp: 500 }] };
  const { result } = run(profile, 'bc-1-1', new Date(2026, 9, 1, 12));
  expect(result.xp.firstOfDay).toBe(10);
});

describe('comeback (Task 22)', () => {
  const season = { startDate: '2026-09-28', endDate: '2026-12-26' };
  const runS = (profile: UserProfile, now: Date, attemptId: string, withSeason = true) =>
    applyLessonCompletion({ profile, lesson: lesson('bc-1-1'), pathLessons: path, now, attemptId, rules: XP_RULES, thresholds: STAGE_THRESHOLDS,
      ...(withSeason ? { season, repairWindowDays: 3 } : {}) }).profile;
  // createdAt fixture = 2026-09-29 (≤ nejstaršímu dni okna 2. 10.)
  test('druhá lekce dne zapíše repairsDate nejstaršího zameškaného dne v okně', () => {
    const p1 = runS(base(), new Date(2026, 9, 5, 10), 'a1');
    const p2 = runS(p1, new Date(2026, 9, 5, 18), 'a2');
    expect(p1.activity.at(-1)?.repairsDate).toBeUndefined();
    expect(p2.activity.at(-1)?.repairsDate).toBe('2026-10-02');
  });
  test('comeback přes půlnoc: lekce 23:50 a 00:05 jsou první lekce dvou různých dní → žádná oprava', () => {
    const p1 = runS(base(), new Date(2026, 9, 4, 23, 50), 'a1');
    const p2 = runS(p1, new Date(2026, 9, 5, 0, 5), 'a2');
    expect(p2.activity.map((e) => e.repairsDate)).toEqual([undefined, undefined]);
  });
  test('bez season parametru se chování plánu A nemění', () => {
    const p1 = runS(base(), new Date(2026, 9, 5, 10), 'a1', false);
    const p2 = runS(p1, new Date(2026, 9, 5, 18), 'a2', false);
    expect(p2.activity.at(-1)?.repairsDate).toBeUndefined();
  });
  test('retry se stejným attemptId nevytvoří druhou opravu', () => {
    const p1 = runS(base(), new Date(2026, 9, 5, 10), 'a1');
    const p2 = runS(p1, new Date(2026, 9, 5, 18), 'a2');
    const p3 = runS(p2, new Date(2026, 9, 5, 19), 'a2');
    expect(p3).toBe(p2);
  });
  test('oprava nemění streak', () => {
    const p1 = runS(base(), new Date(2026, 9, 5, 10), 'a1');
    const r = applyLessonCompletion({ profile: p1, lesson: lesson('bc-1-1'), pathLessons: path, now: new Date(2026, 9, 5, 18), attemptId: 'a2', rules: XP_RULES, thresholds: STAGE_THRESHOLDS, season, repairWindowDays: 3 });
    expect(r.result.streak).toBe(1);
  });
});
