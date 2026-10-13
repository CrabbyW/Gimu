import { expect, test } from '../fixtures';
import { collectErrors, pill, resetApp, visible, waitForIdle } from '../helpers';

/** Elite fáze 1, Task 5: celý první průchod od resetu po doplnění cílů.
 *  Měří čas od prvního otevření (onboarding/path) po start lekce: s automatickými kliky ≤ 30 s. */
test('first run: reset → path → birth → mapa → lekce → oslava → Set your goals → /setup → Done', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);

  // Reset z jiného stavu (demo není nutné: reset musí fungovat i z čerstvé appky).
  await page.goto('/');
  await page.waitForURL(/\/onboarding\/path/);
  await resetApp(page);
  await waitForIdle(page, 200);

  const t0 = Date.now();
  await expect(page.getByText('01/02')).toBeVisible();
  await visible(page.getByRole('radio')).click();
  await visible(page.getByRole('button', { name: /^Continue$/ })).click();
  await page.waitForURL(/\/onboarding\/birth/);
  await visible(page.getByRole('button', { name: /Let.s train/ })).click();

  await page.waitForURL((u) => u.pathname === '/');
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  await expect(visible(page.getByRole('button', { name: 'Tap Start to begin' }))).toBeVisible();
  const tile = page.getByRole('button', { name: /^Finish setup, 4 steps left$/ });
  await expect(visible(tile)).toBeVisible();

  // Dvojí tap na Start lesson = jedna navigace (let kotouče drží zámek).
  const start = pill(page, 'Start lesson');
  const histBefore = await page.evaluate(() => history.length);
  await start.click();
  await start.click({ force: true, timeout: 2_000 }).catch(() => undefined);
  await page.waitForURL(/\/lesson\//);
  const toLesson = Date.now() - t0;
  test.info().annotations.push({ type: 'time-to-lesson-ms', description: String(toLesson) });
  console.log(`time-to-lesson-ms=${toLesson}`);
  expect(toLesson).toBeLessThanOrEqual(30_000);
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => history.length)).toBe(histBefore + 1);

  const cont = pill(page, 'Continue');
  // Výdrž bez Skip (canSkip) musí doběhnout: smyčka až ~60 s.
  for (let i = 0; i < 150 && !(await cont.isVisible()); i++) {
    const s = pill(page, 'Start');
    if (await s.isVisible()) await s.click({ timeout: 2_000 }).catch(() => undefined);
    const skip = pill(page, 'Skip');
    // Mimo demo skrývá Skip adaptivní pravidlo canSkip (lekce by se nezapočítala): pak [DONE].
    const done = pill(page, 'Done');
    if (await skip.isVisible()) await skip.click({ timeout: 2_000 }).catch(() => undefined);
    else if (await done.isVisible()) await done.click({ timeout: 2_000 }).catch(() => undefined);
      // Pauza mezi cviky (UX pass U1): po [DONE] přijde odpočet, přeskočí se.
      const rest = pill(page, 'Skip rest');
      if (await rest.isVisible()) await rest.click({ timeout: 2_000 }).catch(() => undefined);
    await page.waitForTimeout(400);
  }
  await expect(cont).toBeVisible({ timeout: 20_000 });
  // První oslava: bublina průvodce a sekundární „Set your goals“.
  await expect(visible(page.getByText('That’s your first plate'))).toBeVisible();
  const goals = pill(page, 'Set your goals');
  await expect(goals).toBeVisible();

  await goals.click();
  await page.waitForURL(/\/setup/);
  await expect(visible(page.getByRole('button', { name: /^Body vision/ }))).toBeVisible();
  await visible(page.getByRole('button', { name: /^Done$/ })).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 20_000 });
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  await expect(tile.filter({ visible: true })).toHaveCount(0);
  // Bublina mapStart už se nevrátí (viděno).
  await expect(page.getByRole('button', { name: 'Tap Start to begin' }).filter({ visible: true })).toHaveCount(0);

  // Persist: po reloadu bez dlaždice i bez bubliny.
  await page.reload();
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  await expect(tile.filter({ visible: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('first run: starý (demo) profil nemá bublinu ani Finish setup', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dev');
  await waitForIdle(page, 200);
  await visible(page.getByText(/Load demo profile/i)).click();
  await page.waitForURL((u) => u.pathname === '/');
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /^Finish setup/ }).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tap Start to begin' }).filter({ visible: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});
