import { STAGE_THRESHOLDS } from '@/data/xp';
import { parseStageParam, stageForXp, stageProgress } from '@/logic/mascot';

test.each([[-10, 1], [0, 1], [499, 1], [500, 2], [1999, 2], [2000, 3], [99999, 3]])('xp %i → stage %i', (xp, st) => {
  expect(stageForXp(xp, STAGE_THRESHOLDS)).toBe(st);
});
test('stageProgress', () => {
  expect(stageProgress(600, STAGE_THRESHOLDS)).toEqual({ stage: 2, into: 100, span: 1500 });
  expect(stageProgress(2500, STAGE_THRESHOLDS)).toEqual({ stage: 3, into: 500, span: null });
});

describe('parseStageParam', () => {
  test.each([['2', 2], ['4', null], [undefined, null], [['3'], 3], ['', null], ['2.5', null], ['0', null]] as const)('%j → %s', (input, out) => {
    expect(parseStageParam(input as string | string[] | undefined)).toBe(out);
  });
});
