import { lessonDone } from '@/lib/motion';
import { barbellLayout, celebrationHaptics, celebrationTimeline, fieldGrid, gatherSources, plateHeight, prideBeat, plateWidth, splitPlates, xpBreakdownLabel } from '../celebration';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const t = { lesson: 'lekce', boss: 'boss', replay: 'opakování', first: 'první dnes', streak: 'streak' };

test('šířka a výška kotouče z boku podle kg', () => {
  expect([5, 10, 15, 20, 25].map((kg) => plateWidth(kg as 5))).toEqual([10, 12, 14, 16, 18]);
  expect(plateHeight(5)).toBe(106);
  expect(plateHeight(25)).toBe(152);
});

test('nasazené kotouče jdou od středu ven, přilétající za nimi, objímka za ním', () => {
  const l = barbellLayout([5, 5], 10);
  expect(l.loaded.map((p) => p.offset)).toEqual([10, 21]);
  expect(l.flying).toMatchObject({ kg: 10, offset: 32, w: 12 });
  expect(l.collarOffset).toBe(45);
});

test('plně naložená osa (boss) se vejde na polovinu úzkého telefonu', () => {
  const l = barbellLayout([5, 5, 10, 10, 15, 15, 20, 20], 25);
  expect(l.collarOffset + 14).toBeLessThanOrEqual((360 - 48) / 2);
});

test('s šířkou osy sedí kotouče na konci osy, ne u středu (není to jednoručka)', () => {
  const few = barbellLayout([5], 10, 171);
  expect(few.sleeveOffset).toBe(77);
  expect(few.loaded[0]!.offset).toBe(83);
  const boss = barbellLayout([5, 5, 10, 10, 15, 15, 20, 20], 25, 171);
  expect(boss.collarOffset + 14 + 14).toBeLessThanOrEqual(171);
  expect(boss.sleeveOffset).toBeGreaterThanOrEqual(4);
});

test('nová lekce: přilétá poslední kotouč', () => {
  expect(splitPlates([5, 5, 10], 10)).toEqual({ loaded: [5, 5], flying: 10 });
});

test('opakování: počet kotoučů na ose se nezmění', () => {
  expect(splitPlates([5, 5, 10, 10], 5)).toEqual({ loaded: [5, 10, 10], flying: 5 });
});

test('boss: kotouč bosse přiletí k plné sekci', () => {
  expect(splitPlates([5, 5, 10, 10, 15, 15, 20, 20], 25)).toEqual({ loaded: [5, 5, 10, 10, 15, 15, 20, 20], flying: 25 });
});

test('rozpis XP vynechá nulové bonusy', () => {
  expect(xpBreakdownLabel({ base: 20, baseKind: 'lesson', firstOfDay: 10, streak: 2, total: 32 }, t)).toBe('lekce 20 · první dnes +10 · streak +2');
  expect(xpBreakdownLabel({ base: 10, baseKind: 'replay', firstOfDay: 0, streak: 0, total: 10 }, t)).toBe('opakování 10');
});

