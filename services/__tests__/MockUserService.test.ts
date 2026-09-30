import { services } from '@/services';
import { useDb } from '@/store/db';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage, jinak nejde vyžádat před importy
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeAll(async () => { await useDb.persist.rehydrate(); });
beforeEach(() => useDb.setState({ profile: null, revision: 0 }));

test('druhý onboarding s existujícím profilem se odmítne a nepřepíše activity (QA kolo 1)', async () => {
  await services.user.completeOnboarding({ path: 'bodyControl', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } });
  await services.lessons.completeLesson('bc-1-1', 'att-1', new Date(2026, 8, 29, 10));
  expect(useDb.getState().profile!.activity).toHaveLength(1);

  await expect(
    services.user.completeOnboarding({ path: 'strength', dreamBody: 'y', milestones: [], weightGoal: { kind: 'none' } }),
  ).rejects.toThrow();

  expect(useDb.getState().profile!.path).toBe('bodyControl');
  expect(useDb.getState().profile!.activity).toHaveLength(1);
});
