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

/** Elite fáze 1: obrazovky prvního průchodu (bublina průvodce, Finish setup, /setup, první oslava). */
test.describe('first run', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/onboarding\/path/);
    await waitForIdle(page, 200);
    await visible(page.getByRole('radio')).click();
    await visible(page.getByRole('button', { name: /^Continue$/ })).click();
    await page.waitForURL(/\/onboarding\/birth/);
    await visible(page.getByRole('button', { name: /Let.s train/ })).click();
    await page.waitForURL((u) => u.pathname === '/');
    await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  });

  test('first-run mapa', async ({ page }) => {
    await expect(visible(page.getByRole('button', { name: 'Tap the plate to start' }))).toBeVisible();
    await shoot(page, 'first-run-map');
  });

  test('first-run setup', async ({ page }) => {
    await visible(page.getByRole('button', { name: /^Finish setup/ })).click();
    await page.waitForURL(/\/setup/);
    await expect(visible(page.getByRole('button', { name: /^Done$/ }))).toBeVisible();
    await shoot(page, 'first-run-setup');
  });

  test('first-run oslava', async ({ page }) => {
    test.setTimeout(180_000);
    await pill(page, 'Start lesson').click();
    await page.waitForURL(/\/lesson\//);
    const cont = pill(page, 'Continue');
    // Mimo demo skrývá Skip pravidlo canSkip: [DONE] u opakování, výdrž doběhne.
    for (let i = 0; i < 150 && !(await cont.isVisible()); i++) {
      const start = pill(page, 'Start');
      if (await start.isVisible()) await start.click({ timeout: 2_000 }).catch(() => undefined);
      const skip = pill(page, 'Skip');
      const done = pill(page, 'Done');
      if (await skip.isVisible()) await skip.click({ timeout: 2_000 }).catch(() => undefined);
      else if (await done.isVisible()) await done.click({ timeout: 2_000 }).catch(() => undefined);
      await page.waitForTimeout(400);
    }
    await expect(cont).toBeVisible();
    await expect(visible(page.getByText('That’s your first plate'))).toBeVisible();
    await shoot(page, 'first-run-celebration');
  });
});
