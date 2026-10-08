import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import FitnessTestScreen from '@/app/fitness-test';
import { copy } from '@/data/copy';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() },
}));
const mockSave = jest.fn<Promise<void>, [unknown, Date]>();
jest.mock('@/services', () => ({ services: { user: { saveFitnessTest: (t: unknown, now: Date) => mockSave(t, now) } } }));

const t = copy.fitness;
let renderer: TestRenderer.ReactTestRenderer | null = null;
const render = () => {
  act(() => { renderer = TestRenderer.create(<ThemeContext.Provider value={buildTheme('dark', null)}><FitnessTestScreen /></ThemeContext.Provider>); });
  return renderer!.root;
};
const press = (root: ReactTestInstance, label: string) => {
  const b = root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];
  if (!b) throw new Error(`Tlačítko ${label} nenalezeno`);
  act(() => { b.props.onPress(); });
};
const texts = (root: ReactTestInstance) => root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);
const input = (root: ReactTestInstance, label: string) =>
  root.find((n) => n.props.accessibilityLabel === label && typeof n.props.onChangeText === 'function');

beforeEach(() => { jest.useFakeTimers(); mockBack.mockReset(); mockSave.mockReset(); mockSave.mockResolvedValue(undefined); });
afterEach(() => { act(() => { renderer?.unmount(); }); renderer = null; jest.useRealTimers(); });

test('kroky: připravenost → kliky → plank → výsledek; disclaimer je vidět v každém kroku', () => {
  const root = render();
  expect(texts(root)).toEqual(expect.arrayContaining([t.readinessTitle, t.disclaimer]));
  press(root, t.next);
  expect(texts(root)).toEqual(expect.arrayContaining([t.pushupsTitle, t.disclaimer]));
  press(root, t.next);
  expect(texts(root)).toEqual(expect.arrayContaining([t.plankTitle, t.disclaimer]));
  press(root, t.next);
  expect(texts(root)).toEqual(expect.arrayContaining([t.resultTitle, t.disclaimer]));
  press(root, t.back);
  expect(texts(root)).toContain(t.plankTitle);
});

test('skip kdykoli zavře test bez uložení', () => {
  const root = render();
  press(root, t.skipShort);
  expect(mockBack).toHaveBeenCalledTimes(1);
  const root2 = render();
  press(root2, t.next);
  press(root2, t.skip); // křížek v hlavičce
  expect(mockBack).toHaveBeenCalledTimes(2);
  expect(mockSave).not.toHaveBeenCalled();
});

test('„ano“ ukáže upozornění, ale neblokuje; uloží se readiness consult', async () => {
  const root = render();
  const yes = root.findAll((n) => n.props.accessibilityRole === 'radio' && n.props.accessibilityLabel === t.yes && typeof n.props.onPress === 'function')[0]!;
  act(() => { yes.props.onPress(); });
  expect(texts(root)).toContain(t.consult);
  press(root, t.next);
  expect(texts(root)).toContain(t.pushupsTitle);
  press(root, t.next); press(root, t.next);
  await act(async () => { press(root, t.save); });
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ readiness: 'consult' }), expect.any(Date));
});

test('save volá service se zadanými hodnotami (pole, ±, kolena, stopky)', async () => {
  const root = render();
  press(root, t.next);
  act(() => { input(root, t.pushupsField).props.onChangeText('12'); });
  press(root, t.plus(1, t.repsWord));
  press(root, t.kneeToggle);
  press(root, t.next);
  // Stopky z časových značek: 42 s „venku“ (zamčený telefon) se započítá.
  const now = Date.now();
  const spy = jest.spyOn(Date, 'now').mockReturnValue(now);
  press(root, t.startTimer);
  spy.mockReturnValue(now + 42_400);
  act(() => { jest.advanceTimersByTime(300); });
  press(root, t.stopTimer);
  spy.mockRestore();
  press(root, t.next);
  expect(texts(root)).toContain(t.resultLine(0.5, 0.7));
  await act(async () => { press(root, t.save); });
  expect(mockSave).toHaveBeenCalledWith({ pushups: 13, plankS: 42, kneePushups: true, readiness: 'clear' }, expect.any(Date));
  expect(mockBack).toHaveBeenCalled();
});

test('nesmyslný vstup se ořízne (999 → strop, písmena → 0)', () => {
  const root = render();
  press(root, t.next);
  act(() => { input(root, t.pushupsField).props.onChangeText('999'); });
  expect(input(root, t.pushupsField).props.accessibilityValue.text).toBe(`100 ${t.reps}`);
  act(() => { input(root, t.pushupsField).props.onChangeText('ab'); });
  expect(input(root, t.pushupsField).props.accessibilityValue.text).toBe(`0 ${t.reps}`);
});

test('resultLine ukazuje násobek přesně (max. 2 desetinná, bez nul navíc)', () => {
  expect(t.resultLine(0.75, 1.5)).toBe('Lessons scaled: reps ×0.75, holds ×1.5');
  expect(t.resultLine(1, 0.5)).toBe('Lessons scaled: reps ×1, holds ×0.5');
});

test('nezadaná složka (0) ve výsledku = default, ne „0“; ± planku hlásí krok 5 s', () => {
  const root = render();
  press(root, t.next); press(root, t.next);
  expect(root.findAll((n) => n.props.accessibilityLabel === t.plus(5, t.secondsWord)).length).toBeGreaterThan(0);
  press(root, t.next);
  expect(texts(root)).toContain(t.resultDefault);
  expect(root.findAll((n) => n.props.accessibilityLabel === `${t.plankTitle}, ${t.resultDefault}`).length).toBeGreaterThan(0);
  expect(texts(root)).toContain(t.resultLine(1, 1));
});
