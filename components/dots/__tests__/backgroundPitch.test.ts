import { backgroundPitch } from '../geometry';

const BASE = 14;
const MAX = 600;
const count = (w: number, h: number, p: number) => (Math.floor(w / p) + 1) * (Math.floor(h / p) + 1);

describe('backgroundPitch', () => {
  it.each([[390, 844], [430, 932], [1280, 800], [320, 568]])('celá plocha %ix%i se vejde pod strop', (w, h) => {
    const p = backgroundPitch(w, h, BASE, MAX);
    expect(p).toBeGreaterThanOrEqual(BASE);
    expect(count(w, h, p)).toBeLessThanOrEqual(MAX);
  });
  it('malá plocha drží výchozí rozteč', () => {
    expect(backgroundPitch(100, 100, BASE, MAX)).toBe(BASE);
  });
});
