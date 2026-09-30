import { ANCHORS } from '@/components/mascot/anchors';
import { STAGE_GEOMETRY } from '@/components/mascot/geometry';
import type { MascotStage } from '@/types';

const stages: MascotStage[] = [1, 2, 3];
test.each(stages)('stage %i: všechny kotvy uvnitř viewBoxu 200×200', (s) => {
  for (const a of Object.values(ANCHORS[s])) {
    expect(a.x).toBeGreaterThanOrEqual(0); expect(a.x).toBeLessThanOrEqual(200);
    expect(a.y).toBeGreaterThanOrEqual(0); expect(a.y).toBeLessThanOrEqual(200);
    expect(a.scale).toBeGreaterThan(0);
  }
});
test('stage 2 a 3 mají vlastní kotvy (ne sdílené se stage 1)', () => {
  expect(ANCHORS[2]).not.toBe(ANCHORS[1]);
  expect(ANCHORS[3]).not.toBe(ANCHORS[1]);
});
test('proporce: hlava se zmenšuje, ramena rostou', () => {
  expect(STAGE_GEOMETRY[1].head.r).toBeGreaterThan(STAGE_GEOMETRY[2].head.r);
  expect(STAGE_GEOMETRY[2].head.r).toBeGreaterThan(STAGE_GEOMETRY[3].head.r);
  const span = (s: MascotStage) => ANCHORS[s].handR.x - ANCHORS[s].handL.x;
  expect(span(3)).toBeGreaterThan(span(2)); expect(span(2)).toBeGreaterThan(span(1));
});
test.each(stages)('stage %i: head kotva = střed hlavy geometrie', (s) => {
  expect(ANCHORS[s].head).toMatchObject({ x: STAGE_GEOMETRY[s].head.cx, y: STAGE_GEOMETRY[s].head.cy });
});
test.each(stages)('stage %i: ruka leží na konci paže', (s) => {
  const g = STAGE_GEOMETRY[s];
  const end = (l: typeof g.armL, sign: -1 | 1) => ({
    x: l.x + sign * l.h * Math.sin((l.angle * Math.PI) / 180),
    y: l.y + l.h * Math.cos((l.angle * Math.PI) / 180),
  });
  const l = end(g.armL, -1); const r = end(g.armR, 1);
  expect(Math.abs(l.x - ANCHORS[s].handL.x)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(l.y - ANCHORS[s].handL.y)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(r.x - ANCHORS[s].handR.x)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(r.y - ANCHORS[s].handR.y)).toBeLessThanOrEqual(1.5);
});
