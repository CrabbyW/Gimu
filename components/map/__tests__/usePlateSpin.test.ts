import { angleDelta, ticksCrossed } from '../usePlateSpin';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

test('angleDelta: přechod přes ±π nedá skok o celou otáčku', () => {
  expect(angleDelta(3.1, -3.1)).toBeCloseTo(0.0832, 3);
  expect(angleDelta(-3.1, 3.1)).toBeCloseTo(-0.0832, 3);
  expect(angleDelta(0, 1)).toBeCloseTo(1);
  expect(angleDelta(1, 0)).toBeCloseTo(-1);
});

test('ticksCrossed: tik po každých 30°', () => {
  expect(ticksCrossed(0, 65, 30)).toBe(2);
  expect(ticksCrossed(65, 0, 30)).toBe(2);
  expect(ticksCrossed(10, 20, 30)).toBe(0);
  expect(ticksCrossed(-5, 5, 30)).toBe(1);
});
