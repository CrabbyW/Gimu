import { STAGE_THRESHOLDS } from '@/data/xp';
import { stageForXp, stageProgress } from '@/logic/mascot';

test.each([[0, 1], [499, 1], [500, 2], [1999, 2], [2000, 3], [99999, 3]])('xp %i → stage %i', (xp, st) => {
  expect(stageForXp(xp, STAGE_THRESHOLDS)).toBe(st);
});
test('stageProgress', () => {
  expect(stageProgress(600, STAGE_THRESHOLDS)).toEqual({ stage: 2, into: 100, span: 1500 });
  expect(stageProgress(2500, STAGE_THRESHOLDS)).toEqual({ stage: 3, into: 500, span: null });
});
