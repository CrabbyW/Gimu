import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { collectErrors, loadDemo, useReducedMotion, waitForIdle } from '../helpers';

/** Opacita a natočení (deg) indikátoru pull-to-refresh (opičí hlava). */
const probe = (page: Page) => page.evaluate(() => {
  const el = document.querySelector('[data-testid="map-refresh"]');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform);
  return { opacity: Number(cs.opacity), deg: Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI) };
});

/** Mapa na začátek (kolečko nahoru), pak tah dolů myší z volného místa mapy. */
async function pullDown(page: Page, dy: number, release = true) {
  const vp = page.viewportSize()!;
  const x = 28;
  const y = Math.round(vp.height * 0.4);
  await page.mouse.move(vp.width / 2, y);
  for (let i = 0; i < 10; i++) await page.mouse.wheel(0, -2000);
  await page.waitForTimeout(400);
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = 16;
  for (let i = 1; i <= steps; i++) await page.mouse.move(x, y + (dy * i) / steps, { steps: 2 });
  if (release) await page.mouse.up();
}

test('mapa: tah dolů na začátku mapy = opičí hlava se točí, obnova doběhne a indikátor zmizí', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  await waitForIdle(page, 900);
  expect((await probe(page))?.opacity).toBe(0);

  await pullDown(page, 300, false);
  const held = await probe(page);
  expect(held?.opacity ?? 0).toBeGreaterThan(0.9);
  await page.mouse.up();

  // Točí se: natočení se mezi dvěma vzorky mění; drží aspoň minimální dobu (ne bliknutí).
  await page.waitForTimeout(150);
  const a = await probe(page);
  await page.waitForTimeout(200);
  const b = await probe(page);
  expect(a?.opacity ?? 0).toBeGreaterThan(0.5);
  expect(b?.opacity ?? 0).toBeGreaterThan(0.5);
  expect(a?.deg).not.toBe(b?.deg);
  // Po obnově dat (min. 600 ms) se schová; mapa je dál interaktivní.
  await expect.poll(async () => (await probe(page))?.opacity ?? 1, { timeout: 5_000 }).toBe(0);
  await expect(page.getByTestId('start-card').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('mapa: krátký tah pod prahem obnovu nespustí a hlava se hned schová', async ({ page }) => {
  await loadDemo(page);
  await waitForIdle(page, 900);
  await pullDown(page, 60);
  await expect.poll(async () => (await probe(page))?.opacity ?? 1, { timeout: 1_000 }).toBe(0);
});

test('mapa: omezený pohyb = hlava bez rotace, jen pulz, a po obnově zmizí', async ({ page }) => {
  await useReducedMotion(page);
  await loadDemo(page);
  await waitForIdle(page, 900);
  await pullDown(page, 300);
  await page.waitForTimeout(250);
  const s = await probe(page);
  expect(s?.opacity ?? 0).toBeGreaterThan(0.2);
  expect(s?.deg).toBe(0);
  await expect.poll(async () => (await probe(page))?.opacity ?? 1, { timeout: 5_000 }).toBe(0);
});
