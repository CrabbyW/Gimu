import { ripplePoints, scanCount, scanOrder, spiralLerp, wavePoints } from '../animate';

const grid = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 200, y: 0 }];

test('dotyková vlna: bez síly vrací stejné body, s dotykem odsune blízké od prstu max o push', () => {
  expect(ripplePoints(grid, 0, 0, 0, 64, 4).pts).toBe(grid);
  const r = ripplePoints(grid, 5, 0, 1, 64, 4);
  expect(r.pts[0]!.x).toBeLessThan(0);
  expect(r.pts[1]!.x).toBeGreaterThan(10);
  expect(Math.abs(r.pts[1]!.x - 10)).toBeLessThanOrEqual(4);
  expect(r.pts[2]).toBe(grid[2]);
  expect(r.lit.length).toBe(2);
});

test('vlna od středu: rozjasní jen tečky u čela vlny', () => {
  const r = wavePoints(grid, 0, 0, 10, 8, 4);
  expect(r.lit).toHaveLength(1);
  expect(r.pts[1]!.x).toBeGreaterThan(10);
  expect(r.pts[2]).toBe(grid[2]);
});

test('scan: počet rozsvícených teček a pořadí zleva', () => {
  expect(scanCount(0.5, 5)).toEqual({ whole: 2, frac: 0.5 });
  expect(scanCount(1, 5).whole).toBe(5);
  expect(scanCount(-1, 5).whole).toBe(0);
  expect(scanOrder([{ x: 5, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 0 }])).toEqual([2, 1, 0]);
});

test('spirála: začíná ve startu, končí v cíli', () => {
  const from = { x: 100, y: 0 };
  const to = { x: 0, y: 20 };
  const a = spiralLerp(from, to, 0, 1.6);
  const b = spiralLerp(from, to, 1, 1.6);
  expect(a.x).toBeCloseTo(100); expect(a.y).toBeCloseTo(0);
  expect(b.x).toBeCloseTo(0); expect(b.y).toBeCloseTo(20);
});
