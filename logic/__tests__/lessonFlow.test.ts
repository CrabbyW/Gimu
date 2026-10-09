import { extendRest, nextFlowPhase, nextPhase, REST } from '@/logic/lessonFlow';

test('postup cviky a konec', () => {
  expect(nextPhase({ kind: 'exercise', index: 0 }, 3)).toEqual({ kind: 'exercise', index: 1 });
  expect(nextPhase({ kind: 'exercise', index: 2 }, 3)).toEqual({ kind: 'completing' });
  expect(nextPhase({ kind: 'completing' }, 3)).toEqual({ kind: 'celebrate' });
  expect(nextPhase({ kind: 'celebrate' }, 3)).toEqual({ kind: 'celebrate' });
});

test('lekce s jediným cvikem jde rovnou do dokončování', () => {
  expect(nextPhase({ kind: 'exercise', index: 0 }, 1)).toEqual({ kind: 'completing' });
});

describe('pauza mezi cviky (U1)', () => {
  test('cvik → pauza → další cvik; po posledním bez pauzy', () => {
    expect(nextFlowPhase({ kind: 'exercise', index: 0 }, 3)).toEqual({ kind: 'rest', next: 1 });
    expect(nextFlowPhase({ kind: 'rest', next: 1 }, 3)).toEqual({ kind: 'exercise', index: 1 });
    expect(nextFlowPhase({ kind: 'exercise', index: 2 }, 3)).toEqual({ kind: 'completing' });
    expect(nextFlowPhase({ kind: 'completing' }, 3)).toEqual({ kind: 'celebrate' });
  });
  test('bez pauzy = původní tok; jeden cvik pauzu nemá', () => {
    expect(nextFlowPhase({ kind: 'exercise', index: 0 }, 3, false)).toEqual({ kind: 'exercise', index: 1 });
    expect(nextFlowPhase({ kind: 'exercise', index: 0 }, 1)).toEqual({ kind: 'completing' });
  });
  test('+15 s se stropem', () => {
    expect(extendRest(REST.seconds)).toBe(45);
    expect(extendRest(85)).toBe(REST.maxS);
  });
});
