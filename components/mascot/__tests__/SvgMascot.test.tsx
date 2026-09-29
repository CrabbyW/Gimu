import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { Ellipse, Path, Svg } from 'react-native-svg';
import { buildTheme, type Scheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import type { Mood } from '@/types';
import { Mascot, MASCOT_SIZES } from '..';
import type { MascotProps } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
// ThemeProvider → settings store → AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// Reanimated 4 v Jestu: worklety bez nativního runtime.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const IDLE_MOUTH = 'M88 108 Q100 112 112 108';
const HAPPY_MOUTH = 'M86 104 Q100 122 114 104 Z';

const base: MascotProps = { stage: 1, mood: 'idle', size: 'M', cosmetics: {} };
const tree = (props: Partial<MascotProps>, scheme: Scheme = 'dark') => (
  <ThemeContext.Provider value={buildTheme(scheme, null)}>
    <Mascot {...base} {...props} />
  </ThemeContext.Provider>
);

let renderer: TestRenderer.ReactTestRenderer | null = null;
const unmount = () => {
  act(() => { renderer?.unmount(); });
  renderer = null;
};
const render = (props: Partial<MascotProps>, scheme?: Scheme) => {
  unmount();
  act(() => { renderer = TestRenderer.create(tree(props, scheme)); });
  return renderer!.root;
};
afterEach(() => {
  unmount();
  jest.restoreAllMocks();
});

const labelOf = (root: ReactTestInstance) => root.findAll((n) => n.props.accessibilityRole === 'image')[0]?.props.accessibilityLabel;
const mouthOpacity = (root: ReactTestInstance, d: string) => root.findAllByType(Path).find((p) => p.props.d === d)?.props.opacity;

test('výchozí popisek pro čtečku podle nálady, vlastní popisek má přednost', () => {
  expect(labelOf(render({ mood: 'idle' }))).toBe('Tvoje opice');
  expect(labelOf(render({ mood: 'happy' }))).toBe('Tvoje opice má radost');
  expect(labelOf(render({ mood: 'happy', accessibilityLabel: 'Opice Bruno' }))).toBe('Opice Bruno');
});

test('pojmenovaná velikost se převede na pt, číselná zůstane', () => {
  expect(render({ size: 'L' }).findByType(Svg).props.width).toBe(MASCOT_SIZES.L);
  expect(render({ size: 90 }).findByType(Svg).props.height).toBe(90);
});

test.each<[Mood, 'idle' | 'happy']>([
  ['idle', 'idle'],
  ['happy', 'happy'],
  ['celebrate', 'happy'], // plán B: vlastní animace
  ['sad', 'idle'], // plán B: vlastní animace
])('nálada %s ukáže pusu %s', (mood, face) => {
  const root = render({ mood });
  expect(mouthOpacity(root, IDLE_MOUTH)).toBe(face === 'idle' ? 1 : 0);
  expect(mouthOpacity(root, HAPPY_MOUTH)).toBe(face === 'happy' ? 1 : 0);
});

test.each<Scheme>(['light', 'dark'])('detaily obličeje jsou tmavé i v režimu %s (leží na světlém obličeji)', (scheme) => {
  const eyes = render({}, scheme).findAllByType(Ellipse).filter((e) => e.props.rx === 5);
  expect(eyes).toHaveLength(2);
  eyes.forEach((e) => expect(e.props.fill).toBe('#131316'));
});

test('stage 2/3 zatím kreslí stage 1 a ve vývoji varuje jednou za mount', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  render({ stage: 1 });
  expect(warn).not.toHaveBeenCalled();

  render({ stage: 2 });
  act(() => { renderer!.update(tree({ stage: 2, mood: 'happy' })); });
  act(() => { renderer!.update(tree({ stage: 3 })); });
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('stage 2');
});
