import TestRenderer, { act } from 'react-test-renderer';
import { DotIntro } from '@/components/intro/DotIntro';
import { copy } from '@/data/copy';
import { textDots } from '@/logic/dotGlyphs';
import { feedback } from '@/lib/feedback';
import { dotIntro, dotIntroPlayedMs } from '@/lib/motion';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
let mockReduced = false;
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return { __esModule: true, ...actual, default: actual.default, useReducedMotion: () => mockReduced };
});
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));

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

describe('DotIntro choreografie', () => {
  beforeEach(() => { jest.useFakeTimers(); mockReduced = false; (feedback as jest.Mock).mockClear(); });
  afterEach(() => { jest.useRealTimers(); });
  const start = (r: TestRenderer.ReactTestRenderer) => act(() => { r.root.findByProps({ testID: 'dot-intro-layer' }).props.onLayout(); });
  const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });
  const animated = { progress: undefined };

  it('první layout ohlásí onShown (schování splashe) a spustí sken; po dohrání + prolnutí onDone', () => {
    const onShown = jest.fn();
    const { r, onDone } = render({ ...animated, ready: true, onShown });
    expect(onDone).not.toHaveBeenCalled();
    start(r);
    expect(onShown).toHaveBeenCalledTimes(1);
    advance(dotIntro.scanMs);
    expect(feedback).toHaveBeenCalledWith('introPulse');
    advance(dotIntroPlayedMs(false) - dotIntro.scanMs);
    advance(dotIntro.fadeMs - 1);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(dotIntroPlayedMs(false) + dotIntro.fadeMs).toBeLessThanOrEqual(1300);
  });

  it('appka není ready: nápis drží, onDone až po ready + prolnutí', () => {
    const { r, onDone } = render({ ...animated, ready: false });
    start(r);
    advance(5000);
    expect(onDone).not.toHaveBeenCalled();
    act(() => { r.update(<ThemeContext.Provider value={theme}><DotIntro onDone={onDone} ready /></ThemeContext.Provider>); });
    advance(dotIntro.fadeMs);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('skip ťuknutím kdykoli: onDone hned a jen jednou', () => {
    const { r, onDone } = render({ ...animated, ready: true });
    start(r);
    advance(100);
    act(() => { r.root.findByProps({ testID: 'dot-intro', accessibilityLabel: copy.intro.label }).props.onPress(); });
    expect(onDone).toHaveBeenCalledTimes(1);
    advance(3000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('omezený pohyb: bez skenu a haptiky, jen prolnutí reducedFadeMs po ready', () => {
    mockReduced = true;
    const { r, onDone } = render({ ...animated, ready: true });
    start(r);
    advance(dotIntro.reducedFadeMs - 1);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(feedback).not.toHaveBeenCalled();
  });

  it('bez layoutu (pod splashem) choreografie nezačne', () => {
    const { onDone } = render({ ...animated, ready: true });
    advance(5000);
    expect(onDone).not.toHaveBeenCalled();
  });
});
