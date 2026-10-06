import { shouldMountCanvas } from '../canvasBudget';

it('nativ kreslí vždy, i na rozostřené obrazovce', () => {
  expect(shouldMountCanvas('ios', false)).toBe(true);
  expect(shouldMountCanvas('android', false)).toBe(true);
});

it('web kreslí jen na zaostřené obrazovce', () => {
  expect(shouldMountCanvas('web', true)).toBe(true);
  expect(shouldMountCanvas('web', false)).toBe(false);
});
