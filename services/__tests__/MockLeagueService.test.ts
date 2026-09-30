import { services } from '@/services';
import { useDb } from '@/store/db';
import type { ActivityEvent } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage, jinak nejde vyžádat před importy
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeAll(async () => { await useDb.persist.rehydrate(); });
beforeEach(() => useDb.setState({ profile: null, revision: 0 }));

const NOW = new Date(2026, 8, 30, 10); // středa, týden od 2026-09-28
const LAST_WEEK = '2026-09-21';

async function seed(tier: 'wood' | 'diamond' = 'wood') {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  const p = useDb.getState().profile!;
  const activity: ActivityEvent[] = Array.from({ length: 7 }, (_, i) => {
    const day = `2026-09-${String(21 + i).padStart(2, '0')}`;
    return { id: `e${i}`, at: `${day}T10:00:00.000Z`, day, lessonId: 'bc-1-1', xp: 60 };
  });
  useDb.getState().setProfile({ ...p, leagueTier: tier, leagueWeek: LAST_WEEK, activity });
}

test('týden starý profil se 7 × 60 XP postoupí o stupeň a druhé volání profil nemění', async () => {
  await seed();
  const view = await services.league.getCurrentWeek(NOW);
  expect(view.tier).toBe('stone');
  expect(view.lastResult?.outcome).toBe('promote');
  expect(view.lastResult).toMatchObject({ fromTier: 'wood', toTier: 'stone', weekStart: LAST_WEEK });
  expect(view.weekStart).toBe('2026-09-28');
  expect(view.entries).toHaveLength(16);
  expect(view.promoteCount).toBe(5);
  expect(view.demoteCount).toBe(3);
  expect(view.endsAt).toEqual(new Date(2026, 9, 5));
  const me = view.entries.find((e) => e.isMe)!;
  expect(me.xpThisWeek).toBe(0); // nový týden začíná od nuly
  expect(view.entries[view.myRank - 1]!.isMe).toBe(true);

  const rev = useDb.getState().revision;
  await services.league.getCurrentWeek(NOW);
  expect(useDb.getState().revision).toBe(rev);
});

test('Dřevo nemá sestup, Diamant nemá postup', async () => {
  await seed('diamond');
  useDb.getState().setProfile({ ...useDb.getState().profile!, leagueWeek: '2026-09-28' });
  const view = await services.league.getCurrentWeek(NOW);
  expect(view.promoteCount).toBe(0);
  expect(view.demoteCount).toBe(3);
  expect(view.lastResult).toBeNull();
});

test('dismissLastResult smaže výsledek', async () => {
  await seed();
  await services.league.getCurrentWeek(NOW);
  await services.league.dismissLastResult();
  expect(useDb.getState().profile!.lastLeagueResult).toBeNull();
  expect((await services.league.getCurrentWeek(NOW)).lastResult).toBeNull();
});
