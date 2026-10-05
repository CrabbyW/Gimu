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

test('HoldTimer při 50 % rozsvítí polovinu teček prstence', () => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme('light', null)}><HoldTimer timer={timer(15)} total={30} /></ThemeContext.Provider>); });
  const ring = r!.root.findByType(DotRing);
  expect(ring.props.progress).toBe(0.5);
  // Light (bez záře): Points = vnější rastr, zhasnuté, rozsvícené.
  const pts = ring.findAll((n) => n.props.skiaType === 'Points' && typeof n.type === 'string');
  expect(pts[2]!.props.points).toHaveLength(pts[1]!.props.points.length);
});

test('holdFraction ořezává a bez délky svítí celý', () => {
  expect(holdFraction(40, 30)).toBe(1);
  expect(holdFraction(-1, 30)).toBe(0);
  expect(holdFraction(10)).toBe(1);
});
