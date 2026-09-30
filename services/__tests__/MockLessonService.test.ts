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
