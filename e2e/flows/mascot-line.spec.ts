import type { Page } from '@playwright/test';
import { copy } from '../../data/copy';
import { expect, test } from '../fixtures';
import { collectErrors, loadDemo, visible, waitForIdle } from '../helpers';

/** Replika opičky (elite fáze 3): ťuknutí na opičku na mapě → bublina s větou z `copy.mascotLines`,
 *  po `LINE_SHOW_MS` (2.4 s) + odchodu (`lineBubble.outMs`) zmizí. Bublina je celá ve viewportu a pod hlavičkou. */
const LINES = new Set<string>(Object.values(copy.mascotLines).flat());
const SHOW_MS = 2400;

async function tapMascot(page: Page) {
  await loadDemo(page);
  await waitForIdle(page, 900);
  const monkey = visible(page.getByRole('button', { name: /Your monkey/i }));
  await monkey.click();
  const bubble = page.getByTestId('mascot-line');
  await expect(bubble).toBeVisible({ timeout: 3_000 });
  // Nástup (`lineBubble.inMs`) a případný posun mapy pod hlavičku doběhnou.
  await page.waitForTimeout(500);
  return bubble;
}

async function expectGeometry(page: Page) {
  const vp = page.viewportSize()!;
  const b = (await page.getByTestId('mascot-line').boundingBox())!;
  const head = (await visible(page.getByRole('heading')).boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(vp.width);
  expect(b.y + b.height).toBeLessThanOrEqual(vp.height);
  // Pod hlavičkou: horní hrana bubliny pod spodní hranou nadpisu (žádná kolize).
  expect(b.y).toBeGreaterThanOrEqual(head.y + head.height);
}

test('mapa: ťuknutí na opičku ukáže repliku a po 2.4 s + odchodu zmizí', async ({ page }) => {
  const errors = collectErrors(page);
  const bubble = await tapMascot(page);
  const t0 = Date.now();
  const label = await bubble.locator('[aria-label]').first().getAttribute('aria-label');
  expect(LINES.has(label ?? '')).toBe(true);
  await expect(bubble).toContainText((label ?? '').toUpperCase());
  await expectGeometry(page);
  // Visí ještě těsně před koncem, pak odejde (nejpozději po odchodu + rezerva).
  await page.waitForTimeout(Math.max(0, SHOW_MS - 1200 - (Date.now() - t0)));
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveCount(0, { timeout: 2_000 });
  expect(errors).toEqual([]);
});

test.describe('w320', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('mapa w320: bublina repliky nepřeteče a nekoliduje s hlavičkou', async ({ page }) => {
    const errors = collectErrors(page);
    await tapMascot(page);
    await expectGeometry(page);
    expect(errors).toEqual([]);
  });
});
