import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { collectErrors, loadDemo, visible, waitForIdle } from '../helpers';
import { lastTextCount, textCollisions } from '../textGeometry';

/** Vstupní test (elite fáze 5): Finish setup / Nastavení → test → lekce má škálované dávky; skip = výchozí. */

/** Celková dávka první výdrže lekce z a11y popisu tečkového odpočtu („30 seconds“). */
async function firstHoldSeconds(page: Page, lessonId: string): Promise<number> {
  await page.goto(`/lesson/${lessonId}`);
  await waitForIdle(page, 400);
  const timer = visible(page.locator('[role="timer"]'));
  await expect(timer).toBeVisible({ timeout: 30_000 });
  const label = await timer.getAttribute('aria-label');
  return Number(label?.match(/(\d+)/)?.[1] ?? NaN);
}

async function expectNoCollisions(page: Page, where: string) {
  await waitForIdle(page, 500);
  const found = await textCollisions(page);
  expect(found, where).toEqual([]);
  expect(await lastTextCount(page), where).toBeGreaterThan(3);
}

const next = (page: Page) => visible(page.getByRole('button', { name: /^Next$/ })).click();

test('vstupní test: Finish setup → připravenost → kliky → plank → výsledek → lekce bc-1-1 škálovaná', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  expect(await firstHoldSeconds(page, 'bc-1-1')).toBe(30); // bez testu výchozí plank 30 s

  await page.goto('/setup');
  await waitForIdle(page, 300);
  await visible(page.getByRole('button', { name: /^Find your level/ })).click();
  await page.waitForURL(/\/fitness-test/);
  await expect(visible(page.getByText('Before you start'))).toBeVisible();
  await expect(visible(page.getByText(/not medical advice/))).toBeVisible();

  // „Ano“ jen upozorní, Next jde dál.
  await visible(page.getByRole('radio', { name: 'Yes' })).click();
  await expect(visible(page.getByText(/check with a doctor/))).toBeVisible();
  await next(page);

  await expect(visible(page.getByText('Push-ups', { exact: true }))).toBeVisible();
  await visible(page.getByLabel('Push-ups in a row')).fill('16');
  await next(page);

  await expect(visible(page.getByText('Forearm plank', { exact: true }))).toBeVisible();
  await visible(page.getByLabel('Plank seconds')).fill('90');
  await next(page);

  await expect(visible(page.getByText('Lessons scaled: reps ×1.0, holds ×1.5'))).toBeVisible();
  await visible(page.getByRole('button', { name: /^Save$/ })).click();
  await page.waitForURL(/\/setup/);
  await expect(visible(page.getByRole('button', { name: /^Find your level: 16.push-ups · 90.s plank/ }))).toBeVisible();

  // Plank 30 s × 1.5 = 45 s od další lekce.
  expect(await firstHoldSeconds(page, 'bc-1-1')).toBe(45);
  expect(errors).toEqual([]);
});

test('vstupní test: skip z Nastavení nechá výchozí dávky', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  await page.goto('/settings');
  await waitForIdle(page, 300);
  await visible(page.getByRole('button', { name: /^Retake level test/ })).click();
  await page.waitForURL(/\/fitness-test/);
  await next(page);
  await visible(page.getByLabel('Push-ups in a row')).fill('40');
  await visible(page.getByRole('button', { name: 'Skip, use default' })).click();
  await page.waitForURL(/\/settings/);
  expect(await firstHoldSeconds(page, 'bc-1-1')).toBe(30);
  expect(errors).toEqual([]);
});

test.describe('w320', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('vstupní test a caution poznámka bez kolizí textu na 320 pt', async ({ page }) => {
    await loadDemo(page);
    await page.goto('/fitness-test');
    await expectNoCollisions(page, 'připravenost');
    await visible(page.getByRole('radio', { name: 'Yes' })).click();
    await expectNoCollisions(page, 'připravenost + consult');
    await next(page);
    await expectNoCollisions(page, 'kliky');
    await next(page);
    await visible(page.getByRole('button', { name: /^Start$/ })).click();
    await expect(visible(page.getByRole('button', { name: /^Stop$/ }))).toBeVisible();
    await expectNoCollisions(page, 'plank, běžící stopky');
    await visible(page.getByRole('button', { name: /^Stop$/ })).click();
    await next(page);
    await expectNoCollisions(page, 'výsledek');

    // bc-1-5 začíná pike hold (caution): poznámka je vidět a nekoliduje.
    await page.goto('/lesson/bc-1-5');
    await waitForIdle(page, 600);
    const note = visible(page.getByText(/Advanced move/));
    await expect(note).toBeAttached();
    await note.scrollIntoViewIfNeeded();
    await expectNoCollisions(page, 'lekce s caution');
    // Lekce bez náročného cviku poznámku nemá.
    await page.goto('/lesson/bc-1-1');
    await waitForIdle(page, 600);
    await expect(page.getByText(/Advanced move/).filter({ visible: true })).toHaveCount(0);
  });
});
