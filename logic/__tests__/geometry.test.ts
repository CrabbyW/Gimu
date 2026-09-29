import { layoutNodes, plateSize, segmentLength } from '@/components/map/geometry';

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
