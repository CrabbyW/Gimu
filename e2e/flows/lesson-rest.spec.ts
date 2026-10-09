import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { collectErrors, loadDemo, pill, visible, waitForIdle } from '../helpers';
import { lastTextCount, textCollisions } from '../textGeometry';

/** UX pass U1 + U2: cvik → pauza → další cvik; tip a [DONE] bez scrollu; pocit po lekci mění další dávku.
 *  bc-1-3 začíná opakováním (incline push-up), po něm plank 30 s: po [DONE] tedy přijde pauza s plankem. */

async function expectNoCollisions(page: Page, where: string) {
  await waitForIdle(page, 500);
  expect(await textCollisions(page), where).toEqual([]);
  expect(await lastTextCount(page), where).toBeGreaterThan(3);
}

/** Prvek celý ve viewportu (bez scrollu). */
async function expectInViewport(page: Page, testId: string) {
  const box = await visible(page.getByTestId(testId)).boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box, testId).not.toBeNull();
  expect(box!.y, testId).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height, testId).toBeLessThanOrEqual(vh);
}

async function expectDoneInViewport(page: Page, label: string) {
  const b = await visible(page.getByRole('button', { name: new RegExp(`^${label}$`) })).boundingBox();
  expect(b, label).not.toBeNull();
  expect(b!.height, `${label} výška`).toBeGreaterThanOrEqual(64);
  expect(b!.y + b!.height, label).toBeLessThanOrEqual(page.viewportSize()!.height);
}

/** [CONTINUE] je v DOM od začátku oslavy (průhledné, rezervované místo): na konec čekáme přes povolené volby pocitu. */
async function celebrationSettled(page: Page) {
  await expect(visible(page.getByRole('radio', { name: 'Easy' }))).toBeEnabled({ timeout: 20_000 });
  await waitForIdle(page, 800);
}

const restSeconds = async (page: Page) =>
  Number((await visible(page.getByTestId('rest-timer')).getAttribute('aria-label'))?.match(/(\d+) seconds/)?.[1] ?? NaN);

/** Otevře bc-1-3, odklepne první cvik a vrátí sekundy planku z odpočtu výdrže po pauze. */
async function plankAfterRest(page: Page): Promise<number> {
  await page.goto('/lesson/bc-1-3');
  await waitForIdle(page, 400);
  await pill(page, 'Done').click();
  await expect(visible(page.getByTestId('rest-timer'))).toBeVisible();
  await pill(page, 'Skip rest').click();
  const timer = visible(page.locator('[role="timer"]'));
  await expect(timer).toBeVisible();
  return Number((await timer.getAttribute('aria-label'))?.match(/(\d+)/)?.[1] ?? NaN);
}

test('pauza: cvik → [DONE] → odpočet s dalším cvikem → +15 s → [SKIP REST] → plank; Easy → vyšší dávka', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await loadDemo(page);
  await page.goto('/lesson/bc-1-3');
  await waitForIdle(page, 600);

  // Cvik: tip, Next up a velké [DONE] bez scrollu.
  await expectInViewport(page, 'exercise-tip');
  await expect(visible(page.getByTestId('exercise-next'))).toHaveText(/^Next up: Forearm plank · 30\s?s$/u);
  await expectDoneInViewport(page, 'Done');
  await expectNoCollisions(page, 'cvik (opakování)');

  await pill(page, 'Done').click();
  await expect(visible(page.getByTestId('rest-timer'))).toBeVisible();
  expect(await restSeconds(page)).toBeGreaterThanOrEqual(29);
  await expect(visible(page.getByTestId('rest-next'))).toContainText('Forearm plank');
  await expectInViewport(page, 'rest-next');
  await expectNoCollisions(page, 'pauza');
  const before = await restSeconds(page);
  await pill(page, '+15 s').click();
  await expect.poll(() => restSeconds(page)).toBeGreaterThanOrEqual(before + 14);

  await pill(page, 'Skip rest').click();
  const timer = visible(page.locator('[role="timer"]'));
  await expect(timer).toBeVisible();
  const p0 = Number((await timer.getAttribute('aria-label'))?.match(/(\d+)/)?.[1] ?? NaN);
  // Poslední cvik dál než přes demo skip (přeskok jde rovnou, bez pauzy).
  await expectInViewport(page, 'exercise-tip');
  await expectDoneInViewport(page, 'Start');

  const cont = pill(page, 'Continue');
  for (let i = 0; i < 20 && !(await cont.isVisible()); i++) {
    await expect(page.getByTestId('rest-timer').filter({ visible: true })).toHaveCount(0);
    const skip = pill(page, 'Skip');
    if (await skip.isVisible()) await skip.click();
    await page.waitForTimeout(300);
  }
  await expect(cont).toBeVisible({ timeout: 20_000 });
  await celebrationSettled(page);
  await expect(visible(page.getByText('How did it feel?'))).toBeVisible();
  await expectNoCollisions(page, 'oslava s otázkou');
  await visible(page.getByRole('radio', { name: 'Easy' })).click();
  await expect(visible(page.getByText('Next lessons a bit harder'))).toBeVisible();
  await expectNoCollisions(page, 'oslava po hodnocení');
  await cont.click();
  await page.waitForTimeout(800);

  const p1 = await plankAfterRest(page);
  expect(p1).toBeGreaterThan(p0);
  expect(errors).toEqual([]);
});

test.describe('w320', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('cvik, caution cvik, pauza i oslava: tip a [DONE] bez scrollu, nic se nepřekrývá', async ({ page }) => {
    test.setTimeout(150_000);
    const errors = collectErrors(page);
    await loadDemo(page);
    // Náročný cvik (pike hold, CAUTION) jako nejhustší případ.
    await page.goto('/lesson/bc-1-5');
    await waitForIdle(page, 600);
    await expectInViewport(page, 'exercise-tip');
    await expect(visible(page.getByTestId('exercise-caution-tag'))).toBeInViewport();
    await expectDoneInViewport(page, 'Start');
    await expectNoCollisions(page, 'w320 caution cvik');

    await page.goto('/lesson/bc-1-3');
    await waitForIdle(page, 600);
    await expectInViewport(page, 'exercise-tip');
    await expectDoneInViewport(page, 'Done');
    await expectNoCollisions(page, 'w320 cvik');
    await pill(page, 'Done').click();
    await expect(visible(page.getByTestId('rest-timer'))).toBeVisible();
    await expectInViewport(page, 'rest-next');
    await expectInViewport(page, 'rest-timer');
    await expectNoCollisions(page, 'w320 pauza');
    await pill(page, 'Skip rest').click();

    const cont = pill(page, 'Continue');
    for (let i = 0; i < 20 && !(await cont.isVisible()); i++) {
      const skip = pill(page, 'Skip');
      if (await skip.isVisible()) await skip.click();
      await page.waitForTimeout(300);
    }
    await expect(cont).toBeVisible({ timeout: 20_000 });
    await celebrationSettled(page);
    await expectInViewport(page, 'feel-picker');
    await expectNoCollisions(page, 'w320 oslava s otázkou');
    expect(errors).toEqual([]);
  });
});
