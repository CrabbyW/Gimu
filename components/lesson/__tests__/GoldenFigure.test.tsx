import TestRenderer, { act } from 'react-test-renderer';
import { Circle, Path } from 'react-native-svg';
import { buildTheme, PHI } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import { figureRadii, GoldenFigure, goldenSpiral } from '../GoldenFigure';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// Plate (konstanty kotouče) tahá ikony v ESM; tady nejsou potřeba.
jest.mock('lucide-react-native', () => ({}));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const render = (calm: boolean) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      <ThemeContext.Provider value={buildTheme('dark', null)}>
        <GoldenFigure r={100} cx={250} cy={90} drawn calm={calm} />
      </ThemeContext.Provider>,
    );
  });
  return r;
};

describe('GoldenFigure', () => {
  it.each([false, true])('vykreslí 4 kružnice a spirálu bez pádu (calm=%s)', (calm) => {
    const r = render(calm);
    expect(r.root.findAllByType(Circle)).toHaveLength(4);
    expect(r.root.findAllByType(Path)).toHaveLength(1);
  });

  it('poloměry jdou v poměru φ', () => {
    const radii = figureRadii(100);
    expect(radii[0]).toBeCloseTo(100);
    for (let i = 1; i < radii.length; i++) expect(radii[i - 1]! / radii[i]!).toBeCloseTo(PHI);
  });

  it('spirála konverguje do zadaného středu', () => {
    const { d } = goldenSpiral(100, 250, 90);
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const [ex = NaN, ey = NaN] = nums.slice(-2);
    // Po 5 čtvrtkruzích je konec blíž než poslední poloměr R/φ⁴.
    expect(Math.hypot(ex - 250, ey - 90)).toBeLessThan(100 / PHI ** 4);
  });
});
