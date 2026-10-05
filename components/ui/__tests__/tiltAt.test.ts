import { tiltAt } from '../useTilePress';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

test('naklopení k bodu dotyku: střed rovně, rohy max 6°, mimo dlaždici oříznuté', () => {
  expect(tiltAt(50, 50, 100, 100, 6)).toEqual({ rx: -0, ry: 0 });
  expect(tiltAt(100, 0, 100, 100, 6)).toEqual({ rx: 6, ry: 6 });
  expect(tiltAt(0, 100, 100, 100, 6)).toEqual({ rx: -6, ry: -6 });
  expect(tiltAt(500, -500, 100, 100, 6)).toEqual({ rx: 6, ry: 6 });
  expect(tiltAt(10, 10, 0, 0, 6)).toEqual({ rx: 0, ry: 0 });
});
