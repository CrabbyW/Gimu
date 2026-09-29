import { UNLOCK_STEPS, findUnlockPair, unlockFrame } from '@/components/map/unlockSequence';

const nodes = [
  { id: 'a', state: 'done' as const }, { id: 'b', state: 'done' as const },
  { id: 'c', state: 'current' as const }, { id: 'd', state: 'locked' as const },
];

test('pár pro sekvenci: předchozí dokončený uzel a nově odemčený current', () => {
  expect(findUnlockPair(nodes, 'c')).toEqual({ prevId: 'b', nextId: 'c' });
});

test('neplatný nebo zastaralý parametr sekvenci nespustí', () => {
  expect(findUnlockPair(nodes, 'x')).toBeNull();
  expect(findUnlockPair(nodes, 'a')).toBeNull(); // první uzel nemá předchůdce
  expect(findUnlockPair(nodes, 'd')).toBeNull(); // zamčený = parametr neodpovídá stavu
  expect(findUnlockPair(nodes, 'b')).toBeNull(); // už dokončený
  expect(findUnlockPair(nodes, null)).toBeNull();
});

test('časovaná fáze jdou vzestupně podle spec §7.2 (scroll, fajfka, čára, odemčení)', () => {
  expect(UNLOCK_STEPS).toEqual([{ phase: 1, at: 0 }, { phase: 2, at: 350 }, { phase: 3, at: 700 }, { phase: 4, at: 1100 }]);
});

test('snímky sekvence: před fajfkou vypadá nový uzel zamčeně, opice skočí až po odemčení', () => {
  expect(unlockFrame(0)).toEqual({ prevCheck: 'hidden', segment: 'pending', next: 'locked', mascotOn: 'prev' });
  expect(unlockFrame(1)).toEqual(unlockFrame(0));
  expect(unlockFrame(2)).toEqual({ prevCheck: 'draw', segment: 'pending', next: 'locked', mascotOn: 'prev' });
  expect(unlockFrame(3)).toEqual({ prevCheck: 'draw', segment: 'draw', next: 'locked', mascotOn: 'prev' });
  expect(unlockFrame(4)).toEqual({ prevCheck: 'draw', segment: 'draw', next: 'unlocking', mascotOn: 'prev' });
  expect(unlockFrame(5)).toEqual({ prevCheck: 'draw', segment: 'draw', next: 'current', mascotOn: 'next' });
  expect(unlockFrame(6)).toEqual({ prevCheck: 'static', segment: 'drawn', next: 'current', mascotOn: 'next' });
});

test('bez sekvence je všechno v konečném stavu', () => {
  expect(unlockFrame(null)).toEqual(unlockFrame(6));
});
