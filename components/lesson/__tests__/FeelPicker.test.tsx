import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { FeelPicker } from '@/components/lesson/FeelPicker';
import { copy } from '@/data/copy';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const t = copy.complete;
const texts = (root: ReactTestInstance) => root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);
const radio = (root: ReactTestInstance, label: string) =>
  root.findAll((n) => n.props.accessibilityRole === 'radio' && n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0]!;

const render = (onRate: jest.Mock) => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme('dark', null)}><FeelPicker onRate={onRate} /></ThemeContext.Provider>); });
  return r!;
};

test('Easy → jedno uložení a potvrzení „harder“; druhé ťuknutí nic', async () => {
  const onRate = jest.fn().mockResolvedValue(undefined);
  const r = render(onRate);
  expect(texts(r.root)).toContain(t.feelQuestion);
  await act(async () => { radio(r.root, t.feel.easy).props.onPress(); });
  await act(async () => { radio(r.root, t.feel.hard).props.onPress(); });
  expect(onRate).toHaveBeenCalledTimes(1);
  expect(onRate).toHaveBeenCalledWith('easy');
  expect(texts(r.root)).toContain(t.feelDone.easy);
  act(() => r.unmount());
});

test('Right a Hard mají vlastní potvrzení; chyba uložení řekne, že lekce platí', async () => {
  const ok = jest.fn().mockResolvedValue(undefined);
  const r1 = render(ok);
  await act(async () => { radio(r1.root, t.feel.right).props.onPress(); });
  expect(texts(r1.root)).toContain(t.feelDone.right);
  act(() => r1.unmount());
  const r2 = render(ok);
  await act(async () => { radio(r2.root, t.feel.hard).props.onPress(); });
  expect(texts(r2.root)).toContain(t.feelDone.hard);
  act(() => r2.unmount());
  const bad = jest.fn().mockRejectedValue(new Error('x'));
  const r3 = render(bad);
  await act(async () => { radio(r3.root, t.feel.easy).props.onPress(); });
  expect(texts(r3.root)).toContain(t.feelError);
  act(() => r3.unmount());
});

test('bez ťuknutí se nic neuloží', () => {
  const onRate = jest.fn();
  const r = render(onRate);
  act(() => r.unmount());
  expect(onRate).not.toHaveBeenCalled();
});
