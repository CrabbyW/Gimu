import { MASCOT_LAYERS } from '@/components/mascot/cosmetics';
import { COSMETICS } from '@/data/cosmetics';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
// Vrstvy čtou useTheme → ThemeProvider → settings store → AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
test('každá outfit/accessory položka má vrstvu, ostatní sloty žádnou', () => {
  for (const c of COSMETICS) {
    const layered = c.slot === 'outfit' || c.slot === 'accessory';
    expect(Boolean(MASCOT_LAYERS[c.id])).toBe(layered);
  }
});
test('id jsou unikátní, variantIndex unikátní v rámci slotu, shop má cenu, milestone má pravidlo, season má seasonId', () => {
  expect(new Set(COSMETICS.map((c) => c.id)).size).toBe(COSMETICS.length);
  for (const slot of new Set(COSMETICS.map((c) => c.slot))) {
    const v = COSMETICS.filter((c) => c.slot === slot).map((c) => c.variantIndex);
    expect(new Set(v).size).toBe(v.length);
  }
  for (const c of COSMETICS) {
    if (c.source === 'shop') expect(c.priceBananas).toBeGreaterThan(0);
    if (c.source === 'milestone') expect(c.milestoneRule).toBeDefined();
    if (c.source === 'season') expect(c.seasonId).toBe('winter-arc-2026');
  }
});
