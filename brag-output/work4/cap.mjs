// Nahrávání appky ve skutečné rychlosti: čas appky je zpomalený R× (JS hodiny, rAF, časovače, CSS animace),
// snímky v plném rozlišení se ukládají s časem appky a později převzorkují na 30 fps.
import { chromium } from '/home/user/opice-new/node_modules/playwright/index.mjs';
import fs from 'node:fs';
export const R = 0.25;
const DILATE = `(() => { const R=${R};
  const pn=performance.now.bind(performance), S=pn(), RD=Date.now, SD=RD();
  const now=()=>S+(pn()-S)*R; performance.now=now; window.__appNow=now;
  const ND=()=>SD+(RD()-SD)*R; const OD=Date;
  class D extends OD{constructor(...a){ if(a.length) super(...a); else super(ND()); } static now(){return ND();} }
  window.Date=D;
  const raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=cb=>raf(()=>cb(now()));
  const st=window.setTimeout.bind(window), si=window.setInterval.bind(window);
  window.setTimeout=(f,d,...a)=>st(f,(d||0)/R,...a); window.setInterval=(f,d,...a)=>si(f,(d||0)/R,...a);
})();`;
export async function open() {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-device-scale-factor=3'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: 'dark' });
  await ctx.addInitScript(DILATE);
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: R });
  page.on('framenavigated', () => cdp.send('Animation.setPlaybackRate', { playbackRate: R }).catch(() => {}));
  const vis = l => l.filter({ visible: true }).first();
  // Nahraj `appSec` sekund času appky do složky `name` (index: čas appky → soubor).
  async function rec(name, appSec, clip) {
    fs.mkdirSync('raw/' + name, { recursive: true });
    const idx = []; const t0 = await page.evaluate(() => window.__appNow());
    for (let i = 0; ; i++) {
      const t = (await page.evaluate(() => window.__appNow()) - t0) / 1000;
      if (t > appSec) break;
      const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, optimizeForSpeed: true, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
      const f = `raw/${name}/${String(i).padStart(5, '0')}.jpg`; fs.writeFileSync(f, Buffer.from(s.data, 'base64')); idx.push([t, f]);
    }
    fs.writeFileSync(`raw/${name}.json`, JSON.stringify(idx)); console.log(name, idx.length, 'shots');
  }
  return { b, ctx, page, cdp, vis, rec, wait: (appMs) => page.waitForTimeout(appMs / R) };
}
