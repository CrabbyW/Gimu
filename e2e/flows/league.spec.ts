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
