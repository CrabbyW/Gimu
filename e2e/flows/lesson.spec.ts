import { expect, test } from '../fixtures';
import type { Page } from '@playwright/test';
import { collectErrors, loadDemo, pill } from '../helpers';

/** Série z a11y popisu stavového řádku mapy („Streak 12 days…“). */
async function readStreak(page: Page): Promise<number> {
  const label = await page.locator('[aria-label^="Streak"]').filter({ visible: true }).first().getAttribute('aria-label');
  const m = label?.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

test('lekce: start → skip × N → oslava → continue → mapa, série +1', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  const before = await readStreak(page);

  await pill(page, 'Start lesson').click();
  await page.waitForURL(/\/lesson\//);

  const cont = pill(page, 'Continue');
  for (let i = 0; i < 40 && !(await cont.isVisible()); i++) {
    const start = pill(page, 'Start');
    if (await start.isVisible()) await start.click();
    const skip = pill(page, 'Skip');
    if (await skip.isVisible()) await skip.click();
    await page.waitForTimeout(400);
  }
  await expect(cont).toBeVisible({ timeout: 20_000 });
  await cont.click();

  // Po oslavě může následovat růst opice (/stage-up) nebo výsledek ligy: každý odklepnout [CONTINUE].
  for (let i = 0; i < 4 && new URL(page.url()).pathname !== '/'; i++) {
    await page.waitForTimeout(800);
    if (new URL(page.url()).pathname === '/') break;
    const next = pill(page, 'Continue');
    if (await next.isVisible()) await next.click();
  }
  await page.waitForURL((u) => u.pathname === '/', { timeout: 20_000 });
  await expect(pill(page, 'Start lesson')).toBeVisible();
  await expect.poll(() => readStreak(page)).toBe(before + 1);
  expect(errors).toEqual([]);
});
