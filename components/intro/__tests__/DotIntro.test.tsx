import TestRenderer, { act } from 'react-test-renderer';
import { DotIntro } from '@/components/intro/DotIntro';
import { copy } from '@/data/copy';
import { textDots } from '@/logic/dotGlyphs';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const theme = buildTheme('dark', null);
const render = (props: Partial<Parameters<typeof DotIntro>[0]> = {}) => {
  const onDone = jest.fn();
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<ThemeContext.Provider value={theme}><DotIntro onDone={onDone} {...props} /></ThemeContext.Provider>);
  });
  return { r, onDone };
};
const bg = (n: TestRenderer.ReactTestInstance) => (n.props.style as { backgroundColor: string }).backgroundColor;

describe('DotIntro', () => {
  it('vykreslí všechny tečky OPICE rozsvícené v `text`', () => {
    const { r } = render();
    const on = r.root.findAll((n) => n.props.testID === 'intro-dot-on' && typeof n.type === 'string');
    expect(on).toHaveLength(textDots('OPICE').dots.length);
    on.forEach((n) => expect(bg(n)).toBe(theme.c.text));
    expect(r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('intro-col-') && typeof n.type === 'string')).toHaveLength(29);
  });
  it('progress 0 = vše zhasnuté (dotOff)', () => {
    const { r } = render({ progress: 0 });
    r.root.findAll((n) => n.props.testID === 'intro-dot-on' && typeof n.type === 'string').forEach((n) => expect(bg(n)).toBe(theme.c.dotOff));
  });
  it('a11y: jeden prvek s labelem a nápovědou, tečky skryté', () => {
    const { r } = render();
    const root = r.root.findByProps({ testID: 'dot-intro', accessibilityLabel: copy.intro.label });
    expect(root.props.accessibilityHint).toBe(copy.intro.hint);
    expect(root.props.accessibilityRole).toBe('button');
    expect(r.root.findByProps({ testID: 'intro-word', accessibilityElementsHidden: true })).toBeTruthy();
  });
  it('ťuknutí volá onDone', () => {
    const { r, onDone } = render();
    act(() => { r.root.findByProps({ testID: 'dot-intro', accessibilityLabel: copy.intro.label }).props.onPress(); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
