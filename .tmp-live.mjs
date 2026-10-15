import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath: 'C:/Users/david/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8084/', { waitUntil: 'domcontentloaded', timeout: 300000 });
await p.waitForSelector('[data-testid="map-mascot"]', { timeout: 300000 });
console.log('map ready');
const seen = []; const t0 = Date.now();
while (Date.now() - t0 < 90000) {
  const ids = await p.evaluate(() => [...document.querySelectorAll('[data-testid^="map-act-"]')].map(e => e.getAttribute('data-testid')));
  for (const id of ids) if (!seen.find(s => s.id === id && Date.now() - s.at < 5000)) { seen.push({ id, at: Date.now(), t: ((Date.now()-t0)/1000).toFixed(1) }); const m = await p.$('[data-testid="map-mascot"]'); const bb = await m.boundingBox(); await p.screenshot({ path: 'C:/Users/david/AppData/Local/Temp/claude/C--Users-david-desktop-opice/75ff8d84-32e8-4223-a65a-8164fbd9073c/scratchpad/live/' + id + '.png', clip: { x: Math.max(0,bb.x-60), y: Math.max(0,bb.y-60), width: 180, height: 180 } }); }
  await p.waitForTimeout(400);
}
console.log(JSON.stringify(seen.map(s => s.t + 's ' + s.id)));
const m = await p.$('[data-testid="map-mascot"]'); console.log('mascot box', JSON.stringify(await m.boundingBox()));
await p.screenshot({ path: 'C:/Users/david/AppData/Local/Temp/claude/C--Users-david-desktop-opice/75ff8d84-32e8-4223-a65a-8164fbd9073c/scratchpad/live/map.png' });
await b.close();
