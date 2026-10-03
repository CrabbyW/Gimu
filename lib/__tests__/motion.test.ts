import { dur, motion, stagger } from '@/lib/motion';
/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mock knihovny */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const zeta = (s: { damping: number; stiffness: number; mass?: number }) => s.damping / (2 * Math.sqrt(s.stiffness * (s.mass ?? 1)));

describe('motion system (UX2)', () => {
  it('stagger roste po krocích a má víčko, sled čte jako jeden takt', () => {
    expect(stagger(0)).toBe(0);
    expect(stagger(2)).toBe(2 * dur.step);
    expect(stagger(-3)).toBe(0);
    expect(stagger(100)).toBe(dur.staggerCap);
    expect(dur.staggerCap).toBeLessThanOrEqual(500);
  });

  it('UI timing drží 90–300 ms', () => {
    for (const t of [motion.ui, motion.uiExit, motion.enter, motion.press, motion.release]) {
      expect(t.duration).toBeGreaterThanOrEqual(90);
      expect(t.duration).toBeLessThanOrEqual(300);
    }
  });

  it('pružiny odměn jsou fyzické, ne kreslené (ζ 0.65–0.9)', () => {
    for (const s of [motion.pop, motion.unlock, motion.slam, motion.settle]) {
      expect(zeta(s)).toBeGreaterThanOrEqual(0.65);
      expect(zeta(s)).toBeLessThanOrEqual(0.9);
    }
  });

  it('poskok opice nemá pružinu (nepropadne pod klid)', () => {
    expect(motion.hop).not.toHaveProperty('stiffness');
    expect(motion.hop.squash).toBeLessThan(0.1);
  });
});
