import { riveInputs } from '@/components/mascot/riveInputs';
const variants: Record<string, number> = { 'outfit-tank-ember': 2, 'acc-headband': 1 };
const variantOf = (id: string) => variants[id] ?? 0;
test('stage → number input, cosmetics → variantIndex po slotech, chybějící slot = 0', () => {
  expect(riveInputs({ stage: 3, mood: 'idle', cosmetics: { outfit: 'outfit-tank-ember', accessory: 'acc-headband' } }, variantOf)).toEqual({
    numbers: { stage: 3, outfit: 2, accessory: 1, mapBackground: 0, lessonEffect: 0, profileFrame: 0 }, trigger: null,
  });
});
test.each([['happy', 'happy'], ['celebrate', 'celebrate'], ['sad', 'sad'], ['idle', null]] as const)('mood %s → trigger %s', (mood, t) => {
  expect(riveInputs({ stage: 1, mood, cosmetics: {} }, variantOf).trigger).toBe(t);
});
