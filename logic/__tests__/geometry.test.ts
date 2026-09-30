import { layoutNodes, plateSize, popoverSide, segmentLength } from '@/components/map/geometry';

const nodes = Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, plateKg: ([5, 5, 10, 10, 15, 15, 20, 20, 25] as const)[i]!, isBoss: i === 8 }));

test('uzly jdou shora dolů a vlní se do stran v mezích šířky', () => {
  const { positions, height } = layoutNodes(nodes, 390);
  positions.forEach((p, i) => {
    if (i > 0) expect(p.y).toBeGreaterThan(positions[i - 1]!.y);
    expect(p.x - p.size / 2).toBeGreaterThanOrEqual(16);
    expect(p.x + p.size / 2).toBeLessThanOrEqual(374);
  });
  expect(new Set(positions.map((p) => Math.round(p.x))).size).toBeGreaterThan(3);
  expect(height).toBeGreaterThan(positions.at(-1)!.y);
});

test('plateSize roste s kg', () => { expect(plateSize(5)).toBeLessThan(plateSize(25)); });

test('segmentLength: svislý úsek má délku rozdílu y, křivka je delší než přímka', () => {
  expect(segmentLength({ x: 100, y: 0 }, { x: 100, y: 112 })).toBeCloseTo(112, 0);
  expect(segmentLength({ x: 100, y: 0 }, { x: 200, y: 112 })).toBeGreaterThan(Math.hypot(100, 112));
});

describe('popoverSide', () => {
  const base = { nodeTop: 400, nodeBottom: 460, viewportTop: 0, viewportBottom: 900, room: 220 };
  test('dokončený uzel otevírá nahoru, pryč od dalšího uzlu', () => {
    expect(popoverSide({ ...base, done: true })).toBe('above');
  });
  test('aktuální / zamčený uzel otevírá dolů', () => {
    expect(popoverSide({ ...base, done: false })).toBe('below');
  });
  test('dokončený uzel u horního okraje výřezu spadne dolů', () => {
    expect(popoverSide({ ...base, done: true, viewportTop: 300 })).toBe('below');
  });
  test('uzel u spodního okraje výřezu otevře nahoru', () => {
    expect(popoverSide({ ...base, done: false, viewportBottom: 600 })).toBe('above');
  });
  test('když se nevejde ani jedna strana, vezme tu s víc místem', () => {
    expect(popoverSide({ ...base, done: false, viewportTop: 250, viewportBottom: 600 })).toBe('above');
    expect(popoverSide({ ...base, done: true, viewportTop: 350, viewportBottom: 600 })).toBe('below');
  });
});
