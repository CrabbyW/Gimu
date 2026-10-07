 
 
import { services } from '@/services';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => { await services.user.reset(); });

const input = { path: 'power' as const, dreamBody: 'Free handstand.', milestones: [], weightGoal: { kind: 'none' as const } };

test('krátký onboarding: guideSeen se plní jednou, completeSetup přepne setupDone', async () => {
  await services.user.completeOnboarding({ ...input, setupDone: false });
  await services.user.markGuideSeen('mapStart');
  await services.user.markGuideSeen('mapStart');
  let p = await services.user.getProfile();
  expect(p?.guideSeen).toEqual(['mapStart']);
  expect(p?.setupDone).toBe(false);
  await services.user.completeSetup();
  p = await services.user.getProfile();
  expect(p?.setupDone).toBe(true);
});

test('starý profil: markGuideSeen ani completeSetup ho nezmění', async () => {
  await services.user.completeOnboarding(input);
  await services.user.markGuideSeen('mapStart');
  await services.user.completeSetup();
  const p = await services.user.getProfile();
  expect(p?.guideSeen).toBeUndefined();
  expect(p?.setupDone).toBeUndefined();
});
