import { createElement } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { haptics } from '@/lib/haptics';
import { useHoldTimer, type HoldTimer } from '../useHoldTimer';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage (lib/clock čte settings store)
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// Nativní worklets v jestu nejdou načíst; hook potřebuje jen sdílenou hodnotu a timing.
jest.mock('react-native-reanimated', () => ({
  Easing: { linear: (t: number) => t },
  useSharedValue: (init: number) => {
    const sv = { value: init, set(v: number) { sv.value = v; } };
    return sv;
  },
  withTiming: (to: number) => to,
}));
jest.mock('@/lib/haptics', () => ({ haptics: { tick: jest.fn(), holdDone: jest.fn() } }));

let appStateListener: ((s: AppStateStatus) => void) | null = null;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, fn) => {
    appStateListener = fn as (s: AppStateStatus) => void;
    return { remove: () => { appStateListener = null; } } as ReturnType<typeof AppState.addEventListener>;
  });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

function mount(seconds: number, onDone: () => void) {
  const ref: { current: HoldTimer | null } = { current: null };
  function Probe() { ref.current = useHoldTimer(seconds, onDone); return null; }
  act(() => { TestRenderer.create(createElement(Probe)); });
  const timer = () => { if (!ref.current) throw new Error('hook nevykreslen'); return ref.current; };
  return timer;
}

test('odpočet běží proti hodinám, v nule haptika a po 400 ms onDone', () => {
  const onDone = jest.fn();
  const timer = mount(5, onDone);
  expect(timer().status).toBe('ready');
  expect(timer().secondsLeft).toBe(5);
  act(() => timer().start());
  act(() => { jest.advanceTimersByTime(2000); });
  expect(timer().secondsLeft).toBe(3);
  for (let i = 0; i < 3; i++) act(() => { jest.advanceTimersByTime(1000); });
  expect(timer().status).toBe('done');
  expect(haptics.holdDone).toHaveBeenCalledTimes(1);
  // Tik v posledních třech sekundách: 3, 2, 1.
  expect(haptics.tick).toHaveBeenCalledTimes(3);
  expect(onDone).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(400); });
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('pauza zastaví odpočet a pokračování naváže na zbývající čas', () => {
  const timer = mount(10, jest.fn());
  act(() => timer().start());
  act(() => { jest.advanceTimersByTime(4000); });
  act(() => timer().pause());
  expect(timer().status).toBe('paused');
  act(() => { jest.advanceTimersByTime(60_000); });
  expect(timer().secondsLeft).toBe(6);
  act(() => timer().start());
  act(() => { jest.advanceTimersByTime(1000); });
  expect(timer().secondsLeft).toBe(5);
});

test('odchod appky na pozadí odpočet pauzne', () => {
  const timer = mount(10, jest.fn());
  act(() => timer().start());
  act(() => { jest.advanceTimersByTime(1000); });
  act(() => appStateListener?.('background'));
  expect(timer().status).toBe('paused');
  expect(timer().secondsLeft).toBe(9);
});
