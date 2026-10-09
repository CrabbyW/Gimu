import { createElement } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { feedback } from '@/lib/feedback';
import { FEEDBACK_MAP } from '@/lib/feedbackMap';
import { restCue, useRestTimer, type RestTimer } from '../useRestTimer';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));
const cues = () => (feedback as jest.Mock).mock.calls.map((c) => c[0]);

let appStateListener: ((s: AppStateStatus) => void) | null = null;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, fn) => {
    appStateListener = fn as (s: AppStateStatus) => void;
    return { remove: () => { appStateListener = null; } } as ReturnType<typeof AppState.addEventListener>;
  });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

function mount(seconds: number, onEnd: () => void) {
  const ref: { current: RestTimer | null } = { current: null };
  function Probe() { ref.current = useRestTimer(onEnd, seconds); return null; }
  act(() => { TestRenderer.create(createElement(Probe)); });
  return () => { if (!ref.current) throw new Error('hook nevykreslen'); return ref.current; };
}

test('restCue: jen posledních 3 s, každá sekunda jednou, v nule nic', () => {
  expect(restCue(3500, null)).toBeNull();
  expect(restCue(3000, null)).toBe(3);
  expect(restCue(2900, 3)).toBeNull();
  expect(restCue(2000, 3)).toBe(2);
  expect(restCue(0, 1)).toBeNull();
});

test('mapa: nová id pauzy a pocitu, konec výraznější než tik', () => {
  expect(FEEDBACK_MAP.restTick).toEqual(['soft', 'tick']);
  expect(FEEDBACK_MAP.restEnd).toEqual(['heavy', 'snap']);
  expect(FEEDBACK_MAP.restExtend).toEqual(['light', null]);
  expect(FEEDBACK_MAP.feelSelect).toEqual(['selection', 'select']);
});

test('tiky jen v posledních 3 s, jednou za sekundu; konec jednou', () => {
  const onEnd = jest.fn();
  mount(10, onEnd);
  act(() => { jest.advanceTimersByTime(6900); });
  expect(cues()).toEqual([]);
  act(() => { jest.advanceTimersByTime(3500); });
  expect(cues()).toEqual(['restTick', 'restTick', 'restTick', 'restEnd']);
  act(() => { jest.advanceTimersByTime(5000); });
  expect(cues()).toEqual(['restTick', 'restTick', 'restTick', 'restEnd']);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test('zamčený telefon: po návratu jeden konec, žádné dohnané tiky', () => {
  const onEnd = jest.fn();
  mount(30, onEnd);
  // Interval během zámku neběží: posuneme jen hodiny a pak pošleme „active“.
  jest.setSystemTime(Date.now() + 60_000);
  act(() => { appStateListener?.('active'); });
  act(() => { appStateListener?.('active'); jest.advanceTimersByTime(1000); });
  expect(cues()).toEqual(['restEnd']);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test('+15 s: lehké potvrzení, prstenec ubývá z ms', () => {
  const timer = mount(30, jest.fn());
  act(() => { jest.advanceTimersByTime(1500); });
  expect(timer().progress).toBeGreaterThan(0.94);
  expect(timer().progress).toBeLessThan(0.96);
  act(() => { timer().extend(); });
  expect(cues()).toEqual(['restExtend']);
  expect(timer().total).toBe(45);
});
