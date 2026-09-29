import { hashString, mulberry32 } from '@/logic/random';

test('mulberry32 je deterministický a v [0,1)', () => {
  const a = mulberry32(hashString('opice')); const b = mulberry32(hashString('opice'));
  const xs = Array.from({ length: 50 }, () => a());
  expect(xs).toEqual(Array.from({ length: 50 }, () => b()));
  expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
});
test('hashString rozlišuje vstupy', () => { expect(hashString('a')).not.toBe(hashString('b')); });
