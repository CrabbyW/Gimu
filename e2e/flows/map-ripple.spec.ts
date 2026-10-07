import { expect, test } from '../fixtures';
import { collectErrors, loadDemo, waitForIdle } from '../helpers';

/** Dluh z elite fáze 0: tah po tečkovém pozadí mapy rozvlní tečky (pixely plátna se změní oproti klidu).
 *  Porovnává výřez snímku v okolí prstu: klid × během tahu. */
test('mapa: tah po pozadí změní pixely tečkového pole', async ({ page }) => {
  const errors = collectErrors(page);
  await loadDemo(page);
  await waitForIdle(page, 900);

  const vp = page.viewportSize()!;
  // Pravý okraj pod hlavičkou: mimo uzly cesty i CTA (cesta vede středem).
  const x = vp.width - 24;
  const y = Math.round(vp.height * 0.45);
  const clip = { x: x - 60, y: y - 60, width: 56, height: 120 };

  const rest = await page.screenshot({ clip });
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x - i * 4, y + i * 6, { steps: 2 });
  const during = await page.screenshot({ clip });
  await page.mouse.up();

  expect(Buffer.compare(rest, during)).not.toBe(0);
  expect(errors).toEqual([]);
});
