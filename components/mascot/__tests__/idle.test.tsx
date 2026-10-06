import TestRenderer, { act } from 'react-test-renderer';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import { motion } from '@/lib/motion';
import { IDLE_ACTIONS } from '@/logic/mascotIdle';
import { mulberry32 } from '@/logic/random';
import { IdleMascot, Mascot, MonkeyBack, MonkeyFront } from '..';
import { useMascotIdle } from '../useMascotIdle';
import type { MascotIdle, MascotProps, MascotReaction } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
let mockReduced = false;
jest.mock('@/lib/motion', () => ({ ...jest.requireActual('@/lib/motion'), useMotionSafe: () => ({ reduced: mockReduced }) }));

const theme = buildTheme('dark', null);
const base: MascotProps = { stage: 1, mood: 'idle', size: 'M', cosmetics: {} };
const CFG = motion.mascotIdle;

let renderer: TestRenderer.ReactTestRenderer | null = null;
const wrap = (el: React.ReactElement) => <ThemeContext.Provider value={theme}>{el}</ThemeContext.Provider>;
const mount = (el: React.ReactElement) => {
  act(() => { renderer?.unmount(); });
  act(() => { renderer = TestRenderer.create(wrap(el)); });
  return renderer!;
};

let seen: (MascotIdle | null)[] = [];
function Probe(p: { focused?: boolean; reaction?: MascotReaction | null; seed?: number; context?: 'default' | 'map' | 'podium' }) {
  const idle = useMascotIdle({ focused: p.focused ?? true, reaction: p.reaction ?? null, rng: mulberry32(p.seed ?? 1), context: p.context });
  seen.push(idle);
  return null;
}
const latest = () => seen[seen.length - 1] ?? null;

beforeEach(() => { jest.useFakeTimers(); mockReduced = false; seen = []; });
afterEach(() => { act(() => { renderer?.unmount(); }); renderer = null; jest.useRealTimers(); });

describe('plánovač idle akcí (useMascotIdle)', () => {
  test('první akce nejdřív po pauze 4 s a nejpozději po 12 s', () => {
    mount(<Probe />);
    act(() => { jest.advanceTimersByTime(CFG.pause.minMs - 1); });
    expect(latest()).toBeNull();
    act(() => { jest.advanceTimersByTime(CFG.pause.maxMs - CFG.pause.minMs + 1); });
    expect(latest()).not.toBeNull();
  });

  test('akce se střídají s novým klíčem', () => {
    mount(<Probe />);
    for (let i = 0; i < 6; i++) act(() => { jest.advanceTimersByTime(CFG.pause.maxMs); });
    const keys = new Set(seen.filter(Boolean).map((i) => i!.key));
    expect(keys.size).toBeGreaterThanOrEqual(3);
  });

  test('nezaostřená obrazovka = nic', () => {
    mount(<Probe focused={false} />);
    act(() => { jest.advanceTimersByTime(CFG.pause.maxMs * 4); });
    expect(seen.every((i) => i === null)).toBe(true);
  });

  test('omezený pohyb = žádný idle repertoár', () => {
    mockReduced = true;
    mount(<Probe />);
    act(() => { jest.advanceTimersByTime(CFG.pause.maxMs * 4); });
    expect(seen.every((i) => i === null)).toBe(true);
  });

  test('spící opička (reakce sleep) nehraje nic', () => {
    mount(<Probe reaction={{ id: 'sleep', key: 1 }} />);
    act(() => { jest.advanceTimersByTime(CFG.pause.maxMs * 4); });
    expect(seen.every((i) => i === null)).toBe(true);
  });

  test('reakce má přednost: po ní se idle nespustí dřív než za `busyMs` a nejdřív po pauze', () => {
    const r = mount(<Probe />);
    act(() => { jest.advanceTimersByTime(CFG.pause.maxMs); });
    const before = latest()?.key ?? 0;
    act(() => { r.update(wrap(<Probe reaction={{ id: 'hop', key: 1 }} />)); });
    act(() => { jest.advanceTimersByTime(Math.max(CFG.busyMs, CFG.pause.minMs) - 1); });
    expect(latest()?.key ?? 0).toBe(before);
    act(() => { jest.advanceTimersByTime(CFG.pause.maxMs + CFG.busyMs); });
    expect(latest()!.key).toBeGreaterThan(before);
  });
});

describe('přehrání idle akcí', () => {
  test.each(IDLE_ACTIONS)('%s se přehraje bez pádu (celá opička i vrstvy pro sezení) a reakce ji přeruší', (id) => {
    const r = mount(<Mascot {...base} idle={{ id, key: 1 }} />);
    act(() => { jest.advanceTimersByTime(300); });
    act(() => { r.update(wrap(<Mascot {...base} idle={{ id, key: 1 }} reaction={{ id: 'hop', key: 1 }} />)); });
    act(() => { jest.advanceTimersByTime(3000); });
    mount(<><MonkeyBack {...base} idle={{ id, key: 1 }} /><MonkeyFront {...base} idle={{ id, key: 1 }} /></>);
    act(() => { jest.advanceTimersByTime(3000); });
  });

  test('přechod nálady (idle → happy → sad) a omezený pohyb bez pádu', () => {
    for (const reduced of [false, true]) {
      mockReduced = reduced;
      const r = mount(<Mascot {...base} />);
      for (const mood of ['happy', 'sad', 'celebrate', 'idle'] as const) {
        act(() => { r.update(wrap(<Mascot {...base} mood={mood} idle={{ id: 'sway', key: 1 }} />)); });
        act(() => { jest.advanceTimersByTime(800); });
      }
    }
  });

  test('IdleMascot (vítěz pódia) žije sám', () => {
    mount(<IdleMascot {...base} mood="happy" idleContext="podium" />);
    act(() => { jest.advanceTimersByTime(CFG.podiumPause.maxMs * 3); });
  });
});
