import type { Rival } from '@/logic/league';

/** 15 simulovaných soupeřů (skupina 16 = 15 + uživatel). weeklyBase sestupně; kalibrace viz logic/__tests__/league.test.ts. */
export const LEAGUE_RIVALS: Rival[] = [
  { userId: 'r01', name: 'Kuba_Shyb', weeklyBase: 520, stage: 3, cosmetics: { outfit: 'outfit-tank-ember', accessory: 'acc-belt' } },
  { userId: 'r02', name: 'Terka.hold', weeklyBase: 450, stage: 3, cosmetics: { outfit: 'outfit-hoodie-chalk' } },
  { userId: 'r03', name: 'Dan Dřep', weeklyBase: 390, stage: 3, cosmetics: { accessory: 'acc-headband' } },
  { userId: 'r04', name: 'Míša_plank', weeklyBase: 340, stage: 2, cosmetics: { accessory: 'acc-wristbands' } },
  { userId: 'r05', name: 'Honza L-sit', weeklyBase: 260, stage: 2, cosmetics: {} },
  { userId: 'r06', name: 'Bára Most', weeklyBase: 230, stage: 2, cosmetics: { outfit: 'outfit-tank-ember' } },
  { userId: 'r07', name: 'Vojta_dips', weeklyBase: 200, stage: 2, cosmetics: { accessory: 'acc-belt' } },
  { userId: 'r08', name: 'Anča Klik', weeklyBase: 175, stage: 2, cosmetics: {} },
  { userId: 'r09', name: 'Petr Pistol', weeklyBase: 150, stage: 2, cosmetics: { outfit: 'outfit-hoodie-chalk', accessory: 'acc-headband' } },
  { userId: 'r10', name: 'Lucka_hang', weeklyBase: 125, stage: 1, cosmetics: { accessory: 'acc-wristbands' } },
  { userId: 'r11', name: 'Ondra Crow', weeklyBase: 100, stage: 1, cosmetics: {} },
  { userId: 'r12', name: 'Zuzka Výdrž', weeklyBase: 80, stage: 1, cosmetics: { accessory: 'acc-headband' } },
  { userId: 'r13', name: 'Filip_Band', weeklyBase: 60, stage: 1, cosmetics: {} },
  { userId: 'r14', name: 'Klára Core', weeklyBase: 40, stage: 1, cosmetics: {} },
  { userId: 'r15', name: 'Tom Bez Kliků', weeklyBase: 20, stage: 1, cosmetics: {} },
];
