import { fitCell, GLYPH_GAP, GLYPH_H, GLYPH_W, resetIntroForTests, takeIntro, textDots } from '@/logic/dotGlyphs';

test('OPICE: 5 znaků, šířka 5×5 + 4 mezery, 7 řádků', () => {
  const l = textDots('Opice');
  expect(l.cols).toBe(5 * GLYPH_W + 4 * GLYPH_GAP);
  expect(l.rows).toBe(GLYPH_H);
  expect(l.dots.length).toBeGreaterThan(50);
  for (const d of l.dots) {
    expect(d.x).toBeGreaterThanOrEqual(0); expect(d.x).toBeLessThan(l.cols);
    expect(d.y).toBeGreaterThanOrEqual(0); expect(d.y).toBeLessThan(GLYPH_H);
    expect(d.col).toBe(d.x);
  }
});
test('žádná tečka v mezerách mezi znaky; bez duplicit', () => {
  const l = textDots('OPICE');
  for (const d of l.dots) expect(d.x % (GLYPH_W + GLYPH_GAP)).toBeLessThan(GLYPH_W);
  expect(new Set(l.dots.map((d) => `${d.x},${d.y}`)).size).toBe(l.dots.length);
});
test('neznámý znak = mezera, prázdný text = nic', () => {
  expect(textDots('O?').dots).toEqual(textDots('O').dots);
  expect(textDots('')).toEqual({ dots: [], cols: 0, rows: GLYPH_H });
});
test('fitCell: vejde se do šířky, strop velikosti, nuly', () => {
  expect(fitCell(29, 288, 12)).toBe(9);
  expect(fitCell(29, 1000, 12)).toBe(12);
  expect(fitCell(0, 288, 12)).toBe(0);
  expect(29 * fitCell(29, 288, 12)).toBeLessThanOrEqual(288);
});
test('intro jen jednou za start', () => {
  resetIntroForTests();
  expect(takeIntro()).toBe(true);
  expect(takeIntro()).toBe(false);
});
