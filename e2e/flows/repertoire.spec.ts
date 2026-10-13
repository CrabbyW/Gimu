import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { collectErrors, loadDemo, pill, useReducedMotion, visible, waitForIdle } from '../helpers';

/** 26 animací plánu (řádek 6 = přeskok i stojka → 27 tlačítek), testID `act-<id>` v /dev. */
const ACTS = [
  'warmup', 'boredSit', 'sleep', 'gaze', 'pointStart', 'plateHop', 'handstandPlate', 'headShake', 'giggle', 'flip', 'hangFinger',
  'trainAlong', 'strain', 'wipeSweat', 'shrug', 'liftBarbell', 'flameJump', 'climbPodium', 'grow', 'morningStretch', 'eveningTowel',
  'waveRun', 'streakAtRisk', 'sadThenPoint', 'wifiShake', 'ropeTangle', 'peekBox',
] as const;

/** Konzolové chyby Reactu / Reanimated (pád workletu na webu se hlásí do konzole, ne jako pageerror). */
function collectConsoleErrors(page: Page) {
  const out: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') out.push(m.text()); });
  return out;
}

async function runAll(page: Page) {
  await page.goto('/dev');
  await waitForIdle(page, 300);
  const stage = visible(page.getByTestId('mascot-actions-stage'));
  await expect(stage).toBeVisible();
  for (const id of ACTS) {
    const b = visible(page.getByTestId(`act-${id}`));
    await b.scrollIntoViewIfNeeded();
    await b.click();
    // Přehrává se právě tahle akce (řádek NOW PLAYING nese její popisek).
    const label = (await b.getAttribute('aria-label'))!.replace(/^Play: /, '');
    await expect(visible(page.getByTestId('mascot-actions-now'))).toContainText(label);
    // Kus akce doběhne (worklety kostry, rekvizit, těla) — chyba by se ukázala hned.
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1500);
}

test('/dev: všech 26 animací opičky projde bez chyby a bez pageerror', async ({ page }) => {
  const errors = collectErrors(page);
  const consoleErrors = collectConsoleErrors(page);
  await runAll(page);
  expect(errors).toEqual([]);
  expect(consoleErrors.filter((e) => /worklet|reanimated|Maximum update|Cannot read/i.test(e))).toEqual([]);
});

test('/dev: Play all přehrává postupně a jde zastavit', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dev');
  await waitForIdle(page, 300);
  const play = visible(page.getByText('[PLAY ALL]', { exact: true }));
  await play.scrollIntoViewIfNeeded();
  await play.click();
  const now = visible(page.getByTestId('mascot-actions-now'));
  await expect(now).toContainText('Warm-up');
  // Rozcvička trvá 4,8 s, pak přijde nuda na kotouči.
  await expect(now).toContainText('Bored on a plate', { timeout: 8000 });
  await visible(page.getByText('[STOP]', { exact: true })).click();
  await expect(visible(page.getByText('[PLAY ALL]', { exact: true }))).toBeVisible();
  expect(errors).toEqual([]);
});

test('/dev s omezeným pohybem: každá akce = statická póza, bez chyby', async ({ page }) => {
  await useReducedMotion(page);
  const errors = collectErrors(page);
  await runAll(page);
  expect(errors).toEqual([]);
});

test('lekce: mini opička cvičí s tebou vedle čísla, v pauze se napije', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  await pill(page, 'Start lesson').click();
  await expect(visible(page.getByTestId('lesson-coach'))).toBeVisible({ timeout: 20_000 });
  // Dekorativní: čtečka ji přeskočí (popisek nese karta cviku).
  await expect(visible(page.getByTestId('lesson-coach')).locator('[aria-label]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
