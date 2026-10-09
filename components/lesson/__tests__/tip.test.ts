import { EXERCISES } from '@/data/exercises';
import { splitTip } from '@/components/lesson/tip';

test('tip = první věta popisu, zbytek zůstává v kartě', () => {
  expect(splitTip('Elbows under shoulders, hips in line. Squeeze glutes and abs, keep breathing.'))
    .toEqual({ tip: 'Elbows under shoulders, hips in line.', rest: 'Squeeze glutes and abs, keep breathing.' });
  expect(splitTip('Lower back pressed to the floor, arms and legs long and low.'))
    .toEqual({ tip: 'Lower back pressed to the floor, arms and legs long and low.', rest: '' });
});

test('každý cvik má neprázdný tip, krátký pro patičku nad [DONE]', () => {
  for (const e of Object.values(EXERCISES)) {
    const { tip } = splitTip(e.description);
    expect(tip.length).toBeGreaterThan(0);
    expect(tip.length).toBeLessThanOrEqual(90);
  }
});
