import type { Cosmetic } from '@/types';

/** Katalog kosmetiky fáze 1 (spec §7.8, §8). `variantIndex` = Rive number input slotu (0 = nic). */
export const COSMETICS: Cosmetic[] = [
  { id: 'outfit-winter-arc-scarf', slot: 'outfit', name: 'Winter Arc scarf', source: 'season', seasonId: 'winter-arc-2026', variantIndex: 1 },
  { id: 'outfit-tank-ember', slot: 'outfit', name: 'Ember tank', source: 'shop', priceBananas: 60, variantIndex: 2 },
  { id: 'outfit-hoodie-chalk', slot: 'outfit', name: 'Chalk hoodie', source: 'milestone', milestoneRule: { kind: 'milestoneCompleted', count: 1 }, variantIndex: 3 },
  { id: 'acc-headband', slot: 'accessory', name: 'Headband', source: 'shop', priceBananas: 40, variantIndex: 1 },
  { id: 'acc-wristbands', slot: 'accessory', name: 'Wristbands', source: 'milestone', milestoneRule: { kind: 'streak', days: 7 }, variantIndex: 2 },
  { id: 'acc-belt', slot: 'accessory', name: 'Lifting belt', source: 'shop', priceBananas: 90, variantIndex: 3 },
  { id: 'map-chalk-dust', slot: 'mapBackground', name: 'Chalk dust', source: 'shop', priceBananas: 50, variantIndex: 1 },
  { id: 'map-night-gym', slot: 'mapBackground', name: 'Night gym', source: 'milestone', milestoneRule: { kind: 'streak', days: 14 }, variantIndex: 2 },
  { id: 'fx-sparks', slot: 'lessonEffect', name: 'Sparks', source: 'shop', priceBananas: 70, variantIndex: 1 },
  { id: 'fx-chalk-burst', slot: 'lessonEffect', name: 'Chalk cloud', source: 'milestone', milestoneRule: { kind: 'milestoneCompleted', count: 2 }, variantIndex: 2 },
  { id: 'frame-plate-ring', slot: 'profileFrame', name: 'Plate frame', source: 'milestone', milestoneRule: { kind: 'milestoneCompleted', count: 2 }, variantIndex: 1 },
  { id: 'frame-ember-ring', slot: 'profileFrame', name: 'Ember frame', source: 'shop', priceBananas: 80, variantIndex: 2 },
];
