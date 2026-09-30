import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
/* eslint-enable @typescript-eslint/no-require-imports */

// Zachytí efekt z useFocusEffect, aby test mohl ručně řídit zaostření/rozostření obrazovky
// (test renderer nemá skutečnou navigaci mezi routami).
let focusEffect: (() => void | (() => void)) | null = null;
let focusCleanup: (() => void) | null = null;
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useFocusEffect: (effect: () => void | (() => void)) => { focusEffect = effect; },
}));

const runFocus = () => { act(() => { focusCleanup = focusEffect?.() ?? null; }); };
const runBlur = () => { act(() => { focusCleanup?.(); }); };

let renderer: TestRenderer.ReactTestRenderer | null = null;
const render = (onContinue: () => void) => {
  act(() => {
    renderer = TestRenderer.create(
      <ThemeContext.Provider value={buildTheme('dark', null)}>
        <OnboardingFrame step={1} title="t" lead="l" canContinue onContinue={onContinue}>
          <Text>obsah</Text>
        </OnboardingFrame>
      </ThemeContext.Provider>,
    );
  });
  return renderer!.root;
};
const continueBtn = (root: ReactTestInstance) => root.find((n) => n.props.accessibilityLabel === 'Pokračovat' && typeof n.props.onPress === 'function');

beforeEach(() => { focusEffect = null; focusCleanup = null; });
afterEach(() => {
  act(() => { renderer?.unmount(); });
  renderer = null;
});

test('rychlé dvojité/trojité ťuknutí na Pokračovat spustí onContinue jen jednou na zaostřenou obrazovku', () => {
  const onContinue = jest.fn();
  const root = render(onContinue);
  runFocus();
  const btn = continueBtn(root);
  act(() => { btn.props.onPress(); btn.props.onPress(); btn.props.onPress(); });
  expect(onContinue).toHaveBeenCalledTimes(1);
});

test('po rozostření a novém zaostření (návrat na krok) se brána znovu otevře', () => {
  const onContinue = jest.fn();
  const root = render(onContinue);
  runFocus();
  act(() => { continueBtn(root).props.onPress(); });
  expect(onContinue).toHaveBeenCalledTimes(1);

  runBlur();
  runFocus();
  act(() => { continueBtn(root).props.onPress(); });
  expect(onContinue).toHaveBeenCalledTimes(2);
});
