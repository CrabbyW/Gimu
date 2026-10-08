import { plankRingProgress, stopwatchSeconds } from '@/hooks/useStopwatch';
import { fitnessTest } from '@/lib/motion';
/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mock knihovny */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

// Stopky planku (elite fáze 5): čas jen z časových značek. Simulované zamčení = interval nepřekresluje,
// po odemčení přijde jediný snímek s novým Date.now(). Číslo i prstenec musí ukázat skutečně uběhlý čas.
describe('stopky po zamčení telefonu', () => {
  const t0 = 1_700_000_000_000;
  test('po 95 s zamčení ukáže 95 s a prstenec 35/60', () => {
    const secs = stopwatchSeconds(t0, t0 + 95_400, 600);
    expect(secs).toBe(95);
    expect(plankRingProgress(secs)).toBeCloseTo(35 / fitnessTest.ringLapS);
  });
  test('strop max, záporný skok hodin = 0', () => {
    expect(stopwatchSeconds(t0, t0 + 3_600_000, 600)).toBe(600);
    expect(stopwatchSeconds(t0, t0 - 5_000, 600)).toBe(0);
  });
  test('prstenec: 0 prázdný, celá minuta plná, pak nové kolo', () => {
    expect(plankRingProgress(0)).toBe(0);
    expect(plankRingProgress(60)).toBe(1);
    expect(plankRingProgress(61)).toBeCloseTo(1 / 60);
  });
});
