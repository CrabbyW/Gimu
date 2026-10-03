import { applyGoalsPatch } from '@/logic/goals';
import { buildInitialProfile } from '@/logic/onboarding';
import type { Milestone } from '@/types';

const m = (id: string, target: number, current = 0): Milestone => ({ id, label: ` ${id} `, target, unit: 'reps', current, custom: false });
const base = () => buildInitialProfile(
  { path: 'bodyControl', dreamBody: 'Stojka u zdi', milestones: [m('a', 10, 4), m('b', 5, 1)], weightGoal: { kind: 'none' } },
  new Date(2026, 9, 1),
);
const ok = (r: ReturnType<typeof applyGoalsPatch>) => { if ('error' in r) throw new Error(r.error); return r.profile; };

test('změna cíle milníku zachová pokrok, nový milník začíná na své hodnotě', () => {
  const p = ok(applyGoalsPatch(base(), { milestones: [m('a', 15, 0), m('c', 3)] }));
  expect(p.milestones).toEqual([{ ...m('a', 15, 4), label: 'a' }, { ...m('c', 3), label: 'c' }]);
});
test('počet milníků 2–3 a cíl 1–9999 (splněno = 1)', () => {
  expect(applyGoalsPatch(base(), { milestones: [m('a', 1)] })).toEqual({ error: 'milestoneCount' });
  expect(applyGoalsPatch(base(), { milestones: [m('a', 0), m('b', 2)] })).toEqual({ error: 'milestoneTarget' });
  expect(applyGoalsPatch(base(), { milestones: [m('a', 3), { ...m('b', 2), unit: 'done' }] })).toEqual({ error: 'milestoneTarget' });
});
test('cíl váhy: směr se validuje, „žádný“ projde', () => {
  expect(applyGoalsPatch(base(), { weightGoal: { kind: 'lose', startKg: 80, targetKg: 85 } })).toEqual({ error: 'weight' });
  expect(ok(applyGoalsPatch(base(), { weightGoal: { kind: 'lose', startKg: 85, targetKg: 78 } })).weightGoal.kind).toBe('lose');
  expect(ok(applyGoalsPatch(base(), { weightGoal: { kind: 'none' } })).weightGoal).toEqual({ kind: 'none' });
});
test('vize těla se ořízne a validuje', () => {
  expect(ok(applyGoalsPatch(base(), { dreamBody: '  Muscle-up  ' })).dreamBody).toBe('Muscle-up');
  expect(applyGoalsPatch(base(), { dreamBody: ' x ' })).toEqual({ error: 'dream' });
  expect(applyGoalsPatch(base(), { dreamBody: 'x'.repeat(200) })).toEqual({ error: 'dream' });
});
test('změna cesty ponechá historii aktivity', () => {
  const p0 = { ...base(), activity: [{ id: 'e', at: '2026-10-01T10:00:00.000Z', day: '2026-10-01', lessonId: 'bc-1-1', xp: 30 }] };
  const p = ok(applyGoalsPatch(p0, { path: 'strength' }));
  expect(p.path).toBe('strength');
  expect(p.activity).toHaveLength(1);
  expect(applyGoalsPatch(p0, { path: 'yoga' as never })).toEqual({ error: 'path' });
});
