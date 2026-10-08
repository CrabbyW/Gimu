import TestRenderer, { act } from 'react-test-renderer';
import { ExerciseCard } from '@/components/lesson/ExerciseCard';
import { copy } from '@/data/copy';
import { EXERCISES } from '@/data/exercises';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import type { Exercise } from '@/types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
// Skia vrstvy (podlaha z teček, silueta) nejsou předmětem testu.
jest.mock('@/components/dots', () => ({ DotField: () => null }));
jest.mock('@/components/lesson/ExerciseSilhouette', () => ({ ExerciseSilhouette: () => null }));

const render = (exercise: Exercise) => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme('dark', null)}><ExerciseCard exercise={exercise} /></ThemeContext.Provider>); });
  const texts = r!.root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);
  act(() => { r!.unmount(); });
  return texts;
};

test('poznámka caution jen u náročných cviků', () => {
  const all = Object.values(EXERCISES);
  const caution = all.filter((e) => e.caution);
  expect(caution.length).toBeGreaterThan(0);
  for (const e of caution) expect(render(e)).toContain(copy.fitness.caution);
  for (const e of all.filter((x) => !x.caution && x.type === 'reps').slice(0, 5)) expect(render(e)).not.toContain(copy.fitness.caution);
});
