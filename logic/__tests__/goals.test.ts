import { applyGoalsPatch, retarget } from '@/logic/goals';
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
test('retarget přepíše číslo v názvu předvolby, vlastní název nechá', () => {
  expect(retarget({ ...m('a', 10), label: '10 pull-ups' }, 15).label).toBe('15 pull-ups');
  expect(retarget({ ...m('a', 10), label: 'My goal 10', custom: true }, 15).label).toBe('My goal 10');
});
test.each([
  ['10 pull-ups', 10, 1, '1 pull-up'],
  ['10 pull-ups', 10, 3, '3 pull-ups'],
  ['1 pull-up', 1, 5, '5 pull-ups'],
  ['5 chest-to-bar pull-ups', 5, 1, '1 chest-to-bar pull-up'],
  ['10 clap push-ups', 10, 1, '1 clap push-up'],
  ['20 jump squats', 20, 1, '1 jump squat'],
  ['Crow 15 s', 15, 20, 'Crow 20 s'],
  ['-3 kg', 3, 5, '-5 kg'],
  ['110 dips', 110, 1, '1 dip'],
])('retarget upraví tvar „%s“ → %i/%i', (label, from, to, out) => {
  expect(retarget({ ...m('a', from), label }, to).label).toBe(out);
});

test('retarget okraje (QA): 110, 0, znaménko, chybějící číslo', () => {
  expect(retarget({ ...m('a', 10), label: '10 pull-ups' }, 110).label).toBe('110 pull-ups');
  expect(retarget({ ...m('a', 10), label: '10 pull-ups' }, 0).label).toBe('0 pull-ups');
  expect(retarget({ ...m('a', 3), label: '-3 kg' }, 5).label).toBe('-5 kg');
  const r = retarget({ ...m('a', 10), label: 'Handstand' }, 4);
  expect(r.label).toBe('Handstand');
  expect(r.target).toBe(4);
});
