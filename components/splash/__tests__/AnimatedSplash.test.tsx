import TestRenderer, { act } from 'react-test-renderer';
import { Circle, Ellipse } from 'react-native-svg';
import { AnimatedSplash } from '@/components/splash/AnimatedSplash';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { splash } from '@/lib/motion';
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

beforeEach(() => { jest.useFakeTimers(); mockReduced = false; (feedback as jest.Mock).mockClear(); });
afterEach(() => { jest.useRealTimers(); });

describe('AnimatedSplash', () => {
  it('navazuje na nativní splash: stejná barva podkladu a velikost hlavy jako app.json', () => {
    const plugin = appJson.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-splash-screen') as [string, { backgroundColor: string; imageWidth: number }];
    expect(plugin[1].backgroundColor).toBe(dark.base);
    expect(plugin[1].imageWidth).toBe(dots.splash.head);
    const { r } = render();
    expect(r.root.findByProps({ testID: 'splash-head' }).props.style).toMatchObject({ width: dots.splash.head, height: dots.splash.head });
  });

  it('kruh 12 teček, jediná v akcentu live, ostatní tlumené; hlava z dark tokenů opice', () => {
    const { r } = render();
    const ring = r.root.findAll((n) => n.props.testID === 'splash-dot' && n.type === Circle);
    expect(ring).toHaveLength(dots.splash.count);
    expect(ring.filter((n) => n.props.fill === dark.live)).toHaveLength(1);
    expect(ring.filter((n) => n.props.fill === dark.mascotProp)).toHaveLength(dots.splash.count - 1);
    expect(r.root.findAllByType(Ellipse).map((e) => e.props.fill)).toEqual([dark.mascotEye, dark.mascotEye]);
  });

  it('a11y: jedno tlačítko s labelem a nápovědou, ťuknutí = onDone jednou', () => {
    const { r, onDone } = render();
    expect(tap(r).props.accessibilityHint).toBe(copy.intro.hint);
    expect(tap(r).props.accessibilityRole).toBe('button');
    act(() => { tap(r).props.onPress(); });
    act(() => { tap(r).props.onPress(); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('choreografie ≤ 1.2 s: onShown po layoutu, mrknutí s haptikou, pak prolnutí a onDone', () => {
    const onShown = jest.fn();
    const { r, onDone } = render({ ready: true, onShown });
    start(r);
    expect(onShown).toHaveBeenCalledTimes(1);
    advance(splash.blinkAt);
    expect(feedback).toHaveBeenCalledWith('introPulse');
    advance(splash.fadeAt - splash.blinkAt);
    advance(splash.fadeMs - 1);
    expect(onDone).not.toHaveBeenCalled();
    advance(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(splash.fadeAt + splash.fadeMs).toBeLessThanOrEqual(1200);
    expect(splash.dotStepMs * (dots.splash.count - 1) + splash.dotInMs).toBeLessThanOrEqual(splash.blinkAt);
  });

  it('appka není ready: drží, onDone až po ready + prolnutí', () => {
    const { r, onDone } = render({ ready: false });
    start(r);
    advance(5000);
    expect(onDone).not.toHaveBeenCalled();
    act(() => { r.update(<AnimatedSplash onDone={onDone} ready />); });
    advance(splash.fadeMs);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('omezený pohyb: bez kruhu a haptiky, jen rychlé prolnutí', () => {
    mockReduced = true;
    const { r, onDone } = render({ ready: true });
    expect(r.root.findAll((n) => n.props.testID === 'splash-ring')).toHaveLength(0);
    start(r);
    advance(splash.reducedFadeMs);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(feedback).not.toHaveBeenCalled();
  });
});
