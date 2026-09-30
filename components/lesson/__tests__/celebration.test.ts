import { barbellLayout, plateHeight, plateWidth, splitPlates, xpBreakdownLabel } from '../celebration';

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
  expect(xpBreakdownLabel({ base: 20, baseKind: 'lesson', firstOfDay: 10, streak: 2, total: 32 }, t)).toBe('lekce 20 · první dnes +10 · streak +2');
  expect(xpBreakdownLabel({ base: 10, baseKind: 'replay', firstOfDay: 0, streak: 0, total: 10 }, t)).toBe('opakování 10');
});
