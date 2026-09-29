import { addDays, diffDays, formatCzDate, parseISODate, toISODate, weekEndsAt, weekStart } from '@/logic/dates';

describe('dates', () => {
  test('toISODate používá místní den, ne UTC', () => {
    expect(toISODate(new Date(2026, 8, 29, 23, 59))).toBe('2026-09-29');
    expect(toISODate(new Date(2026, 8, 30, 0, 1))).toBe('2026-09-30');
  });
  test('addDays přes hranici měsíce a roku', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  test('diffDays je odolné vůči změně letního času', () => {
    expect(diffDays('2026-10-26', '2026-10-24')).toBe(2); // přechod na zimní čas 25. 10.
    expect(diffDays('2026-09-28', '2026-09-29')).toBe(-1);
  });
  test('weekStart je pondělí', () => {
    expect(weekStart(new Date(2026, 8, 29))).toBe('2026-09-28'); // úterý
    expect(weekStart(new Date(2026, 9, 4, 23))).toBe('2026-09-28'); // neděle
    expect(weekStart(new Date(2026, 9, 5))).toBe('2026-10-05'); // pondělí
  });
  test('weekEndsAt je příští pondělí 00:00', () => {
    expect(weekEndsAt(new Date(2026, 8, 29, 12)).getTime()).toBe(new Date(2026, 9, 5).getTime());
  });
  test('parseISODate vrací místní půlnoc', () => {
    expect(parseISODate('2026-09-29').getTime()).toBe(new Date(2026, 8, 29).getTime());
  });
  test('formatCzDate', () => { expect(formatCzDate('2026-09-29')).toBe('29. 9. 2026'); });
});
