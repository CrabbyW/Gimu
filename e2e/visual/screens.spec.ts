import { expect, test } from '../fixtures';
import type { Page } from '@playwright/test';
import { loadDemo, shiftClock, pill, useReducedMotion, visible, waitForIdle } from '../helpers';

/** Vizuální regrese 9 obrazovek (spec elite fáze 0 §3.1).
 *  Stabilita: pevný čas (odpočty, data v demu), Reduce Motion (konečné stavy animací),
 *  `document.fonts.ready` + CanvasKit (waitForIdle), `animations: 'disabled'` (config), maska živé tečky. */
// Pondělí 10:00 Praha, čas pak běží dál (odpočty po hodinách se během testu nezmění).
const FIXED_NOW = new Date('2026-10-05T10:00:00+02:00');

const shoot = async (page: Page, name: string) => {
  await waitForIdle(page, 900);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: false,
    mask: [page.getByTestId('status-live-dot')],
  });
};

test.beforeEach(async ({ page }) => {
  await shiftClock(page, FIXED_NOW);
  await useReducedMotion(page);
});

test('onboarding/path', async ({ page }) => {
  await page.goto('/onboarding/path');
  await expect(visible(page.getByText('Pick your path'))).toBeVisible();
  await shoot(page, 'onboarding-path');
});

test.describe('s demo profilem', () => {
  test.beforeEach(async ({ page }) => {
    await loadDemo(page);
  });

  test('mapa', async ({ page }) => {
    await shoot(page, 'map');
  });

  test('lekce (1. cvik)', async ({ page }) => {
    await pill(page, 'Start lesson').click();
    await page.waitForURL(/\/lesson\//);
    await expect(pill(page, 'Start')).toBeVisible();
    await shoot(page, 'lesson');
  });

  test('oslava (konečný stav)', async ({ page }) => {
    await pill(page, 'Start lesson').click();
    await page.waitForURL(/\/lesson\//);
    const cont = pill(page, 'Continue');
    for (let i = 0; i < 40 && !(await cont.isVisible()); i++) {
      const start = pill(page, 'Start');
      if (await start.isVisible()) await start.click();
      const skip = pill(page, 'Skip');
      if (await skip.isVisible()) await skip.click();
      await page.waitForTimeout(300);
    }
    await expect(cont).toBeVisible();
    await shoot(page, 'celebration');
  });

  for (const [name, path] of [
    ['league', '/league'],
    ['progress', '/progress'],
    ['season', '/season'],
    ['profile', '/profile'],
    ['settings', '/settings'],
  ] as const) {
    test(name, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL((u) => u.pathname === path);
      await shoot(page, name);
    });
  }
});
