import { createElement } from 'react';
import { AppState, Text, type AppStateStatus } from 'react-native';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { motion, silhouettePhase, useMotionSafe } from '@/lib/motion';
import { useSilhouettePhase } from '../useSilhouettePhase';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/motion', () => ({ ...jest.requireActual('@/lib/motion'), useMotionSafe: jest.fn(() => ({ reduced: false })) }));
const motionSafe = useMotionSafe as jest.Mock;

function Probe({ kind, playing = true }: { kind: 'reps' | 'hold'; playing?: boolean }) {
  return createElement(Text, null, useSilhouettePhase(kind, playing));
}
let r: ReactTestRenderer | undefined;
const phase = (): number => r!.root.findByType(Text).props.children as number;
const mount = (kind: 'reps' | 'hold', playing = true) => act(() => { r = TestRenderer.create(createElement(Probe, { kind, playing })); });

beforeEach(() => { jest.useFakeTimers(); motionSafe.mockReturnValue({ reduced: false }); });
afterEach(() => { act(() => r?.unmount()); r = undefined; jest.useRealTimers(); jest.restoreAllMocks(); });

describe('silhouettePhase', () => {
  it('tam a zpět: 0 → 1 → 0 za periodu', () => {
    expect(silhouettePhase(0, 1000)).toBeCloseTo(0);
    expect(silhouettePhase(500, 1000)).toBeCloseTo(1);
    expect(silhouettePhase(1000, 1000)).toBeCloseTo(0);
  });
  it('tempo: opakování 1.6–2 s, výdrž 3–4 s', () => {
    expect(motion.silhouette.repsMs).toBeGreaterThanOrEqual(1600);
    expect(motion.silhouette.repsMs).toBeLessThanOrEqual(2000);
    expect(motion.silhouette.holdMs).toBeGreaterThanOrEqual(3000);
    expect(motion.silhouette.holdMs).toBeLessThanOrEqual(4000);
  });
});

describe('useSilhouettePhase', () => {
  it('opakování: vrchol v půlce repsMs', () => {
    mount('reps');
    act(() => { jest.advanceTimersByTime(motion.silhouette.repsMs / 2); });
    expect(phase()).toBeGreaterThan(0.95);
  });
  it('výdrž je pomalejší: v čase repsMs/2 teprve uprostřed dechu', () => {
    mount('hold');
    act(() => { jest.advanceTimersByTime(motion.silhouette.repsMs / 2); });
    expect(phase()).toBeGreaterThan(0.2);
    expect(phase()).toBeLessThan(0.8);
  });
  it('Reduce Motion: stále 0, žádný časovač', () => {
    motionSafe.mockReturnValue({ reduced: true });
    mount('reps');
    act(() => { jest.advanceTimersByTime(5000); });
    expect(phase()).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('pauza (playing=false) zmrazí fázi a zruší časovač', () => {
    mount('reps');
    act(() => { jest.advanceTimersByTime(300); });
    act(() => r!.update(createElement(Probe, { kind: 'reps', playing: false })));
    const frozen = phase();
    expect(frozen).toBeGreaterThan(0);
    act(() => { jest.advanceTimersByTime(2000); });
    expect(phase()).toBe(frozen);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('appka v pozadí: smyčka stojí, po návratu pokračuje bez skoku', () => {
    let cb: ((s: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, fn) => { cb = fn as (s: AppStateStatus) => void; return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>; });
    mount('reps');
    act(() => { jest.advanceTimersByTime(300); });
    act(() => cb!('background'));
    const frozen = phase();
    act(() => { jest.advanceTimersByTime(2000); });
    expect(phase()).toBe(frozen);
    act(() => cb!('active'));
    act(() => { jest.advanceTimersByTime(40); });
    expect(Math.abs(phase() - frozen)).toBeLessThan(0.15);
  });
});
