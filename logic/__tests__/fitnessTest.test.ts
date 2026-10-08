import { EXERCISES } from '@/data/exercises';
import { FITNESS, NEUTRAL_SCALE, readiness, READINESS_QUESTIONS, sanitizeTest, scaledAmount, scaleFromTest } from '@/logic/fitnessTest';

const t = (pushups: number, plankS: number, kneePushups = false) => ({ pushups, plankS, kneePushups, testedAt: '2026-10-08T08:00:00.000Z' });

describe('scaleFromTest', () => {
  test('bez testu = neutrální (výchozí dávky beze změny)', () => {
    expect(scaleFromTest(undefined)).toEqual(NEUTRAL_SCALE);
    expect(scaleFromTest(null)).toEqual(NEUTRAL_SCALE);
  });
  test('referenční výkon (2 × výchozí dávka) = násobek 1', () => {
    expect(scaleFromTest(t(FITNESS.refReps * 2, FITNESS.refHoldS * 2))).toEqual({ reps: 1, hold: 1 });
  });
  test('dávka ≈ polovina maxima: 24 kliků → 12 na lekci místo 8 (1.5×)', () => {
    expect(scaleFromTest(t(24, 60)).reps).toBe(1.5);
  });
  test('slabý výsledek má spodní mez 0.5×, silný horní 1.5×', () => {
    expect(scaleFromTest(t(1, 5))).toEqual({ reps: FITNESS.minScale, hold: FITNESS.minScale });
    expect(scaleFromTest(t(100, 600))).toEqual({ reps: FITNESS.maxScale, hold: FITNESS.maxScale });
  });
  test('0 = nezadáno: daná složka zůstane výchozí (uložení bez vstupu nezpoloví dávky)', () => {
    expect(scaleFromTest(t(0, 0))).toEqual(NEUTRAL_SCALE);
    expect(scaleFromTest(t(0, 120))).toEqual({ reps: 1, hold: FITNESS.maxScale });
  });
  test('kliky na kolenou se počítají za polovinu', () => {
    expect(scaleFromTest(t(20, 60, true)).reps).toBeLessThan(scaleFromTest(t(20, 60)).reps);
    expect(scaleFromTest(t(20, 60, true)).reps).toBe(scaleFromTest(t(10, 60)).reps);
  });
  test('monotónní: víc kliků nikdy nesníží dávku', () => {
    let prev = 0;
    for (let n = 1; n <= 60; n++) { const r = scaleFromTest(t(n, 30)).reps; expect(r).toBeGreaterThanOrEqual(prev); prev = r; }
  });
});

describe('sanitizeTest', () => {
  test('NaN, záporné, desetinné a přehnané vstupy', () => {
    expect(sanitizeTest({ pushups: NaN, plankS: -5 })).toEqual({ pushups: 0, plankS: 0, kneePushups: false });
    expect(sanitizeTest({ pushups: 12.9, plankS: 99999 })).toEqual({ pushups: 12, plankS: FITNESS.maxPlankS, kneePushups: false });
  });
});

describe('scaledAmount', () => {
  test('výdrž po 5 s, opakování celé, spodní meze', () => {
    expect(scaledAmount({ type: 'hold', amount: 30 }, { reps: 1, hold: 0.5 })).toBe(15);
    expect(scaledAmount({ type: 'hold', amount: 10 }, { reps: 1, hold: 0.5 })).toBe(FITNESS.minAmount.hold);
    expect(scaledAmount({ type: 'reps', amount: 8 }, { reps: 1.5, hold: 1 })).toBe(12);
    expect(scaledAmount({ type: 'reps', amount: 4 }, { reps: 0.5, hold: 1 })).toBe(FITNESS.minAmount.reps);
  });
  test('neutrální násobek nemění žádný cvik z knihovny', () => {
    for (const e of Object.values(EXERCISES)) expect(scaledAmount(e, NEUTRAL_SCALE)).toBe(e.amount);
  });
  test('referenční cviky knihovny odpovídají konstantám FITNESS', () => {
    expect(EXERCISES.pushup?.amount).toBe(FITNESS.refReps);
    expect(EXERCISES.plank?.amount).toBe(FITNESS.refHoldS);
  });
});

describe('readiness (PAR-Q+)', () => {
  test('všechna ne = clear, jakékoli ano = consult', () => {
    expect(readiness(Array(READINESS_QUESTIONS).fill(false))).toBe('clear');
    expect(readiness([false, false, true, false, false, false, false])).toBe('consult');
  });
});

test('náročné cviky mají bezpečnostní poznámku', () => {
  for (const id of ['wall-handstand', 'pike-hold', 'crow-hold', 'tuck-lsit']) expect(EXERCISES[id]?.caution).toBe(true);
  expect(EXERCISES.plank?.caution).toBeUndefined();
});
