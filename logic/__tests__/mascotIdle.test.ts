import { motion } from '@/lib/motion';
import {
  busyLeft, canIdle, IDLE_ACTIONS, idleWeights, isLongSpin, nextIdlePause, pickIdleAction, type IdleActionId,
} from '../mascotIdle';
import { eventToReaction } from '../mascotReactions';
import { mulberry32 } from '../random';

/* eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock (lib/motion importuje reanimated) */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

const CFG = motion.mascotIdle;
const ok = { enabled: true, focused: true, reduced: false, sleeping: false, now: 10000, reactionAt: -Infinity, busyMs: CFG.busyMs };

describe('nextIdlePause', () => {
  it('drží rozsah 4–12 s (krajní hodnoty generátoru)', () => {
    expect(nextIdlePause(() => 0, 'default', CFG)).toBe(4000);
    expect(nextIdlePause(() => 0.999999, 'default', CFG)).toBeLessThanOrEqual(12000);
  });
  it('seedovaný generátor = stejné pauzy, vždy v rozsahu', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const p = nextIdlePause(a, 'default', CFG);
      expect(p).toBe(nextIdlePause(b, 'default', CFG));
      expect(p).toBeGreaterThanOrEqual(CFG.pause.minMs);
      expect(p).toBeLessThanOrEqual(CFG.pause.maxMs);
    }
  });
  it('pódium má kratší pauzy', () => {
    expect(nextIdlePause(() => 0.999999, 'podium', CFG)).toBeLessThanOrEqual(CFG.podiumPause.maxMs);
    expect(CFG.podiumPause.maxMs).toBeLessThan(CFG.pause.maxMs);
  });
});

describe('pickIdleAction', () => {
  it('seedovaný výběr je deterministický a nikdy neopakuje poslední akci', () => {
    const rngA = mulberry32(42);
    const rngB = mulberry32(42);
    let last: IdleActionId | null = null;
    for (let i = 0; i < 300; i++) {
      const a = pickIdleAction(rngA, 'map', CFG, last);
      expect(a).toBe(pickIdleAction(rngB, 'map', CFG, last));
      expect(a).not.toBeNull();
      expect(a).not.toBe(last);
      last = a;
    }
  });
  it('pohled na kotouč jen na mapě, zívnutí jen po delší nečinnosti', () => {
    const seen = new Set<IdleActionId | null>();
    const rng = mulberry32(1);
    for (let i = 0; i < 500; i++) seen.add(pickIdleAction(rng, 'default', CFG, null, 0));
    expect(seen.has('lookPlate')).toBe(false);
    expect(seen.has('yawn')).toBe(false);
    expect(idleWeights('map', CFG, null, 0).lookPlate).toBeGreaterThan(0);
    expect(idleWeights('default', CFG, null, CFG.yawnAfterMs).yawn).toBe(CFG.yawnWeight);
  });
  it('celý repertoár je dosažitelný (mapa, před usnutím)', () => {
    const seen = new Set<IdleActionId | null>();
    const rng = mulberry32(3);
    let last: IdleActionId | null = null;
    for (let i = 0; i < 2000; i++) { last = pickIdleAction(rng, 'map', CFG, last, i % 2 ? CFG.yawnAfterMs : 0); seen.add(last); }
    for (const id of IDLE_ACTIONS) expect(seen.has(id)).toBe(true);
  });
  it('vítěz na pódiu poskakuje častěji', () => {
    const count = (ctx: 'default' | 'podium') => {
      const rng = mulberry32(9);
      let n = 0;
      for (let i = 0; i < 2000; i++) if (pickIdleAction(rng, ctx, CFG) === 'joyHop') n++;
      return n;
    };
    expect(count('podium')).toBeGreaterThan(count('default') * 2);
  });
  it('vybírá podle vah: rng 0 = první akce s nenulovou vahou', () => {
    expect(pickIdleAction(() => 0, 'default', CFG)).toBe('lookAround');
  });
});

describe('canIdle (přerušení reakcí, omezený pohyb)', () => {
  it('hraje jen zapnutá, zaostřená, bez omezení pohybu, nespící', () => {
    expect(canIdle(ok)).toBe(true);
    expect(canIdle({ ...ok, focused: false })).toBe(false);
    expect(canIdle({ ...ok, reduced: true })).toBe(false);
    expect(canIdle({ ...ok, sleeping: true })).toBe(false);
    expect(canIdle({ ...ok, enabled: false })).toBe(false);
  });
  it('během reakce čeká `busyMs` od jejího začátku', () => {
    expect(canIdle({ ...ok, reactionAt: ok.now - 100 })).toBe(false);
    expect(canIdle({ ...ok, reactionAt: ok.now - CFG.busyMs })).toBe(true);
    expect(busyLeft(ok.now, ok.now - 100, CFG.busyMs)).toBe(CFG.busyMs - 100);
    expect(busyLeft(ok.now, -Infinity, CFG.busyMs)).toBe(0);
  });
});

describe('kontext', () => {
  it('dlouhé roztočení = zatočí se jí hlava', () => {
    expect(isLongSpin(CFG.spinDizzyRad, CFG.spinDizzyRad)).toBe(true);
    expect(isLongSpin(Math.PI, CFG.spinDizzyRad)).toBe(false);
  });
  it('otevření obrazovky (profil) = zamávání', () => {
    expect(eventToReaction({ type: 'screenOpen' }, [])).toBe('wave');
  });
});
