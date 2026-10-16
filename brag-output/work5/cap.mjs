// node cap.mjs <html> stills t1 t2 ...   |   node cap.mjs <html> full <sekundy> <podsnímky> <složka>
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [,, html, mode, ...rest] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--proxy-server=' + process.env.HTTPS_PROXY, '--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', e => console.log('PAGEERROR', e.message));
await pg.goto('file://' + process.cwd() + '/' + html);
await pg.evaluate(() => window.ready);
const shot = async (t, path, opt = {}) => {
  await pg.evaluate(t => render(t), t);
  await pg.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  await pg.screenshot({ path, ...opt });
};
if (mode === 'stills') for (const t of rest) await shot(+t, `still-${html.replace('.html','')}-${t}.png`);
else {
  const [dur, sub, dir] = [+rest[0], +rest[1], rest[2]]; fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(dur * 30 * sub);
  for (let i = 0; i < n; i++) await shot(i / (30 * sub), `${dir}/f${String(i).padStart(5, '0')}.jpg`, { type: 'jpeg', quality: 92 });
}
await b.close();
