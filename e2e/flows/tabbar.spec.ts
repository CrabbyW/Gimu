import { expect, test } from '../fixtures';
import { loadDemo, visible } from '../helpers';

const ORDER = ['/', '/league', '/progress', '/season', '/profile'];

test('tab bar: 1 klik přepne každý tab', async ({ page }) => {
  await loadDemo(page);
  const tabs = page.getByRole('tab').filter({ visible: true });
  await expect(tabs).toHaveCount(ORDER.length);
  for (const i of [1, 2, 3, 4, 0]) {
    await tabs.nth(i).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(ORDER[i]);
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
  }
});

test('tab bar: tah z 1. na 3. slot přepne až po puštění', async ({ page }) => {
  await loadDemo(page);
  const tabs = page.getByRole('tab').filter({ visible: true });
  const a = await tabs.nth(0).boundingBox();
  const b = await tabs.nth(2).boundingBox();
  if (!a || !b) throw new Error('tab bez rozměrů');
  const y = a.y + a.height / 2;
  await page.mouse.move(a.x + a.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, y, { steps: 12 });
  await page.waitForTimeout(200);
  expect(new URL(page.url()).pathname).toBe('/');
  await page.mouse.up();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/progress');
  await expect(visible(page.getByRole('tab', { name: /Progress/i }))).toHaveAttribute('aria-selected', 'true');
});
