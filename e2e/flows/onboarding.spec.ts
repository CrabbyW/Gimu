import { expect, test } from '../fixtures';
import { collectErrors, pill, visible, waitForIdle } from '../helpers';

test('onboarding: 6 kroků až na mapu', async ({ page }) => {
  const errors = collectErrors(page);
  const next = () => visible(page.getByRole('button', { name: /^Continue$/ })).click();

  await page.goto('/');
  await page.waitForURL(/\/onboarding\/path/);
  await waitForIdle(page, 200);

  // 1 / path
  await visible(page.getByRole('radio')).click();
  await next();
  // 2 / dream
  await page.waitForURL(/\/onboarding\/dream/);
  await visible(page.getByRole('radio', { name: /^Muscle-up/ })).click();
  await next();
  // 3 / milestones (2 volby)
  await page.waitForURL(/\/onboarding\/milestones/);
  await visible(page.getByRole('checkbox', { name: '10 pull-ups' })).click();
  await visible(page.getByRole('checkbox', { name: '20 push-ups' })).click();
  await next();
  // 4 / weight: hubnutí 80 → 75
  await page.waitForURL(/\/onboarding\/weight/);
  await visible(page.getByRole('radio', { name: /^Lose/ })).click();
  await visible(page.getByLabel('Current weight')).fill('80');
  await visible(page.getByLabel('Target weight')).fill('75');
  await next();
  // 5 / reminder
  await page.waitForURL(/\/onboarding\/reminder/);
  await expect(visible(page.getByRole('button', { name: /Reminder time/ }))).toBeVisible();
  await next();
  // 6 / birth
  await page.waitForURL(/\/onboarding\/birth/);
  await visible(page.getByRole('button', { name: /Let.s train/ })).click();

  await page.waitForURL((u) => u.pathname === '/');
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });

  // Persist: po reloadu zůstává mapa, ne onboarding.
  await page.reload();
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  expect(new URL(page.url()).pathname).toBe('/');
  expect(errors).toEqual([]);
});

test('onboarding: neplatná váha neprojde dál', async ({ page }) => {
  await page.goto('/onboarding/path');
  await waitForIdle(page, 200);
  await visible(page.getByRole('radio')).click();
  await visible(page.getByRole('button', { name: /^Continue$/ })).click();
  await visible(page.getByRole('radio', { name: /^Muscle-up/ })).click();
  await visible(page.getByRole('button', { name: /^Continue$/ })).click();
  await visible(page.getByRole('checkbox', { name: '10 pull-ups' })).click();
  await visible(page.getByRole('checkbox', { name: '20 push-ups' })).click();
  await visible(page.getByRole('button', { name: /^Continue$/ })).click();
  await page.waitForURL(/\/onboarding\/weight/);
  await visible(page.getByRole('radio', { name: /^Lose/ })).click();
  await visible(page.getByLabel('Current weight')).fill('0');
  await visible(page.getByLabel('Target weight')).fill('75');
  await visible(page.getByRole('button', { name: /^Continue$/ })).click({ force: true });
  await page.waitForTimeout(800);
  await expect(page).toHaveURL(/\/onboarding\/weight/);
});
