import { BOSS_SIZE, LABEL_GAP, MONKEY_ROOM, RING_OUT, labelHeight, layoutNodes, nodeSize, popoverSide, segmentLength, type LayoutInput } from '@/components/map/geometry';
import { PHI } from '@/theme/tokens';

const state = (i: number): LayoutInput['state'] => (i < 3 ? 'done' : i === 3 ? 'current' : 'locked');
const nodes: LayoutInput[] = Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, isBoss: i === 8, state: state(i), sectionStart: i === 0 }));

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

// Teplá litina §2.7: velikost uzlu nese stav (72 / aktuální 88), ne kg (dřív test „plateSize roste s kg“).
test('aktuální uzel je větší než ostatní', () => { expect(nodeSize(true)).toBeGreaterThan(nodeSize(false)); });

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

// Teplá litina: pod každým uzlem je popisek (a u aktuálního tlačítko „Začít lekci“), nad aktuálním opička.
// Krok proto už není pevně 64·φ (R43), ale aspoň 64·φ a tak velký, aby se popisek nepotkal s dalším uzlem.
test('krok uzlů je aspoň 64·φ a popisek nepřekryje další uzel ani opičku', () => {
  const { positions } = layoutNodes(nodes, 390);
  positions.slice(1).forEach((p, j) => {
    const prev = positions[j]!;
    const n = nodes[j]!;
    expect(p.y - prev.y).toBeGreaterThanOrEqual(64 * PHI - 0.5);
    const labelBottom = prev.y + prev.size / 2 + LABEL_GAP + labelHeight(n.state, n.isBoss);
    expect(labelBottom).toBeLessThan(p.top);
  });
  const cur = positions[3]!;
  expect(cur.size).toBe(nodeSize(true));
  expect(cur.y - cur.top).toBeGreaterThanOrEqual(cur.size / 2 + Math.max(MONKEY_ROOM, RING_OUT));
  expect(positions[8]!.size).toBe(BOSS_SIZE.h);
});
