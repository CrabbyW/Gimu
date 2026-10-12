import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { Circle } from 'react-native-svg';
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

it('renders figure dots in text color for given phase', () => {
  const r = render(1);
  const fig = r.root.findAllByType(Circle).filter((n) => n.props.fill === theme.c.text);
  // Jedna tečka (střed hlavy = oko) je v akcentu `live`, ostatní v barvě textu.
  expect(fig).toHaveLength(silhouetteDots('pushup', 1).length - 1);
  expect(r.root.findAllByType(Circle).filter((n) => n.props.fill === theme.c.live)).toHaveLength(1);
  expect(fig[0]!.props.cy).toBeCloseTo(silhouetteDots('pushup', 1)[0]![1]);
  expect(r.root.findAllByType(Circle).some((n) => n.props.fill === theme.c.faint)).toBe(true);
});

it('bez phase startuje v první klíčové póze (smyčka z 0)', () => {
  const r = render();
  const fig = r.root.findAllByType(Circle).filter((n) => n.props.fill === theme.c.text);
  expect(fig[0]!.props.cy).toBeCloseTo(silhouetteDots('pushup', 0)[0]![1]);
  act(() => r.unmount());
});
