import { expect, test } from '../fixtures';
import { collectErrors } from '../helpers';
import { openScreen, SCREENS } from './screens';

/** VoiceOver (elite fáze 4 spec §3): na každé hlavní obrazovce má každý viditelný `button`/`link`/`switch`/`tab`
 *  přístupné jméno a dekorativní plátna (Skia `canvas`, SVG bez role) jsou pro čtečku skrytá. */
for (const s of SCREENS) {
  test(`a11y popisky: ${s.name}`, async ({ page }) => {
    const errors = collectErrors(page);
    await openScreen(page, s);
    const report = await page.evaluate(() => {
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        for (let e: Element | null = el; e; e = e.parentElement) if (getComputedStyle(e).display === 'none') return false;
        return true;
      };
      const hidden = (el: Element) => Boolean(el.closest('[aria-hidden="true"]'));
      const name = (el: Element) => (el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? '').trim();
      const unnamed = Array.from(document.querySelectorAll('[role="button"],[role="link"],[role="switch"],[role="tab"],[role="radio"],button,a[href]'))
        .filter((el) => visible(el) && !hidden(el) && !name(el))
        .map((el) => el.outerHTML.slice(0, 160));
      // Dekorace: plátno nebo SVG, které není samo obrazem s popiskem a není uvnitř pojmenovaného prvku.
      const decorExposed = Array.from(document.querySelectorAll('canvas, svg'))
        .filter((el) => visible(el) && !hidden(el))
        .filter((el) => !el.closest('[aria-label],[role="img"],[role="image"]'))
        .map((el) => `${el.tagName} ${Array.from(el.parentElement?.attributes ?? []).map((a) => a.name).join(",")} ${el.parentElement?.parentElement?.getAttribute("data-testid") ?? ""}`);
      return { unnamed, decorExposed };
    });
    expect(report.unnamed).toEqual([]);
    expect(report.decorExposed).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('mapa: uzel ohlásí název, stav a minuty', async ({ page }) => {
  await openScreen(page, SCREENS.find((s) => s.name === 'map')!);
  const labels = await page.locator('[role="button"][aria-label]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
  expect(labels.some((l) => /min/i.test(l) && /(current|done|locked|next|completed)/i.test(l))).toBe(true);
});
