import { createSfxGate } from '@/logic/sfxGate';

test('stejný zvuk nejvýš jednou za 40 ms', () => {
  const gate = createSfxGate(40);
  expect(gate.allow('tick', 0)).toBe(true);
  expect(gate.allow('tick', 20)).toBe(false);
  expect(gate.allow('tick', 39)).toBe(false);
  expect(gate.allow('tick', 40)).toBe(true);
});
test('různé zvuky se neblokují', () => {
  const gate = createSfxGate(40);
  expect(gate.allow('tick', 0)).toBe(true);
  expect(gate.allow('snap', 5)).toBe(true);
});
test('rychlý tah po tab baru (5 slotů za 200 ms) = 5 tiků max, žádné bzučení', () => {
  const gate = createSfxGate(40);
  const played = [0, 10, 20, 50, 60, 100, 150, 200].filter((t) => gate.allow('tick', t));
  expect(played).toEqual([0, 50, 100, 150, 200]);
});
