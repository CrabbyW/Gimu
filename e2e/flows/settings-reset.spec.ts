import { expect, test } from '../fixtures';
import { loadDemo, resetApp, waitForIdle } from '../helpers';

test('nastavení: reset → onboarding a data pryč', async ({ page }) => {
  await loadDemo(page);
  await resetApp(page);
  await expect(page).toHaveURL(/\/onboarding\/path/);
  // Persist: po reloadu se nevrátí mapa.
  await page.goto('/');
  await waitForIdle(page, 200);
  await page.waitForURL(/\/onboarding\/path/);
});
