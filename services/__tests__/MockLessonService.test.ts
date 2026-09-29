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
