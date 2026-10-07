import type { Page } from '@playwright/test';
import { loadDemo, pill, shiftClock, waitForIdle } from '../helpers';

/** Hlavní obrazovky pro a11y kontroly (elite fáze 4 spec §3). Demo profil, pevný čas, Reduce Motion. */
export const FIXED_NOW = new Date('2026-10-05T10:00:00+02:00');

export const SCREENS: { name: string; open(page: Page): Promise<void> }[] = [
  { name: 'onboarding-path', open: async (p) => { await p.goto('/onboarding/path'); } },
  { name: 'map', open: async () => undefined },
  { name: 'league', open: async (p) => { await p.goto('/league'); } },
  { name: 'progress', open: async (p) => { await p.goto('/progress'); } },
  { name: 'season', open: async (p) => { await p.goto('/season'); } },
  { name: 'profile', open: async (p) => { await p.goto('/profile'); } },
  { name: 'settings', open: async (p) => { await p.goto('/settings'); } },
  { name: 'wardrobe', open: async (p) => { await p.goto('/wardrobe'); } },
  { name: 'setup', open: async (p) => { await p.goto('/setup'); } },
  {
    name: 'lesson',
    open: async (p) => { await pill(p, 'Start lesson').click(); await p.waitForURL(/\/lesson\//); },
  },
];

export async function prepare(page: Page, name: string) {
  await shiftClock(page, FIXED_NOW);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  if (name !== 'onboarding-path') await loadDemo(page);
}

export async function openScreen(page: Page, s: (typeof SCREENS)[number]) {
  await prepare(page, s.name);
  await s.open(page);
  await waitForIdle(page, 900);
}
