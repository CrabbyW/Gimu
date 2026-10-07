import type { Page } from '@playwright/test';

/** Sdílená geometrie textů (elite fáze 4; vytaženo z `flows/mascot-line.spec.ts`).
 *  Texty, které leží pod plochou `box` (nebo kdekoli, když `box` chybí, kolidují mezi sebou), počítají se jen
 *  viditelné (žádný předek s opacity 0, `aria-hidden` ani mimo layout). */
export interface Box { x: number; y: number; width: number; height: number }

/** Viditelné texty, jejichž řádky zasahují do `box` (mimo prvek `exclude`). */
export async function textsUnder(page: Page, box: Box, excludeSelector?: string) {
  return page.evaluate(([b, sel]) => {
    const ex = sel ? document.querySelector(sel as string) : null;
    const seen = (el: Element | null): boolean => {
      for (let e = el; e; e = e.parentElement) if (Number(getComputedStyle(e).opacity) === 0) return false;
      return true;
    };
    const r0 = b as { x: number; y: number; width: number; height: number };
    const hits: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      const text = (n.textContent ?? '').trim();
      if (!el || !text || ex?.contains(el) || !seen(el)) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width && r.height && r.left < r0.x + r0.width && r.right > r0.x && r.top < r0.y + r0.height && r.bottom > r0.y) hits.push(text);
      }
    }
    return hits;
  }, [box, excludeSelector ?? null] as const);
}

/** Simulace systémového zvětšení písma na webu: RN-web velikost nezvětšuje, takže ji zvětšíme v DOM
 *  podle stropu `data-fs` (`typeMaxScale` z theme), přesně jak by to udělal iOS. Prvky s `data-fit`
 *  (adjustsFontSizeToFit) se na nativu zmenší do šířky, tady zůstanou na své velikosti. */
export async function applyFontScale(page: Page, scale: number) {
  await page.evaluate((k) => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-fs]'))) {
      if (el.dataset.scaled) continue;
      el.dataset.scaled = '1';
      const cap = Number(el.dataset.fs) || k;
      const f = el.dataset.fit === '1' ? 1 : Math.min(k, cap);
      const cs = getComputedStyle(el);
      el.style.fontSize = `${parseFloat(cs.fontSize) * f}px`;
      const lh = parseFloat(cs.lineHeight);
      if (Number.isFinite(lh)) el.style.lineHeight = `${lh * f}px`;
    }
  }, scale);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))));
}

/** Kolize a přetečení viditelných textů ve viewportu: dvojice textových řádků, které se překrývají
 *  (víc než `tol` px v obou osách), a texty, které vyjedou z viewportu do stran. Vrací popisy nálezů. */
export async function textCollisions(page: Page, tol = 1) {
  return page.evaluate((t) => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const shown = (el: Element | null): boolean => {
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (Number(cs.opacity) === 0 || cs.visibility === 'hidden' || e.getAttribute('aria-hidden') === 'true') return false;
      }
      return true;
    };
    // Ořez předky s overflow ≠ visible (ellipsis `numberOfLines`, vodorovný ScrollView): na nativu text
    // za hranou kontejneru neexistuje, rect textu se proto zařízne na průnik ořezů.
    const clipOf = (el: Element) => {
      let l = -Infinity, t0 = -Infinity, r = Infinity, b = Infinity;
      for (let e: Element | null = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          const q = e.getBoundingClientRect();
          if (cs.overflowX !== 'visible') { l = Math.max(l, q.left); r = Math.min(r, q.right); }
          if (cs.overflowY !== 'visible') { t0 = Math.max(t0, q.top); b = Math.min(b, q.bottom); }
        }
      }
      return { l, t: t0, r, b };
    };
    // Zakrytý text (pod neprůhlednou lištou CTA, pod závojem…) se nečte ani nekoliduje: rozhoduje prvek navrchu.
    const opaque = (e: Element) => {
      const bg = getComputedStyle(e).backgroundColor;
      return bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg);
    };
    const onTop = (el: Element, r: { left: number; right: number; top: number; bottom: number }) => {
      const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
      if (x < 0 || y < 0 || x >= vw || y >= vh) return true;
      // Shora dolů: první prvek, který je text sám nebo jeho předek/potomek = viditelný; neprůhledný cizí prvek dřív = zakrytý.
      for (const h of document.elementsFromPoint(x, y)) {
        if (h === el || el.contains(h) || h.contains(el)) return true;
        if (opaque(h)) return false;
      }
      return true;
    };
    (window as unknown as { __textCount: number }).__textCount = 0;
    const items: { text: string; el: Element; r: { left: number; right: number; top: number; bottom: number } }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      const text = (n.textContent ?? '').trim();
      if (!el || !text || !shown(el)) continue;
      const c = clipOf(el);
      const range = document.createRange(); range.selectNodeContents(n);
      for (const q of Array.from(range.getClientRects())) {
        const r = { left: Math.max(q.left, c.l), right: Math.min(q.right, c.r), top: Math.max(q.top, c.t), bottom: Math.min(q.bottom, c.b) };
        if (r.right - r.left <= t || r.bottom - r.top <= t || r.bottom <= 0 || r.top >= vh) continue;
        if (!onTop(el, r)) continue;
        items.push({ text, el, r });
        (window as unknown as { __textCount: number }).__textCount++;
      }
    }
    const out: string[] = [];
    for (const a of items) if (a.r.left < -t || a.r.right > vw + t) out.push(`přetéká: „${a.text}“`);
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!, b = items[j]!;
      if (a.el === b.el) continue;
      const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ox > t && oy > t) out.push(`kolize: „${a.text}“ × „${b.text}“`);
    }
    return out;
  }, tol);
}

/** Počet viditelných textových řádků z posledního `textCollisions` (pojistka, že kontrola něco viděla). */
export const lastTextCount = (page: Page) => page.evaluate(() => (window as unknown as { __textCount: number }).__textCount);
