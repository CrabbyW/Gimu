import { ACTIVITY_CELLS, activityCells, tileColumns } from '../layout';

describe('tileColumns', () => {
  it('dva sloupce od 360 pt a do fontScale 1.3', () => {
    expect(tileColumns(390, 1)).toBe(2);
    expect(tileColumns(360, 1.3)).toBe(2);
  });
  it('jeden sloupec na úzkém displeji nebo s velkým písmem', () => {
    expect(tileColumns(320, 1)).toBe(1);
    expect(tileColumns(390, 1.4)).toBe(1);
  });
});

describe('activityCells', () => {
  it('prázdná historie: 35 zhasnutých buněk, bez dneška', () => {
    const r = activityCells([], null);
    expect(r.lit).toHaveLength(ACTIVITY_CELLS);
    expect(r.lit.some(Boolean)).toBe(false);
    expect(r.today).toBeUndefined();
  });
  it('mapuje aktivní dny a dnešek', () => {
    const days = Array.from({ length: 35 }, (_, i) => ({ date: `d${i}`, active: i % 2 === 0 }));
    const r = activityCells(days, 34);
    expect(r.lit[0]).toBe(true);
    expect(r.lit[1]).toBe(false);
    expect(r.today).toBe(34);
  });
  it('kratší historie se doplní zhasnutými, delší ořízne na posledních 35', () => {
    expect(activityCells([{ date: 'a', active: true }], 0).lit.filter(Boolean)).toHaveLength(1);
    const long = Array.from({ length: 40 }, (_, i) => ({ date: `d${i}`, active: i >= 39 }));
    const r = activityCells(long, null);
    expect(r.lit).toHaveLength(ACTIVITY_CELLS);
    expect(r.lit[34]).toBe(true);
  });
  it('dnešek mimo rozsah se ignoruje', () => expect(activityCells([], 99).today).toBeUndefined());
});
