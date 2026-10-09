import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import LessonScreen from '@/app/lesson/[id]';
import { splitTip } from '@/components/lesson/tip';
import { copy } from '@/data/copy';
import { EXERCISES } from '@/data/exercises';
import { REST } from '@/logic/lessonFlow';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import type { Exercise } from '@/types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));
jest.mock('@/lib/navGuard', () => ({ markNavigation: jest.fn() }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'bc-1-1' }),
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn(), dismissTo: jest.fn() },
}));
// Skia a choreografie nejsou předmětem testu: tečky a karta jako průhledné obaly.
jest.mock('@/components/dots', () => ({
  DotRing: ({ children }: { children?: unknown }) => children ?? null,
  IntentScrollView: ({ children }: { children?: unknown }) => children ?? null,
  DotField: () => null,
}));
jest.mock('@/components/dots/ReactiveBackground', () => ({ ReactiveBackground: ({ children }: { children?: unknown }) => children ?? null }));
jest.mock('@/components/lesson/ExerciseCard', () => ({ ExerciseCard: () => null, ExerciseTitle: () => null }));
jest.mock('@/components/lesson/LessonProgress', () => ({ LessonProgress: () => null }));
jest.mock('@/components/mascot/GuideBubble', () => ({ GuideBubble: () => null }));
type SceneProps = { onRate?: (f: 'easy' | 'right' | 'hard') => Promise<void>; onContinue(): void };
let mockScene: SceneProps | null = null;
jest.mock('@/components/lesson/LessonCompleteScene', () => ({
  LessonCompleteScene: (p: SceneProps) => { mockScene = p; return null; },
}));

const mockReps = Object.values(EXERCISES).filter((e) => e.type === 'reps').slice(0, 3) as Exercise[];
const reps = mockReps;
let mockDemo = false;
jest.mock('@/hooks/useLesson', () => ({
  useLesson: () => ({
    status: 'ready', retry: jest.fn(), refresh: jest.fn(),
    data: { lesson: { id: 'bc-1-1', title: 'T', plateKg: 5 }, exercises: mockReps, state: 'current', extras: [0, 0, 0], baseAmounts: [1, 1, 1] },
  }),
}));
jest.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ status: 'ready', data: { demo: mockDemo, equipped: {} } }) }));
jest.mock('@/hooks/useGuide', () => ({ useGuide: () => ({ id: null, dismiss: jest.fn() }) }));
jest.mock('@/hooks/useGoals', () => ({ useFinishSetup: () => ({ needed: false }) }));
const mockComplete = jest.fn();
const mockRate = jest.fn();
jest.mock('@/services', () => ({
  services: {
    lessons: { completeLesson: (...a: unknown[]) => mockComplete(...a) },
    user: { rateLesson: (...a: unknown[]) => mockRate(...a) },
  },
}));

let renderer: TestRenderer.ReactTestRenderer | null = null;
const render = () => {
  act(() => { renderer = TestRenderer.create(<ThemeContext.Provider value={buildTheme('dark', null)}><LessonScreen /></ThemeContext.Provider>); });
  return renderer!.root;
};
const button = (root: ReactTestInstance, label: string) =>
  root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
const press = (root: ReactTestInstance, label: string) => {
  const b = button(root, label);
  if (!b) throw new Error(`Tlačítko ${label} nenalezeno`);
  act(() => { b.props.onPress(); });
};
const texts = (root: ReactTestInstance) => root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);
const restTimer = (root: ReactTestInstance) => root.findAll((n) => n.props.testID === 'rest-timer' && typeof n.type === 'string')[0];
const restLeft = (root: ReactTestInstance) => Number((restTimer(root)?.props.accessibilityLabel as string | undefined)?.match(/(\d+) seconds/)?.[1]);
const dose = (e: Exercise) => copy.lesson.dose(e.amount, e.type === 'hold');

