import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { Circle, Ellipse, G, Path, Svg } from 'react-native-svg';
import { buildTheme, type Scheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import { MASCOT_POSE_IDS, MASCOT_POSES, type MascotPoseId } from '@/logic/mascotPoses';
import type { Mood } from '@/types';
import { Mascot, MASCOT_SIZES, mascotSeatY, MonkeyBack, MonkeyFront } from '..';
import { MOOD_POSE } from '../SvgMascot';
import { SEAT_Y, V2 } from '../monkeyGeometry';
import type { MascotProps } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const base: MascotProps = { stage: 1, mood: 'idle', size: 'M', cosmetics: {} };
let renderer: TestRenderer.ReactTestRenderer | null = null;
const unmount = () => { act(() => { renderer?.unmount(); }); renderer = null; };
const renderWith = (el: React.ReactElement, scheme: Scheme = 'dark') => {
  unmount();
  act(() => { renderer = TestRenderer.create(<ThemeContext.Provider value={buildTheme(scheme, null)}>{el}</ThemeContext.Provider>); });
  return renderer!.root;
};
const render = (props: Partial<MascotProps>, scheme: Scheme = 'dark') => renderWith(<Mascot {...base} {...props} />, scheme);
afterEach(() => { unmount(); jest.restoreAllMocks(); });

const labelOf = (root: ReactTestInstance) => root.findAll((n) => n.props.accessibilityRole === 'image')[0]?.props.accessibilityLabel;
const eyes = (root: ReactTestInstance) => root.findAllByType(Ellipse).filter((e) => e.props.rx === V2.eyes.rx);
const head = (root: ReactTestInstance) => root.findAllByType(Circle).filter((n) => n.props.r === V2.head.r);
const byTestID = (root: ReactTestInstance, id: string) => root.findAll((n) => n.props.testID === id && n.type === G);

test('výchozí popisek pro čtečku podle nálady, vlastní popisek má přednost', () => {
  expect(labelOf(render({ mood: 'idle' }))).toBe('Your monkey');
  expect(labelOf(render({ mood: 'happy' }))).toBe('Your monkey is happy');
  expect(labelOf(render({ mood: 'happy', accessibilityLabel: 'Opice Bruno' }))).toBe('Opice Bruno');
});

test('pojmenovaná velikost se převede na pt, číselná zůstane', () => {
  expect(render({ size: 'L' }).findByType(Svg).props.width).toBe(MASCOT_SIZES.L);
  expect(render({ size: 90 }).findByType(Svg).props.height).toBe(90);
});

test('pohybový charakter nálad (dech, poskoky) zůstává', () => {
  expect(MOOD_POSE.celebrate).toMatchObject({ hopRepeat: true, breathHalfMs: 1200 });
  expect(MOOD_POSE.sad).toMatchObject({ breathHalfMs: 1800, hopRepeat: false });
});

test.each<Scheme>(['dark', 'light'])('barvy jen z theme (%s): silueta, obličej a oči z tokenů `mascot*`', (scheme) => {
  const { c } = buildTheme(scheme, null);
  const root = render({}, scheme);
  expect(head(root)[0]?.props.fill).toBe(c.mascotFur);
  expect(root.findAllByType(Path).find((p) => p.props.d === V2.face)?.props.fill).toBe(c.mascotFace);
  expect(eyes(root)).toHaveLength(2);
  eyes(root).forEach((e) => expect(e.props.fill).toBe(c.mascotEye));
});

test('dark = negativ (světlá silueta), light = originál (tmavá silueta)', () => {
  expect(buildTheme('dark', null).c.mascotFur).toBe(buildTheme('dark', null).c.text);
  expect(buildTheme('light', null).c.mascotFur).toBe(buildTheme('light', null).c.text);
});

test.each(MASCOT_POSE_IDS)('póza %s se vykreslí: hlava, obě oči, končetiny jako samostatné vrstvy', (pose: MascotPoseId) => {
  const root = render({ pose });
  expect(head(root)).toHaveLength(1);
  expect(eyes(root)).toHaveLength(2);
  // Pózy s výřezem (jen hlava, busta) končetiny nekreslí.
  const full = MASCOT_POSES[pose].figure === 'full' ? 1 : 0;
  expect(byTestID(root, 'mascot-arms')).toHaveLength(full);
  expect(byTestID(root, 'mascot-legs')).toHaveLength(full);
});

test('rekvizity: červená jen tam, kde je v referenci (loader, varování, zvonek, plamen, oslava)', () => {
  const { c } = buildTheme('dark', null);
  const reds = MASCOT_POSE_IDS.filter((pose) => render({ pose }).findAllByType(Circle).some((n) => n.props.fill === c.live));
  expect(reds.sort()).toEqual(['celebrate', 'loading', 'notify', 'streak', 'warning']);
  // Každá rekvizita je samostatná vrstva (za postavou nebo před ní).
  const layers = (pose: MascotPoseId) => byTestID(render({ pose }), 'mascot-props-back').length + byTestID(render({ pose }), 'mascot-props-front').length;
  for (const pose of MASCOT_POSE_IDS.slice(8)) {
    if (['flex', 'handstand', 'plank', 'stretch'].includes(pose)) expect(layers(pose)).toBe(0);
    else expect(layers(pose)).toBeGreaterThan(0);
  }
  expect(layers('idle')).toBe(0);
});

test('doplňky z teček: tečka radosti jen v oslavě, Zz ve spánku, hrazda ve visu', () => {
  const { c } = buildTheme('dark', null);
  const red = (root: ReactTestInstance) => root.findAllByType(Circle).filter((n) => n.props.fill === c.live);
  expect(red(render({ pose: 'celebrate' }))).toHaveLength(1);
  expect(red(render({ mood: 'celebrate' }))).toHaveLength(1);
  expect(red(render({ pose: 'idle' }))).toHaveLength(0);
  const props = (pose: MascotPoseId) => render({ pose }).findAllByType(Circle).filter((n) => n.props.fill === c.mascotProp).length;
  expect(props('sleep')).toBeGreaterThan(0);
  expect(props('hang')).toBeGreaterThan(0);
  expect(props('idle')).toBe(0);
});

test.each<[Mood, number]>([['idle', V2.eyes.ry], ['sad', 3.2]])('nálada %s: výška očí z pózy', (mood, ry) => {
  eyes(render({ mood })).forEach((e) => expect(e.props.ry).toBe(ry));
});

test('cosmetics se přijmou a ignorují (šatník dočasně bez vizuálu)', () => {
  expect(() => render({ cosmetics: { outfit: 'outfit-tank-ember', accessory: 'acc-wristbands' } })).not.toThrow();
});

describe('vrstvy pro sezení na kotouči', () => {
  test('celá opice má nohy i hlavu; zadní vrstva bez nohou, přední jen nohy a je dekorativní', () => {
    expect(byTestID(render({}), 'mascot-legs')).toHaveLength(1);
    const back = renderWith(<MonkeyBack {...base} />);
    expect(byTestID(back, 'mascot-legs')).toHaveLength(0);
    expect(labelOf(back)).toBe('Your monkey');
    const front = renderWith(<MonkeyFront {...base} />);
    expect(byTestID(front, 'mascot-legs')).toHaveLength(1);
    expect(eyes(front)).toHaveLength(0);
    expect(front.findAll((n) => n.props.accessibilityRole === 'image')).toHaveLength(0);
  });

  test('kotva sezení = spodní hrana trupu', () => {
    expect(mascotSeatY(1)).toBe(SEAT_Y);
    expect(SEAT_Y).toBe(V2.torso.y + V2.torso.h);
  });
});
