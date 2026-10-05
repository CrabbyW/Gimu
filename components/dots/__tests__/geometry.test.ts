import { gridDots, plateDots, rippleOffset, ringCountForKg, ringDots, rowLit, spiralOrder } from '../geometry';

describe('ringCountForKg', () => {
  it.each([[2.5, 2], [5, 3], [10, 4], [15, 5], [20, 6], [25, 7]])('%p kg → %p prstenců', (kg, n) => {
    expect(ringCountForKg(kg)).toBe(n);
  });
  it('neznámá hmotnost → nejbližší nižší, min 2, max 7', () => {
    expect(ringCountForKg(12)).toBe(4);
    expect(ringCountForKg(1)).toBe(2);
    expect(ringCountForKg(40)).toBe(7);
    expect(ringCountForKg(NaN)).toBe(2);
  });
});

describe('plateDots', () => {
  it('vnější prstenec leží na poloměru', () => {
    plateDots(20, 100).filter((p) => p.ring === 0).forEach((p) => expect(Math.hypot(p.x, p.y)).toBeCloseTo(100, 5));
  });
  it('počet prstenců odpovídá kg', () => {
    expect(new Set(plateDots(10, 100).map((p) => p.ring)).size).toBe(4);
  });
  it('rozteč teček je napříč prstenci přibližně stejná', () => {
    const d = plateDots(25, 100);
    const gap = (r: number) => {
      const ps = d.filter((p) => p.ring === r);
      return (2 * Math.PI * Math.hypot(ps[0].x, ps[0].y)) / ps.length;
    };
    expect(Math.abs(gap(0) - gap(3))).toBeLessThan(gap(0) * 0.35);
  });
});

it('ringDots rozloží tečky rovnoměrně po kruhu', () => {
  const r = ringDots(4, 10);
  expect(r[1].x).toBeCloseTo(0, 5);
  expect(r[1].y).toBeCloseTo(10, 5);
});

describe('rowLit', () => {
  it('zaokrouhluje dolů a ořezává do 0–1', () => {
    expect(rowLit(24, 0.67).filter(Boolean)).toHaveLength(16);
    expect(rowLit(5, 2).every(Boolean)).toBe(true);
    expect(rowLit(5, -1).some(Boolean)).toBe(false);
    expect(rowLit(5, NaN).some(Boolean)).toBe(false);
  });
  it('celá jednička rozsvítí vše i přes plovoucí chybu', () => expect(rowLit(3, 0.1 + 0.2 + 0.7).every(Boolean)).toBe(true));
});

it('gridDots skládá řádky zleva doprava', () => {
  const g = gridDots(3, 2, 10);
  expect(g).toHaveLength(6);
  expect(g[5]).toEqual({ x: 20, y: 10, i: 5 });
});

describe('rippleOffset', () => {
  it('mimo poloměr nic', () => expect(rippleOffset(100, 0, 64, 4)).toEqual({ ox: 0, oy: 0, boost: 0 }));
  it('blízko prstu odsune od prstu nejvýš o push', () => {
    const r = rippleOffset(10, 0, 64, 4);
    expect(r.ox).toBeGreaterThan(0);
    expect(r.ox).toBeLessThanOrEqual(4);
    expect(r.boost).toBeGreaterThan(0.5);
  });
  it('přesně pod prstem bez NaN, plný jas', () => {
    const r = rippleOffset(0, 0, 64, 4);
    expect(Number.isFinite(r.ox)).toBe(true);
    expect(r.boost).toBe(1);
  });
});

it('spiralOrder: vnější prstenec první, vnitřní poslední', () => {
  const d = plateDots(5, 50);
  const o = spiralOrder(d);
  expect(o).toHaveLength(d.length);
  expect(new Set(o).size).toBe(d.length);
  expect(d[o[0]].ring).toBe(0);
  expect(d[o[o.length - 1]].ring).toBe(2);
});
