import { COSMETICS } from '@/data/cosmetics';
import { bananaBalance, canBuy, canEquip, isUnlocked, newlyUnlocked, sanitizeEquipped } from '@/logic/cosmetics';

const byId = (id: string) => COSMETICS.find((c) => c.id === id)!;
const ms = (done: number) => Array.from({ length: 3 }, (_, i) => ({ id: `m${i}`, label: '', target: 10, unit: 'reps' as const, current: i < done ? 10 : 0, custom: false }));
const ctx = (over = {}) => ({ owned: [] as string[], milestones: ms(0), longestStreak: 0, ...over });

test('shop/season jen když je v owned', () => {
  expect(isUnlocked(byId('acc-headband'), ctx())).toBe(false);
  expect(isUnlocked(byId('acc-headband'), ctx({ owned: ['acc-headband'] }))).toBe(true);
  expect(isUnlocked(byId('outfit-winter-arc-scarf'), ctx())).toBe(false);
});
test('milestone pravidla: počet splněných milníků a nejdelší streak', () => {
  expect(isUnlocked(byId('outfit-hoodie-chalk'), ctx({ milestones: ms(1) }))).toBe(true);
  expect(isUnlocked(byId('fx-chalk-burst'), ctx({ milestones: ms(1) }))).toBe(false);
  expect(isUnlocked(byId('acc-wristbands'), ctx({ longestStreak: 6 }))).toBe(false);
  expect(isUnlocked(byId('acc-wristbands'), ctx({ longestStreak: 7 }))).toBe(true);
});
test('banány = floor(XP / 10) − utraceno za shop položky', () => {
  expect(bananaBalance(1234, [], COSMETICS, 10)).toBe(123);
  expect(bananaBalance(1234, ['acc-headband', 'outfit-winter-arc-scarf'], COSMETICS, 10)).toBe(83);
});
test('canBuy', () => {
  expect(canBuy(byId('acc-headband'), ctx(), 40)).toBe('ok');
  expect(canBuy(byId('acc-headband'), ctx(), 39)).toBe('insufficient');
  expect(canBuy(byId('acc-headband'), ctx({ owned: ['acc-headband'] }), 999)).toBe('owned');
  expect(canBuy(byId('outfit-winter-arc-scarf'), ctx(), 999)).toBe('notShop');
  expect(canBuy(byId('acc-wristbands'), ctx(), 999)).toBe('notShop');
});
test('canEquip: jen odemčené a existující', () => {
  expect(canEquip(undefined, ctx())).toBe(false);
  expect(canEquip(byId('acc-belt'), ctx())).toBe(false);
  expect(canEquip(byId('acc-belt'), ctx({ owned: ['acc-belt'] }))).toBe(true);
});
test('sanitizeEquipped: zahodí neznámé, nevlastněné a položky ve špatném slotu', () => {
  expect(sanitizeEquipped({ outfit: 'nic', accessory: 'acc-belt', profileFrame: 'acc-headband' }, COSMETICS, ctx({ owned: ['acc-belt', 'acc-headband'] })))
    .toEqual({ accessory: 'acc-belt' });
});
test('newlyUnlocked: splněním druhého milníku se odemkne efekt i rám', () => {
  expect(newlyUnlocked(COSMETICS, ctx({ milestones: ms(1) }), ctx({ milestones: ms(2) })).sort()).toEqual(['frame-plate-ring', 'fx-chalk-burst']);
});
