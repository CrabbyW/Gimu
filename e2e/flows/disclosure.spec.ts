import type { Page } from '@playwright/test';
import { copy } from '../../data/copy';
import { expect, test } from '../fixtures';
import { collectErrors, gotoTab, loadDemo, pill, resetApp, visible, waitForIdle } from '../helpers';
import { textsUnder } from '../textGeometry';

/** UX pass U4: progresivní odhalení (liga po 3 lekcích, sezóna po 5, šatník po 2) a řádek „důvod se vrátit“. */

async function newProfile(page: Page) {
  await page.goto('/');
  await page.waitForURL(/\/onboarding\/path/);
  await resetApp(page);
  await waitForIdle(page, 200);
  await visible(page.getByRole('radio')).click();
  await visible(page.getByRole('button', { name: /^Continue$/ })).click();
  await page.waitForURL(/\/onboarding\/birth/);
  await visible(page.getByRole('button', { name: /Let.s train/ })).click();
  await page.waitForURL((u) => u.pathname === '/');
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Dopíše do uloženého profilu `n` dokončených lekcí (den `day`) a průvodce mapy jako viděného, pak reload.
 *  Rychlejší než n× odcvičit lekci; logika odemčení čte jen `activity` (lekce ≠ dev XP). */
async function seedLessons(page: Page, n: number, day: string) {
  await page.evaluate(([count, d]) => {
    const raw = localStorage.getItem('opice-db');
    if (!raw) throw new Error('opice-db chybí');
    const db = JSON.parse(raw) as { state: { profile: { activity: unknown[]; guideSeen?: string[] } } };
    const p = db.state.profile;
    for (let i = 0; i < (count as number); i++) {
      p.activity.push({ id: `seed-${i}`, at: `${d}T10:00:00.000Z`, day: d, lessonId: `seed-lesson-${i + 1}`, xp: 20 });
    }
    p.guideSeen = Array.from(new Set([...(p.guideSeen ?? []), 'mapStart', 'lessonHold', 'lessonReps', 'celebrationFirst']));
    localStorage.setItem('opice-db', JSON.stringify(db));
  }, [n, day] as const);
  await page.goto('/');
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
}

test('nový profil: liga a sezóna zamčené (tab vidět), po 3 lekcích liga odemčená', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await newProfile(page);

  // Mapa first-run: žádné ligové ani sezónní prvky.
  await expect(page.getByText(/league/i)).toHaveCount(0);
  await expect(page.getByText(/season/i)).toHaveCount(0);

  // Tab bar stabilní: 5 tabů, liga a sezóna ohlásí zámek.
  await expect(page.getByRole('tab')).toHaveCount(5);
  await expect(visible(page.getByRole('tab', { name: copy.disclosure.tabA11y('League', 3) }))).toBeVisible();
  await expect(visible(page.getByRole('tab', { name: copy.disclosure.tabA11y('Season', 5) }))).toBeVisible();

  await gotoTab(page, 'league');
  await expect(visible(page.getByTestId('feature-locked'))).toBeVisible();
  await expect(visible(page.getByText(copy.disclosure.unlocksIn(3)))).toBeVisible();
  await expect(page.getByTestId('league-podium')).toHaveCount(0);

  await gotoTab(page, 'season');
  await expect(visible(page.getByText(copy.disclosure.unlocksIn(5)))).toBeVisible();

  await gotoTab(page, 'profile');
  await expect(visible(page.getByTestId('wardrobe-locked'))).toBeVisible();

  await seedLessons(page, 3, iso(new Date()));
  await expect(visible(page.getByRole('tab', { name: /^League$/ }))).toBeVisible();
  await gotoTab(page, 'league');
  await expect(visible(page.getByTestId('league-podium'))).toBeVisible();
  await expect(page.getByTestId('feature-locked').filter({ visible: true })).toHaveCount(0);
  // Sezóna stále zamčená (zbývají 2), šatník odemčený.
  await gotoTab(page, 'season');
  await expect(visible(page.getByText(copy.disclosure.unlocksIn(2)))).toBeVisible();
  await gotoTab(page, 'profile');
  await expect(page.getByTestId('wardrobe-locked').filter({ visible: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('demo (legacy profil bez guideSeen): vše otevřené', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  await expect(visible(page.getByRole('tab', { name: /^League$/ }))).toBeVisible();
  await expect(visible(page.getByRole('tab', { name: /^Season$/ }))).toBeVisible();
  await gotoTab(page, 'league');
  await expect(visible(page.getByTestId('league-podium'))).toBeVisible();
  await gotoTab(page, 'season');
  await expect(page.getByTestId('feature-locked').filter({ visible: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('řádek série: atRisk (včera ano, dnes ne) a done; bez kolize na w320', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await newProfile(page);
  const yesterday = new Date(Date.now() - 86_400_000);
  await seedLessons(page, 1, iso(yesterday));
  const line = visible(page.getByTestId('return-line'));
  await expect(line).toContainText(copy.returnLine.atRisk);
  await expect(line).toContainText(/Next: .+ · \d+\u00a0min/);
  await waitForIdle(page, 900);
  // Řádek nekoliduje s jiným textem (hlavička, pokrok sekce, popisky uzlů pod závojem jsou opacity > 0, ale nesmí ležet pod ním).
  const box = (await line.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  expect(await textsUnder(page, box, '[data-testid="return-line"]')).toEqual([]);

  await seedLessons(page, 1, iso(new Date()));
  await expect(visible(page.getByTestId('return-line'))).toContainText(copy.returnLine.done);
  expect(errors).toEqual([]);
});
