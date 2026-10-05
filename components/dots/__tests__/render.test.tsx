import type { ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DotField, DotMatrix, DotPlate, DotRing, DotRow, SkiaGuard } from '@/components/dots';
import { skiaState } from '@/lib/skiaReady';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const render = (ui: ReactElement, scheme: 'dark' | 'light' = 'dark') => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme(scheme, null)}>{ui}</ThemeContext.Provider>); });
  return r!.root;
};
/** Skia props mohou být sdílené hodnoty (pohyb na UI vlákně): test čte aktuální hodnotu. */
const val = (p: unknown): unknown => (p !== null && typeof p === 'object' && 'value' in p ? (p as { value: unknown }).value : p);
const byTestId = (root: TestRenderer.ReactTestInstance, id: string) => root.findAll((n) => n.props.testID === id);

afterEach(() => { skiaState.ready = true; });
beforeEach(() => { skiaState.ready = true; });

test('SkiaGuard bez Skia vykreslí fallback místo plátna', () => {
  skiaState.ready = false;
  const root = render(<SkiaGuard><DotRow total={5} fraction={0.4} /></SkiaGuard>);
  expect(byTestId(root, 'dotrow-canvas')).toHaveLength(0);
});

test('DotPlate bez Skia nespadne a nechá popisek', () => {
  skiaState.ready = false;
  const root = render(<DotPlate kg={10} size={72} state="locked" />);
  expect(byTestId(root, 'dotplate-canvas')).toHaveLength(0);
  expect(root.findAll((n) => typeof n.props.accessibilityLabel === 'string' && /10 kg/.test(n.props.accessibilityLabel)).length).toBeGreaterThan(0);
});

test('DotPlate má accessibilityLabel s kg', () => {
  const root = render(<DotPlate kg={20} size={88} state="current" />);
  expect(root.findAll((n) => typeof n.props.accessibilityLabel === 'string' && /20 kg/.test(n.props.accessibilityLabel)).length).toBeGreaterThan(0);
  expect(byTestId(root, 'dotplate-canvas').length).toBeGreaterThan(0);
});

test('DotPlate decorative je pro čtečku skrytý', () => {
  const root = render(<DotPlate kg={20} size={88} state="done" decorative />);
  expect(root.findAll((n) => typeof n.props.accessibilityLabel === 'string' && /20 kg/.test(n.props.accessibilityLabel))).toHaveLength(0);
});

test('záře jen v dark: light nekreslí BlurMask', () => {
  const blur = (root: TestRenderer.ReactTestInstance) => root.findAll((n) => n.props.skiaType === 'BlurMask' && typeof n.type === 'string');
  expect(blur(render(<DotRow total={4} fraction={0.5} />, 'dark')).length).toBeGreaterThan(0);
  expect(blur(render(<DotRow total={4} fraction={0.5} />, 'light'))).toHaveLength(0);
});

test('DotRing rozsvítí podíl teček podle progress', () => {
  const root = render(<DotRing progress={0.5} size={200} count={32} intro={false} />, 'light');
  const pts = root.findAll((n) => n.props.skiaType === 'Points' && typeof n.type === 'string');
  // Pořadí: vnější rastr, zhasnuté, rozsvícené (light bez záře).
  expect(val(pts[1]!.props.points)).toHaveLength(16);
  expect(val(pts[2]!.props.points)).toHaveLength(16);
});

test('DotField drží strop počtu teček', () => {
  const root = render(<DotField width={390} height={844} fade="down" />);
  const total = root.findAll((n) => n.props.skiaType === 'Points' && typeof n.type === 'string')
    .reduce((s, n) => s + (val(n.props.points) as unknown[]).length, 0);
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(600);
});

test('DotMatrix vykreslí prstenec dneška', () => {
  const root = render(<DotMatrix cols={7} rows={5} lit={[true, false, true]} today={2} />);
  expect(root.findAll((n) => n.props.skiaType === 'Circle' && typeof n.type === 'string')).toHaveLength(1);
});

test('DotRow s nástupem začíná zhasnutý, bez nástupu rovnou rozsvícený', () => {
  const lit = (root: TestRenderer.ReactTestInstance) => root.findAll((n) => n.props.skiaType === 'Points' && typeof n.type === 'string')
    .map((n) => (val(n.props.points) as unknown[]).length);
  // light: [zhasnuté, rozsvícené, rozsvěcovaná]
  expect(lit(render(<DotRow total={4} fraction={0.5} />, 'light'))).toEqual([4, 0, 0]);
  expect(lit(render(<DotRow total={4} fraction={0.5} intro={false} />, 'light'))).toEqual([2, 2, 0]);
});
