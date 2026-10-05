import TestRenderer, { act } from 'react-test-renderer';
import { DotRing } from '@/components/dots';
import { HoldTimer, holdFraction } from '@/components/lesson/HoldTimer';
import type { HoldTimer as HoldTimerState } from '@/components/lesson/useHoldTimer';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const timer = (secondsLeft: number): HoldTimerState => ({
  status: 'running', secondsLeft, countdown: 0, progress: { value: secondsLeft / 30 } as HoldTimerState['progress'],
  start: jest.fn(), pause: jest.fn(),
});

/** Skia props jsou sdílené hodnoty (nástup spirálou běží na UI vlákně): test čte aktuální hodnotu. */
const len = (p: unknown) => ((p !== null && typeof p === 'object' && 'value' in p ? (p as { value: unknown[] }).value : p) as unknown[]).length;

test('HoldTimer při 50 % rozsvítí polovinu teček prstence', () => {
  jest.useFakeTimers();
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme('light', null)}><HoldTimer timer={timer(15)} total={30} /></ThemeContext.Provider>); });
  // Nástup prstence spirálou (motion.dotScanMs) doběhne.
  act(() => { jest.advanceTimersByTime(2000); });
  const ring = r!.root.findByType(DotRing);
  expect(ring.props.progress).toBe(0.5);
  // Light (bez záře): Points = vnější rastr, zhasnuté, rozsvícené.
  const pts = ring.findAll((n) => n.props.skiaType === 'Points' && typeof n.type === 'string');
  expect(len(pts[2]!.props.points)).toBe(len(pts[1]!.props.points));
  expect(len(pts[2]!.props.points)).toBeGreaterThan(0);
  jest.useRealTimers();
});

test('holdFraction ořezává a bez délky svítí celý', () => {
  expect(holdFraction(40, 30)).toBe(1);
  expect(holdFraction(-1, 30)).toBe(0);
  expect(holdFraction(10)).toBe(1);
});
