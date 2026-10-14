import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { Circle, Path } from 'react-native-svg';
import { ExerciseSilhouette } from '@/components/lesson/ExerciseSilhouette';
import { silhouetteDots } from '@/logic/silhouette';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const theme = buildTheme('dark', null);
const render = (phase?: number): ReactTestRenderer => { let r!: ReactTestRenderer; act(() => { r = TestRenderer.create(
  <ThemeContext.Provider value={theme}><ExerciseSilhouette id="pushup" phase={phase} /></ThemeContext.Provider>); }); return r; };
const figure = (r: ReactTestRenderer) => r.root.findAllByType(Path).find((n) => n.props.testID === 'silhouette-figure')!;
/** Počet kruhů v Path (každý začíná `M`) a y první tečky. */
const subpaths = (d: string) => d.split('M').filter(Boolean);
const firstY = (d: string) => Number(subpaths(d)[0]!.split('a')[0]!.split(' ')[1]);

it('postava = jeden Path v barvě textu (všechny tečky kromě oka), oko jeden Circle v live, zem v faint', () => {
  const r = render(1);
  const fig = figure(r);
  expect(fig.props.fill).toBe(theme.c.text);
  expect(subpaths(fig.props.d)).toHaveLength(silhouetteDots('pushup', 1).length - 1);
  expect(firstY(fig.props.d)).toBeCloseTo(silhouetteDots('pushup', 1)[0]![1], 1);
  expect(r.root.findAllByType(Circle).filter((n) => n.props.fill === theme.c.live)).toHaveLength(1);
  expect(r.root.findAllByType(Path).some((n) => n.props.fill === theme.c.faint)).toBe(true);
  // Výkon: žádné stovky Circle uzlů — jen oko.
  expect(r.root.findAllByType(Circle)).toHaveLength(1);
});

it('bez phase startuje v první klíčové póze (smyčka z 0)', () => {
  const r = render();
  expect(firstY(figure(r).props.d)).toBeCloseTo(silhouetteDots('pushup', 0)[0]![1], 1);
  act(() => r.unmount());
});
