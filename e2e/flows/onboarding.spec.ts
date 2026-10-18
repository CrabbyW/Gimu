import { expect, test } from '../fixtures';
import { collectErrors, pill, visible, waitForIdle } from '../helpers';

test('onboarding: krátký tok Cesta → Zrození → mapa, pak Finish setup', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/');
  await page.waitForURL(/\/onboarding\/path/);
  await waitForIdle(page, 200);

  // 01 / path (elite fáze 1: vize, milníky, váha a připomínka se doplní až po první lekci)
  await expect(page.getByText('01/02')).toBeVisible();
  await visible(page.getByRole('radio')).click();
  await visible(page.getByRole('button', { name: /^Continue$/ })).click();
  // 02 / birth
  await page.waitForURL(/\/onboarding\/birth/);
  await visible(page.getByRole('button', { name: /Let.s train/ })).click();

  await page.waitForURL((u) => u.pathname === '/');
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  // First run: prohlídka mapy (4 tipy) a jednořádková dlaždice „Finish setup“.
  await expect(page.getByTestId('map-tour')).toBeVisible({ timeout: 10_000 });
  const tile = page.getByRole('button', { name: /^Finish setup, 4 steps left$/ });
  await expect(visible(tile)).toBeVisible();

  // Persist: po reloadu zůstává mapa, ne onboarding.
  await page.reload();
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  expect(new URL(page.url()).pathname).toBe('/');

  // Prohlídka: ťuknutí kamkoli = další tip (1/4 … 4/4), po posledním zmizí a už se nevrátí.
  const tour = page.getByTestId('map-tour');
  for (let i = 1; i <= 4; i++) {
    await expect(tour).toHaveAccessibleName(new RegExp(`^Tip ${i} of 4\.`), { timeout: 10_000 });
    await tour.click();
  }
  await expect(tour).toHaveCount(0);
  await page.reload();
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1_500);
  await expect(page.getByTestId('map-tour')).toHaveCount(0);

  // Finish setup: čtyři kroky s výchozími hodnotami, Done → dlaždice zmizí.
  await visible(tile).click();
  await page.waitForURL(/\/setup/);
  await expect(visible(page.getByRole('button', { name: /^Body vision/ }))).toBeVisible();
  await expect(visible(page.getByRole('button', { name: /^Daily reminder/ }))).toBeVisible();
  await visible(page.getByRole('button', { name: /^Done$/ })).click();
  await page.waitForURL((u) => u.pathname === '/');
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  await expect(tile.filter({ visible: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('onboarding: neplatná váha neprojde dál', async ({ page }) => {
  // Krok váhy už není v toku (elite fáze 1), obrazovka zůstává dostupná přímo.
  await page.goto('/onboarding/weight');
  await waitForIdle(page, 200);
  await page.waitForURL(/\/onboarding\/weight/);
  await visible(page.getByRole('radio', { name: /^Lose/ })).click();
  await visible(page.getByLabel('Current weight')).fill('0');
  await visible(page.getByLabel('Target weight')).fill('75');
  await visible(page.getByRole('button', { name: /^Continue$/ })).click({ force: true });
  await page.waitForTimeout(800);
  await expect(page).toHaveURL(/\/onboarding\/weight/);
});
