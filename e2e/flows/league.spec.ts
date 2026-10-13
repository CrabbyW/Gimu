import { expect, test } from '../fixtures';
import { collectErrors, gotoTab, loadDemo, visible } from '../helpers';

test('liga: pódium (3 sloupce) nad tabulkou', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  await gotoTab(page, 'league');
  const podium = visible(page.getByTestId('league-podium'));
  await expect(podium).toBeVisible();
  const cols = podium.getByTestId('podium-column');
  await expect(cols).toHaveCount(3);
  const firstRow = visible(page.getByTestId('league-row'));
  const pb = await podium.boundingBox();
  const rb = await firstRow.boundingBox();
  expect(pb && rb && pb.y + pb.height <= rb.y + 1).toBeTruthy();
  expect(errors).toEqual([]);
});

for (const width of [320, 430]) {
  test(`liga: jména na pódiu nejsou oříznutá (w${width})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await loadDemo(page);
    await gotoTab(page, 'league');
    const names = visible(page.getByTestId('league-podium')).getByTestId('podium-name');
    await expect(names).toHaveCount(3);
    const clipped = await names.evaluateAll((els) => els
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
      .map((el) => el.textContent));
    expect(clipped).toEqual([]);
    await expect(names.filter({ hasText: /Jake_\u200B?Pullup/ })).toHaveCount(1);
  });
}
