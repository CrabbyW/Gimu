import { expect, test } from '../fixtures';
import type { Page } from '@playwright/test';
import { loadDemo, pill, waitForIdle } from '../helpers';

/** Měření (spec elite fáze 0 §3.1): počet <canvas>, fps animací (rAF sampler), čas do interakce mapy.
 *  Bez Reduce Motion: měříme skutečné animace. Web dev build je reference, ne cíl pro telefon. */
const MAX_CANVAS = 12;
const MIN_FPS = Number(process.env.E2E_MIN_FPS ?? 55);
const MAX_TTI_MS = 3000;

const canvasCount = (page: Page) => page.evaluate(() => document.querySelectorAll('canvas').length);

/** Medián fps po 5 s: počítá snímky rAF v oknech po 500 ms. */
const sampleFps = (page: Page, ms = 5000) =>
  page.evaluate((duration) => new Promise<number>((resolve) => {
    const windows: number[] = [];
    let frames = 0;
    let winStart = performance.now();
    const end = winStart + duration;
    const tick = (t: number) => {
      frames++;
      if (t - winStart >= 500) { windows.push((frames * 1000) / (t - winStart)); frames = 0; winStart = t; }
      if (t < end) requestAnimationFrame(tick);
      else { windows.sort((a, b) => a - b); resolve(windows[Math.floor(windows.length / 2)] ?? 0); }
    };
    requestAnimationFrame(tick);
  }), ms);

test.describe('perf', () => {
  test.beforeEach(async ({ page }) => { await loadDemo(page); });

  test(`<canvas> ≤ ${MAX_CANVAS} na každé obrazovce`, async ({ page }) => {
    const counts: Record<string, number> = {};
    for (const path of ['/', '/league', '/progress', '/season', '/profile', '/settings']) {
      await page.goto(path);
      await waitForIdle(page, 1500);
      counts[path] = await canvasCount(page);
    }
    await page.goto('/');
    await pill(page, 'Start lesson').click();
    await page.waitForURL(/\/lesson\//);
    await waitForIdle(page, 1500);
    counts['/lesson'] = await canvasCount(page);
    test.info().annotations.push({ type: 'canvas', description: JSON.stringify(counts) });
    for (const [path, n] of Object.entries(counts)) expect(n, `${path}: ${n} canvasů`).toBeLessThanOrEqual(MAX_CANVAS);
  });

  test(`mapa: čas do [START LESSON] ≤ ${MAX_TTI_MS} ms`, async ({ page }) => {
    // Bundle je po loadDemo v cache prohlížeče; měří se navigace → interaktivní CTA.
    const t0 = Date.now();
    await page.goto('/', { waitUntil: 'commit' });
    await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
    await expect(pill(page, 'Start lesson')).toBeEnabled();
    const ms = Date.now() - t0;
    test.info().annotations.push({ type: 'tti-ms', description: String(ms) });
    expect(ms).toBeLessThanOrEqual(MAX_TTI_MS);
  });

  test(`mapa: medián fps ≥ ${MIN_FPS}`, async ({ page }) => {
    await page.goto('/');
    await expect(pill(page, 'Start lesson')).toBeVisible();
    const fps = await sampleFps(page);
    test.info().annotations.push({ type: 'fps-map', description: fps.toFixed(1) });
    expect(fps).toBeGreaterThanOrEqual(MIN_FPS);
  });

  test(`mapa: pull-to-refresh (tah + točení hlavy) medián fps ≥ ${MIN_FPS}`, async ({ page }) => {
    await page.goto('/');
    await expect(pill(page, 'Start lesson')).toBeVisible();
    await waitForIdle(page, 900);
    const vp = page.viewportSize()!;
    await page.mouse.move(28, vp.height * 0.4);
    for (let i = 0; i < 10; i++) await page.mouse.wheel(0, -2000);
    await page.waitForTimeout(400);
    await page.mouse.down();
    // Tah (≈ 500 ms) a hned po puštění točení (min. 600 ms): fps přes obojí.
    const during = sampleFps(page, 1100);
    for (let i = 1; i <= 24; i++) { await page.mouse.move(28, vp.height * 0.4 + i * 12); await page.waitForTimeout(16); }
    await page.mouse.up();
    const fps = await during;
    test.info().annotations.push({ type: 'fps-ptr', description: fps.toFixed(1) });
    expect(fps).toBeGreaterThanOrEqual(MIN_FPS);
  });

  test(`lekce (smyčka siluety): medián fps ≥ ${MIN_FPS}`, async ({ page }) => {
    await pill(page, 'Start lesson').click();
    await page.waitForURL(/\/lesson\//);
    await expect(page.locator('[data-testid^="silhouette-"]').first()).toBeVisible();
    await waitForIdle(page, 800);
    const fps = await sampleFps(page);
    test.info().annotations.push({ type: 'fps-lesson', description: fps.toFixed(1) });
    expect(fps).toBeGreaterThanOrEqual(MIN_FPS);
  });

  test(`oslava: medián fps ≥ ${MIN_FPS}`, async ({ page }) => {
    await pill(page, 'Start lesson').click();
    await page.waitForURL(/\/lesson\//);
    const cont = pill(page, 'Continue');
    // Doklikat až těsně před oslavu; vzorkovat hned, jak naskočí (animace kotouče a opice).
    for (let i = 0; i < 40 && !(await cont.isVisible()); i++) {
      const start = pill(page, 'Start');
      if (await start.isVisible()) await start.click();
      const skip = pill(page, 'Skip');
      if (await skip.isVisible()) await skip.click();
      await page.waitForTimeout(150);
    }
    const fps = await sampleFps(page);
    test.info().annotations.push({ type: 'fps-celebration', description: fps.toFixed(1) });
    expect(fps).toBeGreaterThanOrEqual(MIN_FPS);
  });
});
