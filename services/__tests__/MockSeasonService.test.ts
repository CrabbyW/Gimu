import { services } from '@/services';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/settings';
import type { ActivityEvent } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const ID = 'winter-arc-2026';
const ACTIVE = new Date(2026, 9, 5, 10);
const AFTER = new Date(2026, 11, 27, 9);

beforeAll(async () => { await useDb.persist.rehydrate(); });
beforeEach(() => { useDb.setState({ profile: null, revision: 0 }); useSettings.setState({ devTimeOffsetMs: 0 }); });

async function seed(days: number) {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  const p = useDb.getState().profile!;
  const activity: ActivityEvent[] = Array.from({ length: days }, (_, i) => {
    const day = `2026-09-${String(28 + i).padStart(2, '0')}`;
    return { id: `e${i}`, at: `${day}T10:00:00.000Z`, day, lessonId: 'bc-1-1', xp: 30 };
  });
  useDb.getState().setProfile({ ...p, createdAt: '2026-09-28T08:00:00.000Z', activity });
}

test('getLatest: active během sezóny, ended po konci, null před první', async () => {
  await seed(0);
  expect((await services.season.getLatest(ACTIVE))?.phase).toBe('active');
  expect((await services.season.getLatest(AFTER))?.phase).toBe('ended');
  expect(await services.season.getLatest(new Date(2026, 0, 1))).toBeNull();
});

test('setGoal: validace, uložení a progres', async () => {
  await seed(3);
  useSettings.setState({ devTimeOffsetMs: ACTIVE.getTime() - Date.now() });
  await expect(services.season.setGoal(ID, { kind: 'lessons', count: 0 })).rejects.toThrow('countRange');
  await services.season.setGoal(ID, { kind: 'lessons', count: 10 });
  expect((await services.season.getLatest(ACTIVE))?.goal).toEqual({ kind: 'lessons', count: 10 });
  const prog = await services.season.getProgress(ID, ACTIVE);
  expect(prog).toMatchObject({ value: 3, target: 10, met: false });
});

test('setGoal po konci sezóny hodí chybu', async () => {
  await seed(0);
  useSettings.setState({ devTimeOffsetMs: AFTER.getTime() - Date.now() });
  await expect(services.season.setGoal(ID, { kind: 'lessons', count: 10 })).rejects.toThrow();
});

test('getRecap před koncem hodí chybu; claimReward je idempotentní', async () => {
  await seed(3);
  useSettings.setState({ devTimeOffsetMs: ACTIVE.getTime() - Date.now() });
  await services.season.setGoal(ID, { kind: 'lessons', count: 2 });
  await expect(services.season.getRecap(ID, ACTIVE)).rejects.toThrow('not ended');
  const recap = await services.season.getRecap(ID, AFTER);
  expect(recap).toMatchObject({ lessons: 3, rewardEarned: true });
  const a = await services.season.claimReward(ID, AFTER);
  const b = await services.season.claimReward(ID, AFTER);
  expect(a).toEqual(['outfit-winter-arc-scarf']); expect(b).toEqual(a);
  const p = useDb.getState().profile!;
  expect(p.owned.filter((x) => x === 'outfit-winter-arc-scarf')).toHaveLength(1);
  expect(new Set(p.badges).size).toBe(p.badges.length);
  expect((await services.season.getLatest(AFTER))?.claimed).toBe(true);
});
