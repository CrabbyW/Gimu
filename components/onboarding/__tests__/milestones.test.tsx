import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import MilestonesStep from '@/app/onboarding/milestones';
import { useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
/* eslint-enable @typescript-eslint/no-require-imports */
// Ikony jsou ESM balíček mimo transformaci Jestu; pro chování obrazovky nejsou podstatné.
jest.mock('lucide-react-native', () => ({ Plus: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  // Test renderer nemá skutečnou navigaci; obrazovka je vždy "zaostřená", efekt jen naběhne jednou při mountu.
  useFocusEffect: (effect: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(() => effect(), []); // eslint-disable-line react-hooks/exhaustive-deps
  },
}));

let renderer: TestRenderer.ReactTestRenderer | null = null;
const render = () => {
  act(() => {
    renderer = TestRenderer.create(
      <ThemeContext.Provider value={buildTheme('dark', null)}><MilestonesStep /></ThemeContext.Provider>,
    );
  });
  return renderer!.root;
};
const pressable = (root: ReactTestInstance, role: string, label: string) =>
  root.find((n) => n.props.accessibilityRole === role && n.props.accessibilityLabel === label && typeof n.props.onPress === 'function');
const chipLabels = (root: ReactTestInstance) =>
  root.findAll((n) => n.props.accessibilityRole === 'checkbox' && typeof n.props.onPress === 'function').map((n) => n.props.accessibilityLabel as string);
const typeInto = (root: ReactTestInstance, label: string, text: string) => {
  const input = root.find((n) => n.props.accessibilityLabel === label && typeof n.props.onChangeText === 'function');
  act(() => { input.props.onChangeText(text); });
};

beforeEach(() => {
  useOnboardingDraft.getState().reset();
  useOnboardingDraft.getState().set({ path: 'power' });
});
afterEach(() => {
  act(() => { renderer?.unmount(); });
  renderer = null;
});

test('vlastní milník po odznačení zůstane mezi chipy a jde znovu vybrat', () => {
  const root = render();
  act(() => { pressable(root, 'button', 'Vlastní milník').props.onPress(); });
  typeInto(root, 'Název', 'Stojka bez zdi');
  act(() => { pressable(root, 'radio', 'Sekundy').props.onPress(); });
  typeInto(root, 'Cíl', '30');
  act(() => { pressable(root, 'button', 'Přidat milník').props.onPress(); });
  expect(useOnboardingDraft.getState().milestones.map((m) => m.label)).toEqual(['Stojka bez zdi']);

  act(() => { pressable(root, 'checkbox', 'Stojka bez zdi 30 s').props.onPress(); });
  expect(useOnboardingDraft.getState().milestones).toEqual([]);
  expect(chipLabels(root)).toContain('Stojka bez zdi 30 s');

  act(() => { pressable(root, 'checkbox', 'Stojka bez zdi 30 s').props.onPress(); });
  expect(useOnboardingDraft.getState().milestones.map((m) => m.label)).toEqual(['Stojka bez zdi']);
});