describe('oslava z teček (Nothing Dot §5)', () => {
  test('časová osa: field → gather → snap → mascot → cta s časy z motion.lessonDone', () => {
    const tl = celebrationTimeline(false);
    expect(tl.map((s) => s.id)).toEqual(['field', 'gather', 'snap', 'mascot', 'cta']);
    expect(tl.map((s) => s.at)).toEqual([lessonDone.fieldAt, lessonDone.gatherAt, lessonDone.snapAt, lessonDone.mascotAt, lessonDone.ctaAt]);
    expect(tl.map((s) => s.at)).toEqual([0, 200, 1300, 1450, 2600]);
    expect(tl[1]!.durationMs).toBe(1100);
    // CTA až po doběhu XP (a heartbeatu).
    expect(tl[4]!.at).toBeGreaterThan(tl[3]!.at + tl[3]!.durationMs + lessonDone.heartbeatGap);
    // Tečky dolétnou přesně v okamžiku nacvaknutí.
    expect(tl[1]!.at + tl[1]!.durationMs).toBe(tl[2]!.at);
  });

  test('haptický podpis: zrychlující crescendo při slétání, heavy v nacvaknutí, success, heartbeat po XP', () => {
    const h = celebrationHaptics(false);
    const ticks = h.slice(0, lessonDone.crescendo.ticks);
    expect(ticks.every(([, k]) => k === 'selection' || k === 'light')).toBe(true);
    const at = ticks.map(([ms]) => ms);
    const gaps = at.slice(1).map((ms, i) => ms - at[i]!);
    gaps.slice(1).forEach((g, i) => expect(g).toBeLessThanOrEqual(gaps[i]!));
    expect(at[0]!).toBeGreaterThanOrEqual(lessonDone.gatherAt);
    expect(at[at.length - 1]!).toBeLessThan(lessonDone.snapAt);
    const rest = h.slice(lessonDone.crescendo.ticks);
    const xpEnd = lessonDone.mascotAt + lessonDone.countMs;
    expect(rest).toEqual([[lessonDone.snapAt, 'heavy'], [lessonDone.snapAt + 110, 'success'], [xpEnd, 'medium'], [xpEnd + 120, 'light']]);
    expect(h.map(([ms]) => ms)).toEqual([...h.map(([ms]) => ms)].sort((a, b) => a - b));
    expect(h[h.length - 1]![0]).toBeLessThan(lessonDone.ctaAt);
  });

  test('haptika s omezeným pohybem: jen success', () => {
    expect(celebrationHaptics(true)).toEqual([[0, 'success']]);
  });

  test('omezený pohyb: všechno hned, 200 ms prolnutí', () => {
    const tl = celebrationTimeline(true);
    expect(tl.map((s) => s.id)).toEqual(['field', 'gather', 'snap', 'mascot', 'cta']);
    expect(tl.every((s) => s.at === 0 && s.durationMs === 200)).toBe(true);
  });

  test('tečky vzlétají z teček pole, dál od středu než jejich cíl', () => {
    const grid = fieldGrid(390, 844, 14, 2000);
    const cx = 195;
    const cy = 400;
    const targets = [{ x: 100, y: 0, ring: 0 }, { x: 0, y: -60, ring: 1 }, { x: -30, y: 30, ring: 2 }];
    const src = gatherSources(targets, 100, 3, cx, cy, grid);
    src.forEach((s, i) => {
      const gx = (s.x + cx - grid.left) / grid.pitch;
      const gy = (s.y + cy - grid.top) / grid.pitch;
      expect(Math.abs(gx - Math.round(gx))).toBeLessThan(1e-6);
      expect(Math.abs(gy - Math.round(gy))).toBeLessThan(1e-6);
      expect(Math.hypot(s.x, s.y)).toBeGreaterThan(Math.hypot(targets[i]!.x, targets[i]!.y));
    });
  });
});

describe('prideBeat: hrdost a řádek rekordu (elite fáze 3 §4)', () => {
  const base = { cheerAt: 1450, scanMs: 300, cooldownMs: 1200, reduced: false };
  test('bez rekordu se řádek nespouští; proud jen při přírůstku série', () => {
    expect(prideBeat({ ...base, streakRecord: false, seriesGain: true })).toEqual({ proudAt: 2650, recordAt: null });
    expect(prideBeat({ ...base, streakRecord: false, seriesGain: false })).toEqual({ proudAt: null, recordAt: null });
  });
  test('rekord: proud a řádek ve stejném taktu, po cooldownu celebrate a po skenu řady', () => {
    expect(prideBeat({ ...base, streakRecord: true, seriesGain: true })).toEqual({ proudAt: 2650, recordAt: 2650 });
    expect(prideBeat({ ...base, scanMs: 1500, streakRecord: true, seriesGain: true })).toEqual({ proudAt: 2950, recordAt: 2950 });
  });
  test('rekord nemění haptický podpis (žádný úder navíc)', () => {
    const at = prideBeat({ ...base, streakRecord: true, seriesGain: true }).recordAt!;
    expect(celebrationHaptics(false).some(([ms]) => ms === at)).toBe(false);
    expect(celebrationHaptics(false)).toHaveLength(11);
  });
  test('omezený pohyb: řádek hned, proud po cooldownu; bez rekordu nic', () => {
    expect(prideBeat({ ...base, reduced: true, streakRecord: true, seriesGain: true })).toEqual({ proudAt: 1200, recordAt: 0 });
    expect(prideBeat({ ...base, reduced: true, streakRecord: false, seriesGain: true })).toEqual({ proudAt: null, recordAt: null });
  });
});
