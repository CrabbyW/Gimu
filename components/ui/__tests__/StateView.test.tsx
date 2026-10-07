import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { StateView, skeletonRowOpacity } from '@/components/ui/StateView';
import { copy } from '@/data/copy';
import { motion } from '@/lib/motion';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));
let mockReduced = false;
jest.mock('@/lib/motion', () => ({ ...jest.requireActual('@/lib/motion'), useMotionSafe: () => ({ reduced: mockReduced }) }));
const mockRepeat = jest.fn();
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return { __esModule: true, ...actual, default: actual.default, withRepeat: (...a: unknown[]) => { mockRepeat(...a); return actual.withRepeat(...a); } };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

type P = Parameters<typeof StateView>[0];
const render = (props: P) => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => {
    r = TestRenderer.create(
      <ThemeContext.Provider value={buildTheme('dark', null)}>
        <StateView {...props} />
      </ThemeContext.Provider>,
    );
  });
  return r!;
};
const texts = (root: ReactTestInstance) => root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);
const button = (root: ReactTestInstance) => root.find((n) => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function');
const progress = (root: ReactTestInstance) => root.findAll((n) => n.props.accessibilityRole === 'progressbar' && n.props.accessible === true);

beforeEach(() => { jest.useFakeTimers(); mockReduced = false; mockRepeat.mockClear(); });
afterEach(() => jest.useRealTimers());

test('loading: přístupný progressbar „Loading“ (busy), tečky skeletonu až po zpoždění', () => {
  const r = render({ kind: 'loading' });
  const [bar] = progress(r.root);
  expect(bar!.props.accessibilityLabel).toBe(copy.common.loading);
  expect(bar!.props.accessibilityState).toEqual({ busy: true });
  const dotsBefore = r.root.findAll((n) => n.props.importantForAccessibility === 'no-hide-descendants').length;
  expect(dotsBefore).toBe(0);
  act(() => { jest.advanceTimersByTime(motion.stateView.skeletonDelayMs); });
  expect(r.root.findAll((n) => n.props.importantForAccessibility === 'no-hide-descendants').length).toBeGreaterThan(0);
});

test('error: věta co se pokazilo + co udělat, Retry zavolá handler, věta je alert', () => {
  const onRetry = jest.fn();
  const r = render({ kind: 'error', what: copy.common.loadTarget.path, onRetry });
  const t = texts(r.root);
  expect(t).toContain(copy.common.loadError(copy.common.loadTarget.path));
  expect(t).toContain(copy.common.loadErrorHint);
  expect(r.root.find((n) => n.props.accessibilityRole === 'alert' && n.props.children === copy.common.loadError(copy.common.loadTarget.path))).toBeTruthy();
  const b = button(r.root);
  expect(b.props.accessibilityLabel ?? '').not.toBe('');
  act(() => { b.props.onPress(); });
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('error: opička je dekorace (skrytá pro čtečku)', () => {
  const r = render({ kind: 'error', what: 'x', onRetry: jest.fn() });
  expect(r.root.findAll((n) => n.props['aria-hidden'] === true).length).toBeGreaterThan(0);
});

test('error s vlastní zprávou: bez věty o datech, vlastní popisek akce', () => {
  const r = render({ kind: 'error', message: 'Locked.', actionLabel: copy.common.back, onRetry: jest.fn() });
  const t = texts(r.root);
  expect(t).toContain('Locked.');
  expect(t).not.toContain(copy.common.loadErrorHint);
});

test('empty: pozvánka s akcí; inline jen věta', () => {
  const onAction = jest.fn();
  const r = render({ kind: 'empty', title: 'No rivals yet', message: copy.progress.weightEmpty, actionLabel: copy.common.start, onAction });
  expect(texts(r.root)).toEqual(expect.arrayContaining(['No rivals yet', copy.progress.weightEmpty]));
  act(() => { button(r.root).props.onPress(); });
  expect(onAction).toHaveBeenCalled();
  const inline = render({ kind: 'empty', inline: true, message: copy.progress.activityEmpty });
  expect(new Set(texts(inline.root))).toEqual(new Set([copy.progress.activityEmpty]));
  expect(inline.root.findAll((n) => n.props.accessibilityRole === 'button')).toHaveLength(0);
});

const SV = motion.stateView;
const rows = (root: ReactTestInstance) => root.findAll((n) => n.props.testID === 'skeleton-row' && typeof n.type !== 'string');

test('skeleton: před 300 ms nic a žádný pulz; po zpoždění vstup a jeden sdílený pulz (vlna, ne spinner)', () => {
  expect(SV.skeletonDelayMs).toBe(300);
  const r = render({ kind: 'loading' });
  act(() => { jest.advanceTimersByTime(SV.skeletonDelayMs - 1); });
  expect(rows(r.root)).toHaveLength(0);
  expect(mockRepeat).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(1); });
  expect(rows(r.root).length).toBeGreaterThan(0);
  expect(mockRepeat).toHaveBeenCalledTimes(1);
  expect(mockRepeat.mock.calls[0]![1]).toBe(-1);
});

test('skeleton s omezeným pohybem: statický (žádný pulz ani vstup), tečky plně viditelné', () => {
  mockReduced = true;
  const r = render({ kind: 'loading' });
  act(() => { jest.advanceTimersByTime(SV.skeletonDelayMs); });
  expect(rows(r.root).length).toBeGreaterThan(0);
  expect(mockRepeat).not.toHaveBeenCalled();
  const flat = (st: unknown): Record<string, unknown> => Object.assign({}, ...[st].flat(Infinity).filter(Boolean));
  for (const row of rows(r.root)) expect(flat(row.props.style).opacity ?? 1).toBe(1);
});

test('skeletonRowOpacity: dech v mezích, řady posunuté ve fázi (vlna shora dolů)', () => {
  for (let t = 0; t <= 1; t += 0.05) {
    const o = skeletonRowOpacity(t, 0);
    expect(o).toBeGreaterThanOrEqual(SV.pulseMin - 1e-9);
    expect(o).toBeLessThanOrEqual(SV.pulseMax + 1e-9);
  }
  expect(skeletonRowOpacity(0, 0)).toBeCloseTo(SV.pulseMin);
  expect(skeletonRowOpacity(0.5, 0)).toBeCloseTo(SV.pulseMax);
  expect(skeletonRowOpacity(0.5 + SV.rowStagger, 1)).toBeCloseTo(SV.pulseMax);
});
