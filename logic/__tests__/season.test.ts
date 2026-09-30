import { repairableDays, repairTarget, seasonDays } from '@/logic/season';
import type { ActivityEvent } from '@/types';

const S = { startDate: '2026-09-28', endDate: '2026-12-26' };
const ev = (day: string, lessonId = 'bc-1-1', repairsDate?: string): ActivityEvent => ({ id: `${day}-${Math.random()}`, at: `${day}T10:00:00.000Z`, day, lessonId, xp: 20, ...(repairsDate ? { repairsDate } : {}) });

test('Winter Arc má 90 dní', () => { expect(seasonDays(S)).toHaveLength(90); });

test('okno je max 3 dny zpětně, nejstarší první', () => {
  // aktivní jen 28. 9.; dnes 5. 10. → zameškané 29.9.–4.10., opravitelné jen 2.–4. 10.
  expect(repairableDays([ev('2026-09-28')], S, '2026-10-05', 3, '2026-09-28')).toEqual(['2026-10-02', '2026-10-03', '2026-10-04']);
});
test('den 4 dny zpátky už opravit nejde', () => {
  expect(repairableDays([ev('2026-10-02'), ev('2026-10-03'), ev('2026-10-04')], S, '2026-10-05', 3, '2026-09-28')).toEqual([]);
});
test('opravený den už v okně není', () => {
  expect(repairableDays([ev('2026-10-05', 'bc-1-2', '2026-10-02')], S, '2026-10-05', 3, '2026-09-28')).toEqual(['2026-10-03', '2026-10-04']);
});
test('dny před začátkem sezóny a před založením profilu se neopravují', () => {
  expect(repairableDays([], S, '2026-09-29', 3, '2026-09-20')).toEqual(['2026-09-28']);
  expect(repairableDays([], S, '2026-10-05', 3, '2026-10-04')).toEqual(['2026-10-04']);
});
test('dev-xp den je pořád zameškaný', () => {
  expect(repairableDays([ev('2026-10-04', 'dev-xp')], S, '2026-10-05', 3, '2026-09-28')).toContain('2026-10-04');
});
test('mimo sezónu (null) se neopravuje nic', () => { expect(repairTarget([ev('2026-10-05')], null, '2026-10-05', 3, '2026-09-28')).toBeNull(); });
test('první lekce dne neopravuje, druhá opraví nejstarší', () => {
  expect(repairTarget([], S, '2026-10-05', 3, '2026-09-28')).toBeNull();
  expect(repairTarget([ev('2026-10-05')], S, '2026-10-05', 3, '2026-09-28')).toBe('2026-10-02');
});
test('dev-xp dnes se jako „první lekce“ nepočítá', () => {
  expect(repairTarget([ev('2026-10-05', 'dev-xp')], S, '2026-10-05', 3, '2026-09-28')).toBeNull();
});
test('dnešek mimo rozsah sezóny neopravuje', () => {
  expect(repairTarget([ev('2026-12-27')], S, '2026-12-27', 3, '2026-09-28')).toBeNull();
});
