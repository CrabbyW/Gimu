import { expect, test } from '../fixtures';
import { collectErrors, pill, visible, waitForIdle } from '../helpers';

test.use({ intro: true });

test('intro OPICE: studený start, geometrie na w320, ťuknutí přeskočí na mapu', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/dev');
  const intro = page.getByTestId('dot-intro');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  await expect(intro).toHaveAttribute('aria-label', 'Opice');
  await expect(intro).toHaveAttribute('role', 'button');

  // Geometrie: nápis ≤ 80 % šířky, vycentrovaný, všechny rozsvícené tečky celé na displeji a bez překryvu.
  const word = await page.getByTestId('intro-word').boundingBox();
  if (!word) throw new Error('intro bez rozměrů');
  expect(word.width).toBeLessThanOrEqual(320 * 0.8 + 0.5);
  expect(Math.abs(word.x + word.width / 2 - 160)).toBeLessThanOrEqual(1);
  expect(Math.abs(word.y + word.height / 2 - 284)).toBeLessThanOrEqual(1);
  const boxes = await page.getByTestId('intro-dot-on').evaluateAll((els) => els.map((e) => {
    const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
  }));
  expect(boxes.length).toBe(77); // textDots("OPICE").dots.length
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