beforeEach(() => {
  jest.useFakeTimers(); mockDemo = false; mockScene = null;
  mockComplete.mockReset(); mockRate.mockReset(); mockRate.mockResolvedValue(undefined);
  mockComplete.mockResolvedValue({ stageBefore: 1, stageAfter: 1, unlockedLessonId: null, xp: { total: 10 } });
});
afterEach(() => { act(() => { renderer?.unmount(); }); renderer = null; jest.useRealTimers(); });

test('cvik: tip (1. věta), Next up s dávkou, velké Done', () => {
  const root = render();
  const all = texts(root);
  expect(all).toContain(splitTip(reps[0]!.description).tip);
  expect(all).toContain(copy.lesson.nextUp(reps[1]!.name, dose(reps[1]!)));
  expect(button(root, copy.common.done)).toBeDefined();
});

test('Done → pauza 30 s s dalším cvikem a tipem → Skip rest → další cvik', () => {
  const root = render();
  press(root, copy.common.done);
  expect(restLeft(root)).toBe(REST.seconds);
  expect(texts(root)).toEqual(expect.arrayContaining([reps[1]!.name, dose(reps[1]!), splitTip(reps[1]!.description).tip]));
  press(root, copy.lesson.restSkip);
  expect(restTimer(root)).toBeUndefined();
  expect(texts(root)).toContain(copy.lesson.nextUp(reps[2]!.name, dose(reps[2]!)));
});

test('+15 s prodlouží pauzu; odpočet běží z času (skok hodin = zamčený telefon) a v nule pokračuje sám', () => {
  const root = render();
  press(root, copy.common.done);
  act(() => { jest.advanceTimersByTime(10_000); });
  expect(restLeft(root)).toBe(20);
  press(root, copy.lesson.restExtend);
  act(() => { jest.advanceTimersByTime(250); });
  expect(restLeft(root)).toBe(35);
  // Zamčení: časovače stojí, hodiny jdou dál. Po probuzení jediný tik dopočítá zbytek.
  jest.setSystemTime(Date.now() + 30_000);
  act(() => { jest.advanceTimersByTime(250); });
  expect(restLeft(root)).toBe(5);
  act(() => { jest.advanceTimersByTime(5_000); });
  expect(restTimer(root)).toBeUndefined();
  expect(texts(root)).toContain(copy.lesson.nextUp(reps[2]!.name, dose(reps[2]!)));
});

test('+15 s má strop REST.maxS', () => {
  const root = render();
  press(root, copy.common.done);
  for (let i = 0; i < 10 && button(root, copy.lesson.restExtend); i++) press(root, copy.lesson.restExtend);
  act(() => { jest.advanceTimersByTime(250); });
  expect(restLeft(root)).toBeLessThanOrEqual(REST.maxS);
  expect(button(root, copy.lesson.restExtend)).toBeUndefined();
});

test('demo skip přeskočí cvik i pauzu', () => {
  mockDemo = true;
  const root = render();
  press(root, copy.lesson.skip);
  expect(restTimer(root)).toBeUndefined();
  expect(texts(root)).toContain(copy.lesson.nextUp(reps[2]!.name, dose(reps[2]!)));
});

async function finish(root: ReactTestInstance) {
  press(root, copy.common.done); press(root, copy.lesson.restSkip);
  press(root, copy.common.done); press(root, copy.lesson.restSkip);
  expect(texts(root)).toContain(copy.lesson.lastOne);
  await act(async () => { button(root, copy.common.done)!.props.onPress(); });
  expect(restTimer(root)).toBeUndefined();
  expect(mockScene).not.toBeNull();
}

test('po posledním cviku bez pauzy rovnou oslava; hodnocení jde se stejným attemptId jako dokončení', async () => {
  const root = render();
  await finish(root);
  const attemptId = mockComplete.mock.calls[0]![1];
  await act(async () => { await mockScene!.onRate!('easy'); });
  expect(mockRate).toHaveBeenCalledTimes(1);
  expect(mockRate).toHaveBeenCalledWith(attemptId, 'easy');
});

test('Continue bez hodnocení nic neuloží', async () => {
  const root = render();
  await finish(root);
  act(() => { mockScene!.onContinue(); });
  expect(mockRate).not.toHaveBeenCalled();
});
