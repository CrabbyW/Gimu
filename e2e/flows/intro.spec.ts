import { expect, test } from '../fixtures';
import { collectErrors, gotoTab, pill, visible, waitForIdle } from '../helpers';

test.use({ intro: true });

test('splash: studený start, tečkový nápis GIMU (bez opice) na w320, ťuknutí přeskočí na mapu', async ({ page }) => {
  const errors = collectErrors(page);
  // Splash drží do ťuknutí (jinak by se sám prolnul dřív, než změříme geometrii).
  await page.addInitScript('globalThis.__OPICE_HOLD_INTRO__ = true;');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/dev');
  const intro = page.getByTestId('splash');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  await expect(intro).toHaveAttribute('aria-label', 'Gimu');
  await expect(intro).toHaveAttribute('role', 'button');

  // Geometrie (03 Tečkový nápis): nápis GIMU vodorovně uprostřed a celý na displeji, svítící tečky bez překryvu,
  // jediná živá tečka nad I; opice ve splashi není (skočí pak na mapě).
  const word = page.getByTestId('splash-word');
  await expect(page.getByTestId('splash-head')).toHaveCount(0);
  await expect(page.getByTestId('splash-dot-on').first()).toBeVisible();
  const wb = await word.boundingBox();
  if (!wb) throw new Error('splash bez nápisu');
  expect(Math.abs(wb.x + wb.width / 2 - 160)).toBeLessThanOrEqual(1);
  expect(Math.abs(wb.y + wb.height / 2 - 284)).toBeLessThanOrEqual(1);
  expect(wb.x).toBeGreaterThanOrEqual(0); expect(wb.x + wb.width).toBeLessThanOrEqual(320);
  await expect(page.getByTestId('splash-live')).toHaveCount(1);
  const dotsLoc = page.getByTestId('splash-dot-on');
  await expect.poll(() => dotsLoc.count()).toBeGreaterThan(60);
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

test('splash: bez ťuknutí sám dohraje (03: sken, živá tečka, ústup) a prolne se do appky', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dev');
  const intro = page.getByTestId('splash');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  // Žádný tap: po skenu, mrknutí a ústupu splash zmizí sám a pod ním je appka.
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

/** Vzorky opacity a svislé polohy opice na mapě (`map-mascot`) po dobu `ms`. */
const sampleMascot = (page: import('@playwright/test').Page, ms: number) => page.evaluate((duration) => new Promise<{ o: number; y: number }[]>((resolve) => {
  const out: { o: number; y: number }[] = [];
  const end = performance.now() + duration;
  const tick = () => {
    const el = [...document.querySelectorAll('[data-testid="map-mascot"]')].find((e) => (e as HTMLElement).offsetParent !== null);
    if (el) out.push({ o: Number(getComputedStyle(el).opacity), y: el.getBoundingClientRect().y });
    if (performance.now() < end) requestAnimationFrame(tick); else resolve(out);
  };
  requestAnimationFrame(tick);
}), ms);

test('splash bez opice: po studeném startu opice jednou doskočí na aktuální uzel, návrat na tab už ne', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dev');
  const intro = page.getByTestId('splash');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('splash-head')).toHaveCount(0);
  await expect(intro).toHaveCount(0, { timeout: 10_000 });
  await visible(page.getByText(/Load demo profile/i)).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });

  // Studený start nad mapou: během splashe je opice schovaná, po něm doskočí shora na svůj uzel.
  await page.reload();
  await expect(intro).toBeVisible({ timeout: 30_000 });
  await expect(intro).toHaveCount(0, { timeout: 10_000 });
  const hop = await sampleMascot(page, 1400);
  expect(hop.length).toBeGreaterThan(10);
  const last = hop[hop.length - 1]!;
  expect(last.o).toBe(1);
  // Přiletěla shora (nad svým místem), ne že by stála.
  expect(Math.min(...hop.map((s) => s.y))).toBeLessThan(last.y - 30);
  const box = await page.getByTestId('map-mascot').first().boundingBox();
  const vp = page.viewportSize()!;
  expect(box && box.y > 0 && box.y + box.height < vp.height).toBe(true);

  // Návrat na tab: žádný skok, opice stojí.
  await gotoTab(page, 'league');
  await gotoTab(page, '');
  const again = await sampleMascot(page, 700);
  const ys = again.map((s) => s.y);
  expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(2);
  expect(again.every((s) => s.o === 1)).toBe(true);
  expect(errors).toEqual([]);
});
