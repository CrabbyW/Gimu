import type { Cosmetic } from '@/types';

/** Katalog kosmetiky fáze 1 (spec §7.8, §8). `variantIndex` = Rive number input slotu (0 = nic). */
export const COSMETICS: Cosmetic[] = [
  { id: 'outfit-winter-arc-scarf', slot: 'outfit', name: 'Šála Winter Arc', source: 'season', seasonId: 'winter-arc-2026', variantIndex: 1 },
  { id: 'outfit-tank-ember', slot: 'outfit', name: 'Tílko Ember', source: 'shop', priceBananas: 60, variantIndex: 2 },
  { id: 'outfit-hoodie-chalk', slot: 'outfit', name: 'Mikina Křída', source: 'milestone', milestoneRule: { kind: 'milestoneCompleted', count: 1 }, variantIndex: 3 },
  { id: 'acc-headband', slot: 'accessory', name: 'Čelenka', source: 'shop', priceBananas: 40, variantIndex: 1 },
  { id: 'acc-wristbands', slot: 'accessory', name: 'Potítka', source: 'milestone', milestoneRule: { kind: 'streak', days: 7 }, variantIndex: 2 },
  { id: 'acc-belt', slot: 'accessory', name: 'Vzpěračský pás', source: 'shop', priceBananas: 90, variantIndex: 3 },
  { id: 'map-chalk-dust', slot: 'mapBackground', name: 'Křídový prach', source: 'shop', priceBananas: 50, variantIndex: 1 },
  { id: 'map-night-gym', slot: 'mapBackground', name: 'Noční posilovna', source: 'milestone', milestoneRule: { kind: 'streak', days: 14 }, variantIndex: 2 },
  { id: 'fx-sparks', slot: 'lessonEffect', name: 'Jiskry', source: 'shop', priceBananas: 70, variantIndex: 1 },
  { id: 'fx-chalk-burst', slot: 'lessonEffect', name: 'Oblak křídy', source: 'milestone', milestoneRule: { kind: 'milestoneCompleted', count: 2 }, variantIndex: 2 },
  { id: 'frame-plate-ring', slot: 'profileFrame', name: 'Kotoučový rám', source: 'milestone', milestoneRule: { kind: 'milestoneCompleted', count: 2 }, variantIndex: 1 },
  { id: 'frame-ember-ring', slot: 'profileFrame', name: 'Ember rám', source: 'shop', priceBananas: 80, variantIndex: 2 },
];
