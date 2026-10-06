import type { ComponentProps } from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { PillButton } from '@/components/ui/PillButton';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));

const render = (props: Partial<ComponentProps<typeof PillButton>> & { onPress(): void }) => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => {
    r = TestRenderer.create(
      <ThemeContext.Provider value={buildTheme('dark', null)}>
        <PillButton label="Start lesson" {...props} />
      </ThemeContext.Provider>,
    );
  });
  return r!.root;
};
const texts = (root: ReactTestInstance) => root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);
const button = (root: ReactTestInstance) => root.find((n) => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function');

test('popisek se vykreslí jako [ZAČÍT LEKCI]', () => {
  expect(texts(render({ onPress: jest.fn() }))).toContain('[START LESSON]');
});

test('čtečka dostane větu bez závorek a roli tlačítka', () => {
  const b = button(render({ onPress: jest.fn() }));
  expect(b.props.accessibilityLabel).toBe('Start lesson');
  expect(b.props.accessibilityRole).toBe('button');
});

test('stisk volá onPress', () => {
  const onPress = jest.fn();
  const b = button(render({ onPress }));
  act(() => { b.props.onPress(); });
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('disabled nevolá onPress a hlásí stav', () => {
  const onPress = jest.fn();
  const b = button(render({ onPress, disabled: true }));
  act(() => { b.props.onPress(); });
  expect(onPress).not.toHaveBeenCalled();
  expect(b.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
});
