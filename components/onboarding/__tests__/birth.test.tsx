import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { BackHandler } from 'react-native';
import BirthStep from '@/app/onboarding/birth';
import { useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import type { Milestone, OnboardingInput } from '@/types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
/* eslint-enable @typescript-eslint/no-require-imports */

const mockReplace = jest.fn();
const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (href: string) => mockReplace(href) },
  Redirect: ({ href }: { href: string }) => { mockRedirect(href); return null; },
}));
const mockComplete = jest.fn<Promise<unknown>, [OnboardingInput]>();
jest.mock('@/services', () => ({ services: { user: { completeOnboarding: (input: OnboardingInput) => mockComplete(input) } } }));

const milestones: Milestone[] = [
  { id: 'pullups-10', label: '10 shybů', target: 10, unit: 'reps', current: 0, custom: false },
  { id: 'custom-1', label: 'Stojka', target: 30, unit: 'seconds', current: 0, custom: true },
];
const validDraft = { path: 'power' as const, dreamBody: 'Muscle-up do léta', milestones, weightKind: 'lose' as const, currentKg: '72,5', targetKg: '68' };

let renderer: TestRenderer.ReactTestRenderer | null = null;
const render = () => {
  act(() => { renderer = TestRenderer.create(<BirthStep />); });
  // Celá sekvence zrození až po zobrazení CTA.
  act(() => { jest.advanceTimersByTime(3000); });
  return renderer!.root;
};
const cta = (root: ReactTestInstance, label: string) =>
  root.find((n) => n.props.accessibilityRole === 'button' && n.props.accessibilityLabel === label && typeof n.props.onPress === 'function');
const texts = (root: ReactTestInstance) => root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);

beforeEach(() => {
  jest.useFakeTimers();
  mockReplace.mockReset(); mockRedirect.mockReset(); mockComplete.mockReset();
  useOnboardingDraft.getState().reset();
});
afterEach(() => {
  act(() => { renderer?.unmount(); });
  renderer = null;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('dvojí tap na „Jdeme trénovat“ uloží profil jen jednou a přejde na mapu', async () => {
  useOnboardingDraft.getState().set(validDraft);
  mockComplete.mockResolvedValue({});
  const root = render();
  const button = cta(root, 'Jdeme trénovat');
  await act(async () => { button.props.onPress(); button.props.onPress(); });
  expect(mockComplete).toHaveBeenCalledTimes(1);
  expect(mockComplete).toHaveBeenCalledWith({
    path: 'power', dreamBody: 'Muscle-up do léta', milestones, weightGoal: { kind: 'lose', startKg: 72.5, targetKg: 68 },
  });
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  expect(useOnboardingDraft.getState().path).toBeNull();
});

test('selhání uložení ukáže chybu a „Zkusit znovu“, druhý pokus projde', async () => {
  useOnboardingDraft.getState().set(validDraft);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockComplete.mockRejectedValueOnce(new Error('disk plný')).mockResolvedValueOnce({});
  const root = render();
  await act(async () => { cta(root, 'Jdeme trénovat').props.onPress(); });
  expect(texts(root)).toContain('Opici se nepodařilo uložit. Zkus to znovu.');
  expect(mockReplace).not.toHaveBeenCalled();
  expect(useOnboardingDraft.getState().path).toBe('power');
  await act(async () => { cta(root, 'Zkusit znovu').props.onPress(); });
  expect(mockComplete).toHaveBeenCalledTimes(2);
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});

test('hardwarové Zpět na Androidu oslavu nezavře', () => {
  const add = jest.spyOn(BackHandler, 'addEventListener');
  useOnboardingDraft.getState().set(validDraft);
  render();
  const handler = add.mock.calls.find(([event]) => event === 'hardwareBackPress')?.[1];
  expect(handler?.({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true);
});

test('štítek narození nese datum a cestu', () => {
  jest.setSystemTime(new Date(2026, 8, 29, 10, 0));
  useOnboardingDraft.getState().set(validDraft);
  expect(texts(render())).toContain('NAROZENA 29. 9. 2026 · Power');
});

test('neúplný koncept (např. po ztrátě stavu) vrátí na začátek onboardingu', () => {
  useOnboardingDraft.getState().set({ ...validDraft, milestones: [] });
  render();
  expect(mockRedirect).toHaveBeenCalledWith('/onboarding/path');
  expect(mockComplete).not.toHaveBeenCalled();
});
