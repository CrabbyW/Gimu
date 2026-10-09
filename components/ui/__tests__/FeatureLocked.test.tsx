import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { ReturnLine } from '@/components/map/ReturnLine';
import { FeatureLocked } from '@/components/ui/FeatureLocked';
import { copy } from '@/data/copy';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

const render = (el: React.ReactElement) => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme('dark', null)}>{el}</ThemeContext.Provider>); });
  return r!.root;
};
const texts = (root: ReactTestInstance) => root.findAll((n) => typeof n.type === 'string')
  .flatMap((n) => n.children.filter((c): c is string => typeof c === 'string'));
const allText = (root: ReactTestInstance) => texts(root).join('|');

describe('FeatureLocked (zamčený tab, U4)', () => {
  test('ukáže štítek, počet lekcí, větu co to je, tečky pokroku a jednu akci', () => {
    const onCta = jest.fn();
    const root = render(<FeatureLocked what={copy.disclosure.what.league} left={2} done={1} need={3} stage={1} cosmetics={{}} onCta={onCta} />);
    const t = allText(root);
    expect(t).toContain(copy.disclosure.unlocksIn(2));
    expect(t).toContain(copy.disclosure.what.league);
    expect(t).toContain(copy.disclosure.tally(1, 3));
    expect(root.findAll((n) => n.props.accessibilityLabel === copy.disclosure.tallyA11y(1, 3)).length).toBeGreaterThan(0);
    const cta = root.findAll((n) => n.props.accessibilityLabel === copy.disclosure.cta && typeof n.props.onPress === 'function')[0];
    act(() => { cta!.props.onPress(); });
    expect(onCta).toHaveBeenCalledTimes(1);
  });
});

describe('ReturnLine (Next / série)', () => {
  test('atRisk: věta série první, pak Next', () => {
    const t = allText(render(<ReturnLine line={{ next: { title: 'Knee push-ups', minutes: 6 }, risk: 'atRisk' }} />));
    expect(t.indexOf(copy.returnLine.atRisk)).toBeGreaterThanOrEqual(0);
    expect(t.indexOf(copy.returnLine.next('Knee push-ups', 6))).toBeGreaterThan(t.indexOf(copy.returnLine.atRisk));
  });
  test('done: „Done today · see you tomorrow.“', () => {
    expect(allText(render(<ReturnLine line={{ next: null, risk: 'done' }} />))).toContain(copy.returnLine.done);
  });
  test('none bez Next: nic', () => {
    const root = render(<ReturnLine line={{ next: null, risk: 'none' }} />);
    expect(root.findAll((n) => n.props.testID === 'return-line')).toHaveLength(0);
  });
  test('none s Next: jen Next, bez věty o sérii', () => {
    const t = allText(render(<ReturnLine line={{ next: { title: 'A', minutes: 3 }, risk: 'none' }} />));
    expect(t).toContain(copy.returnLine.next('A', 3));
    expect(t).not.toContain(copy.returnLine.atRisk);
  });
});
