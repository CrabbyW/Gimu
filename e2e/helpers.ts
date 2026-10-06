import { expect, type Locator, type Page } from '@playwright/test';

export type TabKey = '' | 'league' | 'progress' | 'season' | 'profile';

/** Viditelný prvek (expo-router drží předchozí obrazovky stacku v DOM, skryté). */
export const visible = (l: Locator) => l.filter({ visible: true }).first();

/** Pill CTA appky (`[START LESSON]`, `[SKIP]`, `[CONTINUE]`). */
export const pill = (page: Page, label: string) =>
  visible(page.getByText(`[${label.toUpperCase()}]`, { exact: true }));

/** Klidový stav pro snímek/assert: fonty, CanvasKit (Skia na webu), doběhlé animace.
 *  Reduce Motion emuluj před `goto` přes `useReducedMotion(page)`, tady jen čekáme. */
export async function waitForIdle(page: Page, settleMs = 600) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.waitForFunction(() => Boolean((globalThis as { CanvasKit?: unknown }).CanvasKit), undefined, { timeout: 60_000 });
  // Dva snímky rAF: layout po načtení fontů se usadí.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))));
  await page.waitForTimeout(settleMs);
}

export async function useReducedMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** /dev → „Load demo profile“ → mapa (`/`). */
export async function loadDemo(page: Page) {
  await page.goto('/dev');
  await waitForIdle(page, 200);
  await visible(page.getByText(/Load demo profile/i)).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  await expect(pill(page, 'Start lesson')).toBeVisible({ timeout: 30_000 });
}

/** Settings → Data → „Reset app“ → potvrzení (na webu `globalThis.confirm`). */
export async function resetApp(page: Page) {
  page.once('dialog', (d) => void d.accept());
  await page.goto('/settings');
  await waitForIdle(page, 200);
  const reset = visible(page.getByRole('button', { name: /Reset app/i }));
  await reset.scrollIntoViewIfNeeded();
  await reset.click();
  await page.waitForURL(/\/onboarding\/path/, { timeout: 30_000 });
}

/** Klik na tab plovoucí lišty podle cesty. */
export async function gotoTab(page: Page, tab: TabKey) {
  const names: Record<TabKey, RegExp> = { '': /Train/i, league: /League/i, progress: /Progress/i, season: /Season/i, profile: /Profile/i };
  await visible(page.getByRole('tab', { name: names[tab] })).click();
  await page.waitForURL((u) => u.pathname === `/${tab}`, { timeout: 15_000 });
}

/** Chyby stránky sbírané během testu (pageerror = pád JS). */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Posune `Date` tak, aby appka „začala“ v pevném okamžiku, ale čas dál běžel.
 *  (`page.clock.setFixedTime` zmrazí `Date.now` a vstupní animace Reanimated na webu nedoběhnou.) */
export async function shiftClock(page: Page, startAt: Date) {
  // Skript jako řetězec: transpilace TS by do funkce vložila helpery, které v prohlížeči neexistují.
  await page.addInitScript(`(() => {
    const RealDate = Date;
    const offset = ${startAt.getTime()} - RealDate.now();
    class ShiftedDate extends RealDate {
      constructor(...a) { if (a.length === 0) super(RealDate.now() + offset); else super(...a); }
      static now() { return RealDate.now() + offset; }
    }
    globalThis.Date = ShiftedDate;
  })();`);
}
