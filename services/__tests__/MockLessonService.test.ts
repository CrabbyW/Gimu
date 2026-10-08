import { LESSONS_BY_PATH } from '@/data/lessons';
import { services } from '@/services';
import { useDb } from '@/store/db';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage, jinak nejde vyžádat před importy
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeAll(async () => { await useDb.persist.rehydrate(); });
beforeEach(() => useDb.setState({ profile: null, revision: 0 }));

test('onboarding → dokončení lekce → mapa ukáže další uzel jako current', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  const r = await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  expect(r.unlockedLessonId).toBe('bc-1-2');
  const view = await services.lessons.getPath('bodyControl', new Date(2026, 8, 29, 10));
  expect(view.currentLessonId).toBe('bc-1-2');
  await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  expect(useDb.getState().profile!.activity).toHaveLength(1);
});

test('uzel mapy nese základní XP: lekce, boss, u dokončené opakování', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  const nodes = (await services.lessons.getPath('bodyControl', new Date(2026, 8, 29, 10))).sections[0]!.nodes;
  expect(nodes.find((n) => n.lesson.id === 'bc-1-1')!.xp).toBe(10);
  expect(nodes.find((n) => n.lesson.id === 'bc-1-2')!.xp).toBe(20);
  expect(nodes.find((n) => n.lesson.isBoss)!.xp).toBe(40);
});

test('getLesson vrací stav uzlu, aby zamčenou lekci šlo poznat před startem (QA kolo 1)', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  expect((await services.lessons.getLesson('bc-1-1')).state).toBe('current');
  expect((await services.lessons.getLesson('bc-1-boss')).state).toBe('locked');
  await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  expect((await services.lessons.getLesson('bc-1-1')).state).toBe('done');
  expect((await services.lessons.getLesson('bc-1-2')).state).toBe('current');
});

test('zamčenou lekci (např. přes deep link) nejde dokončit a nic se neuloží', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  await expect(services.lessons.completeLesson('bc-1-5', 'att-x', new Date(2026, 8, 29, 10))).rejects.toThrow();
  await expect(services.lessons.completeLesson('bc-1-boss', 'att-y', new Date(2026, 8, 29, 10))).rejects.toThrow();
  expect(useDb.getState().profile!.activity).toHaveLength(0);
  await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  // Opakování dokončené lekce zůstává povolené.
  await services.lessons.completeLesson('bc-1-1', 'att-2', new Date(2026, 8, 29, 11));
  expect(useDb.getState().profile!.activity).toHaveLength(2);
});

test('přeskočení (R44): lekce platí od poloviny, XP základu poměrně, dluh navýší další lekci', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  // bc-1-1: plank 30 s, hollow-hold 20 s, glute-bridge 12 opak.
  await expect(services.lessons.completeLesson('bc-1-1', 'att-s0', new Date(2026, 8, 29, 10), [true, false, false])).rejects.toThrow();
  const r = await services.lessons.completeLesson('bc-1-1', 'att-s1', new Date(2026, 8, 29, 10), [true, false, true]);
  expect(r.xp.base).toBe(Math.round(20 * (2 / 3))); // XP_RULES.lesson 20 → 13
  expect(r.unlockedLessonId).toBe('bc-1-2');
  expect(useDb.getState().profile?.trainingDebt).toMatchObject({ holdS: 20, share: { holdS: 5 } });
  // bc-1-2: plank, superman, side-plank — první výdrž dostane podíl dluhu, cviky drží i původní objem.
  const next = await services.lessons.getLesson('bc-1-2');
  expect(next.extras[0]).toBe(5);
  expect(next.exercises[0]!.amount).toBe(next.baseAmounts[0]! + 5);
});

test('QA R44-2: retry se stejným attemptId nezapočítá dluh dvakrát; špatná délka done se odmítne', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  const a = await services.lessons.completeLesson('bc-1-1', 'att-r', new Date(2026, 8, 29, 10), [true, false, true]);
  const after = useDb.getState().profile!;
  const b = await services.lessons.completeLesson('bc-1-1', 'att-r', new Date(2026, 8, 29, 12), [true, false, true]);
  expect(useDb.getState().profile).toBe(after);
  expect(after.trainingDebt).toMatchObject({ holdS: 20 });
  expect(b.xp.total).toBe(a.xp.total);
  await expect(services.lessons.completeLesson('bc-1-2', 'att-len', new Date(2026, 8, 29, 13), [true])).rejects.toThrow();
  expect(useDb.getState().profile).toBe(after);
});

test('QA R44-2: boss lekce se skipem — XP základu poměrně z 40', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  const all = LESSONS_BY_PATH.bodyControl; const ids = all.slice(0, all.findIndex((l) => l.isBoss)).map((l) => l.id);
  for (const [i, id] of ids.entries()) await services.lessons.completeLesson(id, `att-${i}`, new Date(2026, 8, 29, 10 + i));
  const boss = await services.lessons.getLesson('bc-1-boss');
  const n = boss.exercises.length;
  const done = boss.exercises.map((_, i) => i !== 0);
  const r = await services.lessons.completeLesson('bc-1-boss', 'att-b', new Date(2026, 8, 29, 18), done);
  expect(r.xp.base).toBe(Math.round(40 * ((n - 1) / n)));
});

describe('vstupní test škáluje dávky (elite fáze 5)', () => {
  const onboard = () => services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  test('bez testu výchozí dávky; slabý test poloviční; silný 1.5×', async () => {
    await onboard();
    const base = (await services.lessons.getLesson('bc-1-1')).exercises.map((e) => e.amount);
    expect(base).toEqual([30, 20, 12]);
    await services.user.saveFitnessTest({ pushups: 2, plankS: 10 }, new Date(2026, 9, 8));
    expect((await services.lessons.getLesson('bc-1-1')).exercises.map((e) => e.amount)).toEqual([15, 10, 6]);
    await services.user.saveFitnessTest({ pushups: 40, plankS: 120 }, new Date(2026, 9, 8));
    expect((await services.lessons.getLesson('bc-1-1')).exercises.map((e) => e.amount)).toEqual([45, 30, 18]);
  });
  test('uložení očistí vstupy a zapíše čas a připravenost', async () => {
    await onboard();
    await services.user.saveFitnessTest({ pushups: -3, plankS: NaN, readiness: 'consult' }, new Date('2026-10-08T08:00:00Z'));
    expect(useDb.getState().profile!.fitnessTest).toEqual({ pushups: 0, plankS: 0, kneePushups: false, testedAt: '2026-10-08T08:00:00.000Z', readiness: 'consult' });
  });
  test('dluh z přeskočení se počítá ze škálované dávky (lekce se dá dokončit)', async () => {
    await onboard();
    await services.user.saveFitnessTest({ pushups: 2, plankS: 10 }, new Date(2026, 9, 8));
    const r = await services.lessons.completeLesson('bc-1-1', 'a1', new Date(2026, 9, 8, 10), [true, true, false]);
    expect(r.unlockedLessonId).toBe('bc-1-2');
    expect(useDb.getState().profile!.trainingDebt?.reps).toBe(6);
  });
});
