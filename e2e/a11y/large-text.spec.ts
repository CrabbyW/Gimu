import { expect, test } from '../fixtures';
import { applyFontScale, lastTextCount, textCollisions } from '../textGeometry';
import { openScreen, SCREENS } from './screens';

/** Velké písmo (elite fáze 4 spec §2.2/§3): 1.4× (strop `typeMaxScale` jako iOS) na w320 a w390 —
 *  žádný viditelný text se nepřekrývá s jiným ani nepřetéká viewport do stran. Běží v projektech w320-dark, w390-dark. */
const SCALE = 1.4;

for (const s of SCREENS) {
  test(`velké písmo 1.4×: ${s.name}`, async ({ page }) => {
    await openScreen(page, s);
    await applyFontScale(page, SCALE);
    expect(await textCollisions(page)).toEqual([]);
    expect(await lastTextCount(page)).toBeGreaterThan(3);
  });
}
