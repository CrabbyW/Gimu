import { applyFeel, combineScale, EMPTY_PROGRESSION, PROGRESSION } from '@/logic/progression';

test('easy +10 %, hard −10 %, right beze změny', () => {
  expect(applyFeel(undefined, 'a', 'easy').factor).toBe(1.1);
  expect(applyFeel(undefined, 'a', 'hard').factor).toBe(0.9);
  expect(applyFeel(undefined, 'a', 'right').factor).toBe(1);
});
test('stejný pokus podruhé nic nemění (idempotence)', () => {
  const a = applyFeel(undefined, 'a', 'easy');
  expect(applyFeel(a, 'a', 'easy')).toBe(a);
});
test('meze 0.7–1.3', () => {
  let p = EMPTY_PROGRESSION;
  for (let i = 0; i < 10; i++) p = applyFeel(p, `e${i}`, 'easy');
  expect(p.factor).toBe(PROGRESSION.max);
  for (let i = 0; i < 20; i++) p = applyFeel(p, `h${i}`, 'hard');
  expect(p.factor).toBe(PROGRESSION.min);
});
test('bez plovoucích chyb: 3× easy = 1.3 přesně', () => {
  let p = EMPTY_PROGRESSION;
  for (const id of ['1', '2', '3']) p = applyFeel(p, id, 'easy');
  expect(p.factor).toBe(1.3);
});
test('rated drží nejvýš 50 id', () => {
  let p = EMPTY_PROGRESSION;
  for (let i = 0; i < 80; i++) p = applyFeel(p, `x${i}`, 'right');
  expect(p.rated).toHaveLength(50);
  expect(p.rated[0]).toBe('x30');
});
test('combineScale násobí test korekcí; bez korekce beze změny', () => {
  expect(combineScale({ reps: 1.5, hold: 0.5 }, { factor: 1.2, rated: [] })).toEqual({ reps: 1.8, hold: 0.6 });
  expect(combineScale({ reps: 1, hold: 1 }, undefined)).toEqual({ reps: 1, hold: 1 });
});
