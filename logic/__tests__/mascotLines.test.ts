import { copy } from '@/data/copy';
import { LINE_MAX_CHARS, lineContext, pickLine, STREAK_HOT_DAYS, timeOfDay, type LineBank, type LineContext } from '@/logic/mascotLines';
import { mulberry32 } from '@/logic/random';

const bank: LineBank = copy.mascotLines;
const CONTEXTS: LineContext[] = ['todayDone', 'streakHot', 'streakOn', 'morning', 'day', 'evening', 'night'];

test('hranice denní doby', () => {
  expect([4, 5, 10, 11, 16, 17, 21, 22, 23, 0].map(timeOfDay)).toEqual(
    ['night', 'morning', 'morning', 'day', 'day', 'evening', 'evening', 'night', 'night', 'night']);
});
test('priorita kontextů', () => {
  expect(lineContext({ hour: 9, streak: 30, todayDone: true })).toBe('todayDone');
  expect(lineContext({ hour: 9, streak: STREAK_HOT_DAYS, todayDone: false })).toBe('streakHot');
  expect(lineContext({ hour: 9, streak: STREAK_HOT_DAYS - 1, todayDone: false })).toBe('streakOn');
  expect(lineContext({ hour: 9, streak: 1, todayDone: false })).toBe('streakOn');
  expect(lineContext({ hour: 23, streak: 0, todayDone: false })).toBe('night');
});
test(`každý kontext má ≥ 3 věty do ${LINE_MAX_CHARS} znaků`, () => {
  for (const c of CONTEXTS) {
    expect(bank[c].length).toBeGreaterThanOrEqual(3);
    for (const t of bank[c]) expect(t.length).toBeLessThanOrEqual(LINE_MAX_CHARS);
  }
});
test('nikdy stejná věta dvakrát za sebou', () => {
  const rng = mulberry32(7);
  let last: string | null = null;
  for (let i = 0; i < 200; i++) {
    const l: { id: string } = pickLine(bank, 'todayDone', rng, last)!;
    expect(l.id).not.toBe(last); last = l.id;
  }
});
test('deterministické se stejným seedem; prázdný kontext = null; jediná věta se smí opakovat', () => {
  expect(pickLine(bank, 'morning', mulberry32(3))).toEqual(pickLine(bank, 'morning', mulberry32(3)));
  expect(pickLine({ ...bank, night: [] }, 'night', mulberry32(1))).toBeNull();
  expect(pickLine({ ...bank, night: ['x'] }, 'night', mulberry32(1), 'night:0')).toEqual({ id: 'night:0', text: 'x' });
});
test('rng těsně pod 1 nepřeteče', () => {
  expect(pickLine(bank, 'day', () => 0.99999, null)).not.toBeNull();
});
