import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { copy } from '@/data/copy';
import { LINE_SHOW_MS, useMascotLine } from '@/hooks/useMascotLine';
import { REACTION_COOLDOWN_MS } from '@/logic/mascotReactions';

jest.mock('@/lib/clock', () => ({ now: () => new Date(2026, 9, 7, 9) }));

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date(2026, 9, 7, 9)); });
afterEach(() => jest.useRealTimers());

const stats = { streak: 0, todayDone: true };

/** Minimální renderHook nad react-test-renderer (projekt nemá @testing-library). */
function renderHook<P, R>(fn: (p: P) => R, opts?: { initialProps: P }) {
  const result = { current: undefined as unknown as R };
  const Probe = (p: { v: P }) => { result.current = fn(p.v); return null; };
  let r!: TestRenderer.ReactTestRenderer;
  act(() => { r = TestRenderer.create(createElement(Probe, { v: opts?.initialProps as P })); });
  return { result, rerender: (v: P) => act(() => { r.update(createElement(Probe, { v })); }) };
}

test('say ukáže větu z kontextu a po LINE_SHOW_MS zmizí', () => {
  const { result } = renderHook(() => useMascotLine(stats));
  act(() => result.current.say());
  expect(copy.mascotLines.todayDone).toContain(result.current.line!.text);
  act(() => { jest.advanceTimersByTime(LINE_SHOW_MS); });
  expect(result.current.line).toBeNull();
});
test('rychlé ťukání v cooldownu text nemění, po cooldownu ano a jiný', () => {
  const { result } = renderHook(() => useMascotLine(stats));
  act(() => result.current.say());
  const first = result.current.line!.id;
  act(() => result.current.say());
  expect(result.current.line!.id).toBe(first);
  act(() => { jest.advanceTimersByTime(REACTION_COOLDOWN_MS); });
  act(() => result.current.say());
  expect(result.current.line!.id).not.toBe(first);
});
test('blokováno průvodcem: mlčí, a zobrazená replika zmizí', () => {
  const { result, rerender } = renderHook(({ b }: { b: boolean }) => useMascotLine(stats, b), { initialProps: { b: false } });
  act(() => result.current.say());
  expect(result.current.line).not.toBeNull();
  rerender({ b: true });
  expect(result.current.line).toBeNull();
  act(() => result.current.say());
  expect(result.current.line).toBeNull();
});
test('bez statistik mlčí', () => {
  const { result } = renderHook(() => useMascotLine(null));
  act(() => result.current.say());
  expect(result.current.line).toBeNull();
});
test('ráno bez série: ranní věta', () => {
  const { result } = renderHook(() => useMascotLine({ streak: 0, todayDone: false }));
  act(() => result.current.say());
  expect(copy.mascotLines.morning).toContain(result.current.line!.text);
});
