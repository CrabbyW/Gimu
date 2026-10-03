import { createElement } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { feedback } from '@/lib/feedback';
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
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));
const cues = () => (feedback as jest.Mock).mock.calls.map((c) => c[0]);

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

/** Projde odpočtem 3-2-1 (3 × 1000 ms) do běžící výdrže. */
function startHold(timer: () => HoldTimer) {
  act(() => timer().start());
  expect(timer().status).toBe('countdown');
  for (let i = 0; i < 3; i++) act(() => { jest.advanceTimersByTime(1000); });
  expect(timer().status).toBe('running');
}

test('start spustí odpočet 3-2-1, pak go a výdrž', () => {
  const timer = mount(12, jest.fn());
  act(() => timer().start());
  expect(timer().countdown).toBe(3);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(timer().countdown).toBe(2);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(timer().countdown).toBe(1);
  expect(timer().secondsLeft).toBe(12);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(timer().status).toBe('running');
  expect(cues()).toEqual(['countdown3', 'countdown2', 'countdown1', 'go']);
});

test('pauza během odpočtu vrátí na začátek bez haptiky go', () => {
  const timer = mount(10, jest.fn());
  act(() => timer().start());
  act(() => { jest.advanceTimersByTime(1000); });
  act(() => timer().pause());
  expect(timer().status).toBe('ready');
  act(() => { jest.advanceTimersByTime(5000); });
  expect(timer().status).toBe('ready');
  expect(cues()).toEqual(['countdown3', 'countdown2']);
});

test('výdrž: holdTick na desítkách, posledních 5 s po sekundě, v nule holdDone a po 400 ms onDone', () => {
  const onDone = jest.fn();
  const timer = mount(21, onDone);
  startHold(timer);
  (feedback as jest.Mock).mockClear();
  for (let i = 0; i < 21; i++) act(() => { jest.advanceTimersByTime(1000); });
  expect(timer().status).toBe('done');
  expect(cues()).toEqual(['holdTick', 'holdTick', 'holdLast5', 'holdLast4', 'holdLast3', 'holdLast2', 'holdLast1', 'holdDone']);
  expect(onDone).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(400); });
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('pokračování z pauzy nezopakuje haptiku stejné sekundy ani go', () => {
  const timer = mount(10, jest.fn());
  startHold(timer);
  act(() => { jest.advanceTimersByTime(6000); });
  act(() => timer().pause());
  (feedback as jest.Mock).mockClear();
  act(() => timer().start());
  expect(timer().status).toBe('running');
  act(() => { jest.advanceTimersByTime(250); });
  expect(cues()).toEqual([]);
});

test('pauza zastaví odpočet a pokračování naváže na zbývající čas', () => {
  const timer = mount(10, jest.fn());
  startHold(timer);
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
  startHold(timer);
  act(() => { jest.advanceTimersByTime(1000); });
  act(() => appStateListener?.('background'));
  expect(timer().status).toBe('paused');
  expect(timer().secondsLeft).toBe(9);
});
