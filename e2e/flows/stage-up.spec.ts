import { expect, test } from '../fixtures';
import { collectErrors, loadDemo, pill, visible, waitForIdle } from '../helpers';

test('stage-up: dev stage → /stage-up → continue', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  await page.goto('/dev');
  await waitForIdle(page, 200);
  const stageBtn = visible(page.getByText(/Monkey stage:/));
  await expect(stageBtn).toHaveText(/auto/);
  await stageBtn.click();
  await expect(stageBtn).toHaveText(/Monkey stage: 1/);

  await page.goto('/stage-up?from=1&to=2');
  await waitForIdle(page, 200);
  await expect(visible(page.getByText('Your monkey is growing.'))).toBeVisible();
  await pill(page, 'Continue').click();
  await expect(page).not.toHaveURL(/stage-up/, { timeout: 15_000 });
  expect(errors).toEqual([]);
});
