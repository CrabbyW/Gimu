import TestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { AnimatedSplash } from '@/components/splash/AnimatedSplash';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { introHopPending, resetIntroHop, takeIntroHop } from '@/lib/introHop';
import { splash } from '@/lib/motion';
import { SPLASH_GLYPHS, textDots } from '@/logic/dotGlyphs';
import { dots } from '@/theme';
import { dark } from '@/theme/palettes';
import appJson from '../../../app.json';

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

const render = (props: Partial<Parameters<typeof AnimatedSplash>[0]> = {}) => {
  const onDone = jest.fn();
  let r!: TestRenderer.ReactTestRenderer;
  act(() => { r = TestRenderer.create(<AnimatedSplash onDone={onDone} {...props} />); });
  return { r, onDone };
};
const tap = (r: TestRenderer.ReactTestRenderer) => r.root.findByProps({ testID: 'splash', accessibilityLabel: copy.intro.label });
const start = (r: TestRenderer.ReactTestRenderer) => act(() => { r.root.findByProps({ testID: 'splash-layer' }).props.onLayout(); });
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });

beforeEach(() => { jest.useFakeTimers(); resetIntroHop(); mockReduced = false; (feedback as jest.Mock).mockClear(); });
afterEach(() => { jest.useRealTimers(); });

describe('AnimatedSplash', () => {
  it('navazuje na nativní splash: stejná barva podkladu a app.json imageWidth z tokenu', () => {
    const plugin = appJson.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-splash-screen') as [string, { backgroundColor: string; imageWidth: number }];
    expect(plugin[1].backgroundColor).toBe(dark.base);
    expect(plugin[1].imageWidth).toBe(dots.splash.head);
  });

  it('nápis GIMU z teček: svítící tečky = glyfy, jediná tečka v live (nad I), bez opice', () => {
    const { r } = render();
    const on = r.root.findAll((n) => n.props.testID === 'splash-dot-on' && typeof n.type === 'string');
    expect(on).toHaveLength(textDots('GIMU', SPLASH_GLYPHS).dots.length);
    const liveDots = r.root.findAll((n) => typeof n.type === 'string' && StyleSheet.flatten(n.props.style)?.backgroundColor === dark.live);
    expect(liveDots).toHaveLength(1);
    expect(r.root.findAllByProps({ testID: 'splash-head' })).toHaveLength(0);
  });

  it('a11y: jedno tlačítko s labelem a nápovědou, ťuknutí = onDone jednou', () => {
    const { r, onDone } = render();
    expect(tap(r).props.accessibilityHint).toBe(copy.intro.hint);
    expect(tap(r).props.accessibilityRole).toBe('button');
    act(() => { tap(r).props.onPress(); });
    act(() => { tap(r).props.onPress(); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('choreografie 03: onShown po layoutu, živá tečka mrkne s haptikou, pak ústup do mapy a onDone', () => {
    const onShown = jest.fn();
    const { r, onDone } = render({ ready: true, onShown });
    start(r);
    expect(onShown).toHaveBeenCalledTimes(1);
    advance(splash.liveAt - 1);
    expect(feedback).not.toHaveBeenCalled();
    advance(1);
    expect(feedback).toHaveBeenCalledWith('introPulse');
    advance(splash.exitAt - splash.liveAt);
    advance(splash.exitMs - 1);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(splash.exitAt + splash.exitMs).toBe(splash.totalMs);
    expect(splash.totalMs).toBeLessThanOrEqual(1800);
    // Pořadí: sken dohraje dřív než živá tečka; rozsvícení + mrknutí před ústupem.
    const cols = textDots('GIMU', SPLASH_GLYPHS).cols;
    expect((cols + splash.colFade) * splash.colStepMs).toBeLessThanOrEqual(splash.liveAt);
    expect(splash.liveAt + splash.liveMs + splash.blinkMs).toBeLessThanOrEqual(splash.exitAt);
  });

  it('appka není ready: drží, onDone až po ready + ústupu', () => {
    const { r, onDone } = render({ ready: false });
    start(r);
    advance(5000);
    expect(onDone).not.toHaveBeenCalled();
    act(() => { r.update(<AnimatedSplash onDone={onDone} ready />); });
    advance(splash.exitMs);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('omezený pohyb: bez haptiky, jen rychlé prolnutí', () => {
    mockReduced = true;
    const { r, onDone } = render({ ready: true });
    start(r);
    advance(splash.reducedFadeMs);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(feedback).not.toHaveBeenCalled();
  });

  it('skok opice po splashi: layout ohlásí splash (opice čeká), konec ho pustí právě jednou', () => {
    const { r } = render({ ready: true });
    expect(introHopPending()).toBe(false);
    start(r);
    expect(introHopPending()).toBe(true);
    expect(takeIntroHop()).toBe(false);
    act(() => { tap(r).props.onPress(); });
    expect(takeIntroHop()).toBe(true);
    expect(takeIntroHop()).toBe(false);
    expect(introHopPending()).toBe(false);
  });
});
