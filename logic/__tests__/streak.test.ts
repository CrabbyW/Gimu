import { activeDays, currentStreak, isStreakBroken, longestStreak } from '@/logic/streak';

const d = (...xs: string[]) => xs;
describe('streak', () => {
  test('activeDays deduplikuje a řadí', () => {
    expect(activeDays([{ day: '2026-09-29' }, { day: '2026-09-27' }, { day: '2026-09-29' }])).toEqual(['2026-09-27', '2026-09-29']);
  });
  test('streak končící dnes', () => { expect(currentStreak(d('2026-09-27', '2026-09-28', '2026-09-29'), '2026-09-29')).toBe(3); });
  test('streak končící včera ještě platí', () => { expect(currentStreak(d('2026-09-27', '2026-09-28'), '2026-09-29')).toBe(2); });
  test('mezera streak přeruší', () => { expect(currentStreak(d('2026-09-25', '2026-09-27', '2026-09-28'), '2026-09-29')).toBe(2); });
  test('předevčírem = 0', () => { expect(currentStreak(d('2026-09-27'), '2026-09-29')).toBe(0); });
  test('přes hranici měsíce', () => { expect(currentStreak(d('2026-09-30', '2026-10-01'), '2026-10-01')).toBe(2); });
  test('prázdná historie', () => { expect(currentStreak([], '2026-09-29')).toBe(0); expect(isStreakBroken([], '2026-09-29')).toBe(false); });
  test('longestStreak', () => { expect(longestStreak(d('2026-09-01', '2026-09-02', '2026-09-03', '2026-09-10', '2026-09-11'))).toBe(3); });
  test('isStreakBroken jen když historie existuje a poslední den < včera', () => {
    expect(isStreakBroken(d('2026-09-27'), '2026-09-29')).toBe(true);
    expect(isStreakBroken(d('2026-09-28'), '2026-09-29')).toBe(false);
  });
});
