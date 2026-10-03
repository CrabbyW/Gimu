import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { Circle, Ellipse, Path, Svg } from 'react-native-svg';
import { buildTheme, type Scheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import type { Mood, SeasonThemeId } from '@/types';
import { SeasonScarf } from '../cosmetics';
import { OutfitScarf } from '../cosmetics/OutfitScarf';
import { OutfitTank } from '../cosmetics/OutfitTank';
import { AccWristbands } from '../cosmetics/AccWristbands';
import { Mascot, MASCOT_SIZES } from '..';
import { MOOD_POSE } from '../SvgMascot';
import { STAGE_GEOMETRY } from '../geometry';
import type { MascotProps } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
// ThemeProvider → settings store → AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// Reanimated 4 v Jestu: worklety bez nativního runtime.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const IDLE_MOUTH = 'M88 108 Q100 112 112 108';
const HAPPY_MOUTH = 'M86 104 Q100 122 114 104 Z';
const SAD_MOUTH = 'M88 112 Q100 104 112 112';

const base: MascotProps = { stage: 1, mood: 'idle', size: 'M', cosmetics: {} };
const tree = (props: Partial<MascotProps>, scheme: Scheme = 'dark', season: SeasonThemeId | null = null) => (
  <ThemeContext.Provider value={buildTheme(scheme, season)}>
    <Mascot {...base} {...props} />
  </ThemeContext.Provider>
);

let renderer: TestRenderer.ReactTestRenderer | null = null;
const unmount = () => {
  act(() => { renderer?.unmount(); });
  renderer = null;
};
const render = (props: Partial<MascotProps>, scheme?: Scheme, season: SeasonThemeId | null = null) => {
  unmount();
  act(() => { renderer = TestRenderer.create(tree(props, scheme, season)); });
  return renderer!.root;
};
afterEach(() => {
  unmount();
  jest.restoreAllMocks();
});

const labelOf = (root: ReactTestInstance) => root.findAll((n) => n.props.accessibilityRole === 'image')[0]?.props.accessibilityLabel;
const mouthOpacity = (root: ReactTestInstance, d: string) => root.findAllByType(Path).find((p) => p.props.d === d)?.props.opacity;

test('výchozí popisek pro čtečku podle nálady, vlastní popisek má přednost', () => {
  expect(labelOf(render({ mood: 'idle' }))).toBe('Tvoje opice');
  expect(labelOf(render({ mood: 'happy' }))).toBe('Tvoje opice má radost');
  expect(labelOf(render({ mood: 'happy', accessibilityLabel: 'Opice Bruno' }))).toBe('Opice Bruno');
});

test('pojmenovaná velikost se převede na pt, číselná zůstane', () => {
  expect(render({ size: 'L' }).findByType(Svg).props.width).toBe(MASCOT_SIZES.L);
  expect(render({ size: 90 }).findByType(Svg).props.height).toBe(90);
});

test('celebrate: ruce nahoru, opakované poskoky, veselý obličej', () => {
  expect(MOOD_POSE.celebrate).toEqual({ face: 'happy', armsUp: true, earsDown: false, breathHalfMs: 1200, hopRepeat: true });
});
test('sad: svěšené uši, smutný obličej, pomalejší dech', () => {
  expect(MOOD_POSE.sad).toEqual({ face: 'sad', armsUp: false, earsDown: true, breathHalfMs: 1800, hopRepeat: false });
});
test('idle a happy beze změny proti plánu A', () => {
  expect(MOOD_POSE.idle).toMatchObject({ face: 'idle', armsUp: false, hopRepeat: false, breathHalfMs: 1200 });
  expect(MOOD_POSE.happy).toMatchObject({ face: 'happy', armsUp: false, hopRepeat: false });
});

test.each<[Mood, 'idle' | 'happy' | 'sad']>([
  ['idle', 'idle'],
  ['happy', 'happy'],
  ['celebrate', 'happy'],
  ['sad', 'sad'],
])('nálada %s ukáže pusu %s', (mood, face) => {
  const root = render({ mood });
  expect(mouthOpacity(root, IDLE_MOUTH)).toBe(face === 'idle' ? 1 : 0);
  expect(mouthOpacity(root, HAPPY_MOUTH)).toBe(face === 'happy' ? 1 : 0);
  expect(mouthOpacity(root, SAD_MOUTH)).toBe(face === 'sad' ? 1 : 0);
});

test.each<Scheme>(['light', 'dark'])('detaily obličeje jsou tmavé i v režimu %s (leží na světlém obličeji)', (scheme) => {
  const eyes = render({}, scheme).findAllByType(Ellipse).filter((e) => e.props.rx === 5);
  expect(eyes).toHaveLength(2);
  eyes.forEach((e) => expect(e.props.fill).toBe('#181613'));
});

test('stage 2 a 3 kreslí vlastní geometrii bez varování, hlava se zmenšuje', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const headR = (stage: MascotProps['stage']) => {
    const { head } = STAGE_GEOMETRY[stage];
    const circles = render({ stage }).findAllByType(Circle).filter((n) => n.props.cx === head.cx && n.props.cy === head.cy);
    return circles[0]?.props.r;
  };
  expect(headR(1)).toBe(54);
  expect(headR(2)).toBe(STAGE_GEOMETRY[2].head.r);
  expect(headR(3)).toBe(STAGE_GEOMETRY[3].head.r);
  expect(new Set([headR(1), headR(2), headR(3)]).size).toBe(3);
  expect(warn).not.toHaveBeenCalled();
});

describe('kosmetické vrstvy', () => {
  const count = (root: ReactTestInstance, type: Parameters<ReactTestInstance['findAllByType']>[0]) => root.findAllByType(type).length;

  test('nasazený outfit a accessory se vykreslí, neznámé id se tiše přeskočí', () => {
    const root = render({ cosmetics: { outfit: 'outfit-tank-ember', accessory: 'acc-wristbands' } });
    expect(count(root, OutfitTank)).toBe(1);
    expect(count(root, AccWristbands)).toBe(1);
    expect(() => render({ cosmetics: { outfit: 'outfit-neexistuje', accessory: 'x' } })).not.toThrow();
  });

  test('sezónní šála: jen během Winter Arc a nekreslí se dvakrát, když je šála nasazená jako outfit', () => {
    expect(count(render({}, 'dark', null), SeasonScarf)).toBe(0);
    expect(count(render({}, 'dark', 'summerBody'), SeasonScarf)).toBe(0);
    expect(count(render({ cosmetics: { outfit: 'outfit-tank-ember' } }, 'dark', 'winterArc'), SeasonScarf)).toBe(1);
    const worn = render({ cosmetics: { outfit: 'outfit-winter-arc-scarf' } }, 'light', 'winterArc');
    expect(count(worn, SeasonScarf)).toBe(0);
    expect(count(worn, OutfitScarf)).toBe(1);
  });

  test.each([1, 2, 3] as const)('stage %s: potítka sedí na konci paže i při celebrate', (stage) => {
    const root = render({ stage, mood: 'celebrate', cosmetics: { accessory: 'acc-wristbands' } });
    const limb = STAGE_GEOMETRY[stage].armL;
    const bands = root.findAllByType(Path).filter((p) => p.props.strokeWidth === limb.w + 3);
    expect(bands).toHaveLength(2);
  });
});
