import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import DreamStep from '@/app/onboarding/dream';
import { useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

let renderer: TestRenderer.ReactTestRenderer | null = null;
const render = () => {
  act(() => {
    renderer = TestRenderer.create(
      <ThemeContext.Provider value={buildTheme('dark', null)}><DreamStep /></ThemeContext.Provider>,
    );
  });
  return renderer!.root;
};
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

const card = (root: ReactTestInstance, prefix: string) =>
  root.find((n) => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function' && String(n.props.accessibilityLabel).startsWith(prefix));
const hasField = (root: ReactTestInstance) => root.findAll((n) => n.props.accessibilityLabel === 'Tvoje vize' && typeof n.props.onChangeText === 'function').length > 0;

test('karta uloží svůj titulek jako dreamBody a je vybraná právě jedna', () => {
  const root = render();
  act(() => { card(root, 'Muscle-up').props.onPress(); });
  expect(useOnboardingDraft.getState().dreamBody).toBe('Muscle-up');
  act(() => { card(root, 'V-tvar').props.onPress(); });
  expect(useOnboardingDraft.getState().dreamBody).toBe('V-tvar');
  const checked = root.findAll((n) => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function' && n.props.accessibilityState?.checked);
  expect(checked).toHaveLength(1);
  expect(hasField(root)).toBe(false);
});

test('„Vlastní…“ odkryje pole a předvolbu vymaže; vlastní text se uloží', () => {
  const root = render();
  act(() => { card(root, 'Muscle-up').props.onPress(); });
  act(() => { card(root, 'Vlastní').props.onPress(); });
  expect(useOnboardingDraft.getState().dreamBody).toBe('');
  expect(hasField(root)).toBe(true);
  typeInto(root, 'Tvoje vize', 'Stojka na jedné ruce');
  expect(useOnboardingDraft.getState().dreamBody).toBe('Stojka na jedné ruce');
});

test('návrat na krok s vlastním textem obnoví vlastní režim', () => {
  useOnboardingDraft.getState().set({ dreamBody: 'Stojka na jedné ruce' });
  const root = render();
  expect(hasField(root)).toBe(true);
});
