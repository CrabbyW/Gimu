import { nextPhase } from '@/logic/lessonFlow';

test('postup cviky a konec', () => {
  expect(nextPhase({ kind: 'exercise', index: 0 }, 3)).toEqual({ kind: 'exercise', index: 1 });
  expect(nextPhase({ kind: 'exercise', index: 2 }, 3)).toEqual({ kind: 'completing' });
  expect(nextPhase({ kind: 'completing' }, 3)).toEqual({ kind: 'celebrate' });
  expect(nextPhase({ kind: 'celebrate' }, 3)).toEqual({ kind: 'celebrate' });
});

test('lekce s jediným cvikem jde rovnou do dokončování', () => {
  expect(nextPhase({ kind: 'exercise', index: 0 }, 1)).toEqual({ kind: 'completing' });
});
