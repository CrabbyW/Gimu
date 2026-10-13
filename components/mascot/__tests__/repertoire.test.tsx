import { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import { repertoire } from '@/lib/motion';
import { IDLE_RETRY_MS, PRIO } from '@/lib/mascotAct';
import { ACT_IDS, ACT_SPEC } from '@/lib/repertoireMotion';
import { IDLE_PAUSE_MS } from '@/logic/mascotRepertoire';
import { mulberry32 } from '@/logic/random';
import { Mascot, MonkeyBack, MonkeyFront } from '..';
import { useMapIdleActs, useMascotAct, type MascotActs } from '../useMascotAct';
import type { MascotProps } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
let mockReduced = false;
jest.mock('@/lib/motion', () => ({ ...jest.requireActual('@/lib/motion'), useMotionSafe: () => ({ reduced: mockReduced }) }));
const mockFire = jest.fn();
jest.mock('@/lib/haptics', () => ({ ...jest.requireActual('@/lib/haptics'), fire: (k: string) => mockFire(k) }));

const theme = buildTheme('dark', null);
const base: MascotProps = { stage: 1, mood: 'idle', size: 'M', cosmetics: {} };
let renderer: TestRenderer.ReactTestRenderer | null = null;
const mount = (el: React.ReactElement) => {
  act(() => { renderer?.unmount(); });
  act(() => { renderer = TestRenderer.create(<ThemeContext.Provider value={theme}>{el}</ThemeContext.Provider>); });
  return renderer!;
};

let acts: MascotActs | null = null;
let blocked = false;
const played: string[] = [];
const isBlocked = () => blocked;
function Probe({ idle = false }: { idle?: boolean }) {
  const a = useMascotAct();
  useEffect(() => {
    acts = a;
    if (a.act && played[played.length - 1] !== `${a.act.id}#${a.act.key}`) played.push(`${a.act.id}#${a.act.key}`);
  });
  useMapIdleActs({
    acts: a, focused: true, blocked: isBlocked, enabled: idle, rng: mulberry32(7),
    input: () => ({ sinceInteractionMs: 0, streakAtRisk: false, hasNeighbour: true }),
  });
  return null;
}

beforeEach(() => { jest.useFakeTimers(); mockReduced = false; mockFire.mockClear(); acts = null; blocked = false; played.length = 0; });
afterEach(() => { act(() => { renderer?.unmount(); }); renderer = null; jest.useRealTimers(); });

describe('useMascotAct: jedna akce najednou', () => {
  test('idle nepřeruší běžící akci; ťuknutí přeruší idle; po doběhnutí je volno', () => {
    mount(<Probe />);
    let ok = false;
    act(() => { ok = acts!.play('warmup', PRIO.idle); });
    expect(ok).toBe(true);
    act(() => { ok = acts!.play('boredSit', PRIO.idle); });
    expect(ok).toBe(false);
    expect(acts!.act?.id).toBe('warmup');
    act(() => { ok = acts!.play('headShake', PRIO.user); });
    expect(ok).toBe(true);
    expect(acts!.act?.id).toBe('headShake');
    act(() => { jest.advanceTimersByTime(ACT_SPEC.headShake.ms); });
    expect(acts!.act).toBeNull();
    expect(acts!.busy()).toBe(false);
  });

  test('haptika jen u REPERTOIRE_HAPTIC, ve zlomku osy (činka v nacvaknutí), bez ní u idle', () => {
    mount(<Probe />);
    act(() => { acts!.play('warmup', PRIO.idle); });
    act(() => { jest.advanceTimersByTime(ACT_SPEC.warmup.ms); });
    expect(mockFire).not.toHaveBeenCalled();
    act(() => { acts!.play('liftBarbell', PRIO.moment); });
    act(() => { jest.advanceTimersByTime(ACT_SPEC.liftBarbell.ms * 0.6 - 1); });
    expect(mockFire).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(2); });
    expect(mockFire).toHaveBeenCalledWith('rigid');
    mockFire.mockClear();
    act(() => { jest.advanceTimersByTime(ACT_SPEC.liftBarbell.ms); });
    act(() => { acts!.play('grow', PRIO.moment, { haptic: false }); });
    act(() => { jest.advanceTimersByTime(ACT_SPEC.grow.ms); });
    expect(mockFire).not.toHaveBeenCalled();
  });
});

describe('useMapIdleActs: idle na mapě', () => {
  test('během odemčení / skoku / pull-to-refresh (blocked) se nespustí nic; po odblokování ano', () => {
    blocked = true;
    mount(<Probe idle />);
    act(() => { jest.advanceTimersByTime(repertoire.idleFirstMs + IDLE_PAUSE_MS.max * 3); });
    expect(played).toHaveLength(0);
    blocked = false;
    act(() => { jest.advanceTimersByTime(IDLE_RETRY_MS + 1); });
    expect(played).toHaveLength(1);
  });

  test('jedna akce najednou: běžící akce od uživatele idle odloží, pauza 20–40 s mezi akcemi', () => {
    mount(<Probe idle />);
    act(() => { jest.advanceTimersByTime(repertoire.idleFirstMs - 10); });
    act(() => { acts!.play('hangFinger', PRIO.user); });
    act(() => { jest.advanceTimersByTime(20); });
    // Idle si nevzal slovo, dokud běží vis.
    expect(played).toEqual([expect.stringMatching(/^hangFinger#/)]);
    act(() => { jest.advanceTimersByTime(ACT_SPEC.hangFinger.ms + IDLE_RETRY_MS); });
    expect(played).toHaveLength(2);
    const second = played.length;
    // Další idle nejdřív po pauze 20 s (+ délce akce).
    act(() => { jest.advanceTimersByTime(IDLE_PAUSE_MS.min - 1); });
    expect(played).toHaveLength(second);
  });
});

describe('<Mascot act>: všech 24 akcí se přehraje a vrátí do klidu', () => {
  test.each(ACT_IDS)('%s (celá opice i dvě vrstvy mapy)', (id) => {
    const a = { id, key: 1 };
    const r = mount(<><Mascot {...base} act={a} /><MonkeyBack {...base} act={a} travel={false} /><MonkeyFront {...base} act={a} travel={false} /></>);
    act(() => { jest.advanceTimersByTime(ACT_SPEC[id].ms / 2); });
    act(() => { jest.advanceTimersByTime(ACT_SPEC[id].ms); });
    expect(r.toJSON()).toBeTruthy();
  });

  test('omezený pohyb: statická póza akce, pak zpět (činka zmizí)', () => {
    mockReduced = true;
    const r = mount(<Mascot {...base} act={{ id: 'liftBarbell', key: 1 }} />);
    expect(r.root.findAll((n) => n.props.testID === 'mascot-props-front' && typeof n.type === 'string').length).toBeGreaterThan(0);
    act(() => { jest.advanceTimersByTime(repertoire.reducedMs + 1); });
    expect(r.root.findAll((n) => n.props.testID === 'mascot-props-front' && typeof n.type === 'string')).toHaveLength(0);
  });

  test('mini opička cvičí s tebou (každá silueta) a zatne se bez změny pózy', () => {
    const phase = { value: 0.5, get: () => 0.5, set: () => undefined } as never;
    const r = mount(<Mascot {...base} size={72} train={{ silhouette: 'pushup', phase }} act={{ id: 'strain', key: 1 }} />);
    act(() => { jest.advanceTimersByTime(500); });
    expect(r.toJSON()).toBeTruthy();
  });
});
