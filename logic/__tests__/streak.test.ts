import { activeDays, currentStreak, isStreakBroken, longestStreak } from '@/logic/streak';
import { toISODate } from '@/logic/dates';

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

describe('rollover a zameškaný den (QA fokus)', () => {
  test('rollover: lekce 23:59 a 00:01 jsou dva po sobě jdoucí dny → streak 2', () => {
    const a = toISODate(new Date(2026, 9, 1, 23, 59)); const b = toISODate(new Date(2026, 9, 2, 0, 1));
    expect(currentStreak(activeDays([{ day: a }, { day: b }]), b)).toBe(2);
  });
  test('rollover přes konec měsíce', () => { expect(currentStreak(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2); });
  test('zameškaný den: aktivita předevčírem → streak 0 a broken', () => {
    const days = ['2026-09-28', '2026-09-29'];
    expect(currentStreak(days, '2026-10-01')).toBe(0); expect(isStreakBroken(days, '2026-10-01')).toBe(true);
  });
  test('včera aktivní, dnes ještě ne → streak drží, není broken', () => {
    expect(currentStreak(['2026-09-29', '2026-09-30'], '2026-10-01')).toBe(2); expect(isStreakBroken(['2026-09-30'], '2026-10-01')).toBe(false);
  });
  test('mezera uprostřed: počítá se jen poslední souvislý úsek', () => { expect(currentStreak(['2026-09-26', '2026-09-28', '2026-09-29'], '2026-09-29')).toBe(2); });
  test('dev-xp den se nepočítá do aktivních dní', () => {
    expect(activeDays([{ day: '2026-09-29', lessonId: 'dev-xp' }, { day: '2026-09-30', lessonId: 'bc-1-1' }])).toEqual(['2026-09-30']);
  });
});
