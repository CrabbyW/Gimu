import { BADGES } from '@/data/badges';
import { LESSONS } from '@/data/lessons';
import { EXERCISES } from '@/data/exercises';
import { badgeCondition, badgeProgress } from '@/logic/badges';
import { isLeagueLocked } from '@/logic/league';
import { estMinutes } from '@/logic/lessonDuration';
import { mascotMood, todayStatus } from '@/logic/mascotMood';
import type { ActivityEvent, Lesson } from '@/types';

const ev = (day: string, lessonId: string, xp = 30): ActivityEvent => ({ id: `${day}-${lessonId}`, at: `${day}T10:00:00.000Z`, day, lessonId, xp });

describe('estMinutes', () => {
  test('výdrž = sekundy + příprava, opakování × 3 s', () => {
    expect(estMinutes([{ type: 'hold', amount: 40 }])).toBe(1);
    expect(estMinutes([{ type: 'hold', amount: 30 }, { type: 'reps', amount: 10 }, { type: 'hold', amount: 20 }])).toBe(3);
  });
  test('prázdná lekce má aspoň 1 min', () => { expect(estMinutes([])).toBe(1); });
  test('každá lekce v datech má odhad 1–15 min a všechny cviky existují', () => {
    for (const l of LESSONS) {
      const ex = l.exerciseIds.map((id) => EXERCISES[id]);
      expect(ex.every(Boolean)).toBe(true);
      const m = estMinutes(ex.filter((e) => e !== undefined));
      expect(m).toBeGreaterThanOrEqual(1); expect(m).toBeLessThanOrEqual(15);
    }
  });
});

describe('mascotMood', () => {
  test('událost vyhrává', () => { expect(mascotMood(['2026-09-01'], '2026-10-03', 'lessonComplete')).toBe('celebrate'); });
  test('přerušená série ≥ 2 dny → sad', () => { expect(mascotMood(['2026-09-28', '2026-09-29'], '2026-10-03')).toBe('sad'); });
  test('přerušená série jen 1 den → idle (nevyčítat)', () => { expect(mascotMood(['2026-09-28'], '2026-10-03')).toBe('idle'); });
  test('nový uživatel a běžící série → idle', () => {
    expect(mascotMood([], '2026-10-03')).toBe('idle');
    expect(mascotMood(['2026-10-01', '2026-10-02'], '2026-10-03')).toBe('idle');
  });
  test('todayStatus', () => {
    expect(todayStatus(['2026-10-03'], '2026-10-03')).toBe('done');
    expect(todayStatus(['2026-10-02'], '2026-10-03')).toBe('pending');
  });
});

describe('isLeagueLocked', () => {
  test('bez lekce zamčeno, dev-xp neodemyká', () => {
    expect(isLeagueLocked([])).toBe(true);
    expect(isLeagueLocked([{ lessonId: 'dev-xp' }])).toBe(true);
    expect(isLeagueLocked([{ lessonId: 'bc-1-1' }])).toBe(false);
  });
});

describe('badges', () => {
  const byId = new Map<string, Lesson>(LESSONS.map((l) => [l.id, l]));
  test('katalog: unikátní id, cviky existují', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    for (const b of BADGES) if (b.rule.kind === 'exercise') expect(EXERCISES[b.rule.exerciseId]).toBeDefined();
  });
  test('nový uživatel: nic získáno, progres 0', () => {
    const p = badgeProgress(BADGES, [], byId);
    expect(p.every((b) => !b.earned && b.current === 0)).toBe(true);
  });
  test('první lekce + 3 dny v řadě; progres je oříznutý cílem', () => {
    const lesson = LESSONS[0]!;
    const p = badgeProgress(BADGES, [ev('2026-10-01', lesson.id), ev('2026-10-02', lesson.id), ev('2026-10-03', lesson.id)], byId);
    const get = (id: string) => p.find((b) => b.id === id)!;
    expect(get('badge-first-lesson')).toMatchObject({ earned: true, current: 1, target: 1 });
    expect(get('badge-streak-3').earned).toBe(true);
    expect(get('badge-streak-7')).toMatchObject({ earned: false, current: 3, target: 7 });
  });
  test('dev-xp se nepočítá jako lekce, ale XP ano', () => {
    const p = badgeProgress(BADGES, [ev('2026-10-01', 'dev-xp', 1000)], byId);
    expect(p.find((b) => b.id === 'badge-first-lesson')!.earned).toBe(false);
    expect(p.find((b) => b.id === 'badge-xp-1000')!.earned).toBe(true);
  });
  test('podmínky česky', () => {
    expect(badgeCondition({ kind: 'lessons', n: 1 })).toBe('Dokonči první lekci');
    expect(badgeCondition({ kind: 'streak', n: 7 })).toBe('Cvič 7 dní v řadě');
  });
});
