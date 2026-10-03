import { ADAPT, addSkipped, canSkip, doneRatio, EMPTY_DEBT, lessonCounts, lessonExtras, settleDebt } from '@/logic/adaptive';

const hold = (amount: number) => ({ type: 'hold' as const, amount });
const reps = (amount: number) => ({ type: 'reps' as const, amount });

describe('adaptivní dluh tréninku', () => {
  test('skip 50 s výdrže → dalších 5 lekcí po +10 s, pak dluh doběhne na 0', () => {
    let debt = addSkipped(EMPTY_DEBT, [hold(50)]);
    const lesson = [hold(40), reps(10)];
    const seen: number[] = [];
    for (let i = 0; i < 10 && debt.holdS > 0; i++) {
      const extras = lessonExtras(lesson, debt);
      seen.push(extras[0]!);
      debt = settleDebt(debt, lesson, extras, [true, true]);
    }
    expect(seen).toEqual([10, 10, 10, 10, 10]);
    expect(debt).toEqual(EMPTY_DEBT);
  });
  test('strop navýšení cviku: max 25 % základu a max 15 s / 4 opakování', () => {
    const debt = { holdS: 150, reps: 40, share: { holdS: 30, reps: 8 } };
    expect(lessonExtras([hold(20), hold(100), reps(8), reps(30)], debt)).toEqual([5, 15, 2, 4]);
  });
  test('podíl lekce se rozdělí mezi cviky stejného typu a nepřeteče', () => {
    const extras = lessonExtras([hold(40), hold(40)], addSkipped(EMPTY_DEBT, [hold(100)]));
    expect(extras.reduce((a, b) => a + b, 0)).toBe(20);
  });
  test('strop dluhu: týden skipů neudělá z lekce maraton', () => {
    const debt = addSkipped(EMPTY_DEBT, Array.from({ length: 20 }, () => hold(60)));
    expect(debt.holdS).toBe(ADAPT.maxDebt.holdS);
  });
  test('přeskočený cvik s navýšením: navýšení se neodečte, přičte se základ', () => {
    const debt = addSkipped(EMPTY_DEBT, [hold(20)]);
    const lesson = [hold(40)];
    const extras = lessonExtras(lesson, debt);
    expect(settleDebt(debt, lesson, extras, [false]).holdS).toBe(60);
  });
  test('malý dluh se dočerpá minimálním podílem (žádné viset v drobných)', () => {
    expect(lessonExtras([hold(40)], { holdS: 3, reps: 0, share: { holdS: 5, reps: 0 } })).toEqual([3]);
    expect(lessonExtras([hold(40)], addSkipped(EMPTY_DEBT, [hold(12)]))).toEqual([5]);
  });
  test('lekce platí od poloviny odcvičených cviků', () => {
    expect(lessonCounts([true, true, false, false])).toBe(true);
    expect(lessonCounts([true, false, false])).toBe(false);
    expect(lessonCounts([true, true, false])).toBe(true);
    expect(lessonCounts([])).toBe(false);
    expect(doneRatio([true, false, true, true])).toBe(0.75);
  });
});

test('canSkip: přeskočení jen dokud jde lekci ještě započítat', () => {
  expect(canSkip([], 0, 4)).toBe(true);
  expect(canSkip([false, false], 2, 4)).toBe(false);
  expect(canSkip([true, false], 2, 4)).toBe(true);
  expect(canSkip([false], 1, 3)).toBe(false);
  expect(canSkip([], 0, 1)).toBe(false);
});

test('QA R44-2: smíšený dluh hold+reps doběhne nezávisle; lekce bez typu dluh nemění', () => {
  let debt = addSkipped(EMPTY_DEBT, [hold(30), reps(10)]);
  const onlyReps = [reps(12)];
  const e = lessonExtras(onlyReps, debt);
  debt = settleDebt(debt, onlyReps, e, [true]);
  expect(debt.holdS).toBe(30);
  const mixed = [hold(40), reps(12)];
  for (let i = 0; i < 20 && (debt.holdS > 0 || debt.reps > 0); i++) debt = settleDebt(debt, mixed, lessonExtras(mixed, debt), [true, true]);
  expect(debt).toEqual(EMPTY_DEBT);
  expect(canSkip([], 0, 2)).toBe(true);
  expect(canSkip([false], 1, 2)).toBe(false);
});
