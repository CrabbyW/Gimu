import TestRenderer, { act } from 'react-test-renderer';
import { labelYield, lineBubble } from '@/lib/motion';
import { useLabelYield } from '../useLabelYield';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mock knihovny */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
const mockTiming = jest.fn();
const mockDelay = jest.fn();
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {
    __esModule: true, ...actual, default: actual.default,
    withTiming: (...a: unknown[]) => { mockTiming(...a); return actual.withTiming(...a); },
    withDelay: (...a: unknown[]) => { mockDelay(...a); return actual.withDelay(...a); },
  };
});

function Probe({ hidden }: { hidden: boolean }) { useLabelYield(hidden); return null; }
let r: TestRenderer.ReactTestRenderer | null = null;
beforeEach(() => { mockTiming.mockClear(); mockDelay.mockClear(); });
afterEach(() => { act(() => r?.unmount()); r = null; });

test('rytmus: popisek ustoupí dřív, než bublina nastoupí, a vrátí se až po jejím odchodu', () => {
  expect(labelYield.outMs).toBeLessThan(lineBubble.inMs);
  expect(labelYield.backDelayMs).toBeGreaterThanOrEqual(lineBubble.outMs);
});

test('hidden → prolnutí na 0 (outMs), zpět → po odchodu bubliny prolnutí na 1; i s omezeným pohybem', () => {
  act(() => { r = TestRenderer.create(<Probe hidden={false} />); });
  mockTiming.mockClear(); mockDelay.mockClear();
  act(() => { r!.update(<Probe hidden />); });
  expect(mockTiming).toHaveBeenCalledWith(0, expect.objectContaining({ duration: labelYield.outMs, reduceMotion: 'never' }));
  expect(mockDelay).not.toHaveBeenCalled();
  mockTiming.mockClear();
  act(() => { r!.update(<Probe hidden={false} />); });
  expect(mockTiming).toHaveBeenCalledWith(1, expect.objectContaining({ duration: labelYield.inMs, reduceMotion: 'never' }));
  expect(mockDelay.mock.calls[0]![0]).toBe(labelYield.backDelayMs);
});
