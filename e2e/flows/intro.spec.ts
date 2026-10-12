import { expect, test } from '../fixtures';
import { collectErrors, pill, visible, waitForIdle } from '../helpers';

test.use({ intro: true });

test('splash: studený start, hlava a kruh teček na w320, ťuknutí přeskočí na mapu', async ({ page }) => {
  const errors = collectErrors(page);
  // Splash drží do ťuknutí (jinak by se sám prolnul dřív, než změříme geometrii).
  await page.addInitScript('globalThis.__OPICE_HOLD_INTRO__ = true;');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/dev');
  const intro = page.getByTestId('splash');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  await expect(intro).toHaveAttribute('aria-label', 'Opice');
  await expect(intro).toHaveAttribute('role', 'button');

  // Geometrie: hlava 140 pt (= imageWidth nativního splashe) přesně uprostřed okna, 12 teček kruhu na displeji bez překryvu.
  const head = await page.getByTestId('splash-head').boundingBox();
  if (!head) throw new Error('splash bez hlavy');
  expect(Math.abs(head.width - 140)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(head.x + head.width / 2 - 160)).toBeLessThanOrEqual(1);
  expect(Math.abs(head.y + head.height / 2 - 284)).toBeLessThanOrEqual(1);
  const dotsLoc = page.getByTestId('splash-dot');
  await expect(dotsLoc).toHaveCount(12);
  const boxes = await dotsLoc.evaluateAll((els) => els.map((e) => {
    const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
  }));
  for (const b of boxes) {
    expect(b.w).toBeGreaterThan(2);
    expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.w).toBeLessThanOrEqual(320);
    expect(b.y).toBeGreaterThanOrEqual(0); expect(b.y + b.h).toBeLessThanOrEqual(568);
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i]!, b = boxes[j]!;
    const overlap = a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
    expect(overlap).toBe(false);
  }

  // Skip ťuknutím → pod ním appka; demo profil → mapa.
  await intro.click();
  await expect(intro).toHaveCount(0);
  await waitForIdle(page, 200);
  await visible(page.getByText(/Load demo profile/i)).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });

  // Nový JS kontext (reload = studený start): intro znovu nad mapou, skip vrátí mapu.
  await page.reload();
  await expect(intro).toBeVisible({ timeout: 30_000 });
  await intro.click();
  await expect(intro).toHaveCount(0);
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

test('splash: bez ťuknutí sám dohraje (≤ 1.2 s) a prolne se do appky', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dev');
  const intro = page.getByTestId('splash');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  // Žádný tap: po rozsvícení kruhu, mrknutí a prolnutí splash zmizí sám a pod ním je appka.
  await expect(intro).toHaveCount(0, { timeout: 10_000 });
  await visible(page.getByText(/Load demo profile/i)).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });

  // Studený start nad mapou: intro samo zmizí a ukáže mapu.
  await page.reload();
  await expect(intro).toBeVisible({ timeout: 30_000 });
  await expect(intro).toHaveCount(0, { timeout: 10_000 });
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
