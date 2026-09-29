import { XP_RULES } from '@/data/xp';
import { lessonXp, totalXp } from '@/logic/xp';

describe('xp', () => {
  test('běžná lekce, první dnes, streak 1', () => {
    expect(lessonXp({ isBoss: false, isReplay: false, isFirstToday: true, streakDays: 1 }, XP_RULES))
      .toEqual({ base: 20, baseKind: 'lesson', firstOfDay: 10, streak: 2, total: 32 });
  });
  test('boss', () => { expect(lessonXp({ isBoss: true, isReplay: false, isFirstToday: false, streakDays: 0 }, XP_RULES).total).toBe(40); });
  test('opakování dá 10 i u bosse', () => {
    expect(lessonXp({ isBoss: true, isReplay: true, isFirstToday: false, streakDays: 0 }, XP_RULES)).toMatchObject({ base: 10, baseKind: 'replay' });
  });
  test('streak bonus je zastropovaný', () => { expect(lessonXp({ isBoss: false, isReplay: false, isFirstToday: false, streakDays: 30 }, XP_RULES).streak).toBe(14); });
  test('totalXp', () => { expect(totalXp([{ xp: 32 }, { xp: 10 }])).toBe(42); });
});
