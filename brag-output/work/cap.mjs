import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [,, mode, ...ts] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--proxy-server='+process.env.HTTPS_PROXY,'--ignore-certificate-errors-spki-list'] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto('file://' + process.cwd() + '/index.html');
await pg.evaluate(() => window.ready);
await pg.evaluate(() => document.fonts.ready);
const fonts = await pg.evaluate(() => [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family));
console.log('fonts', fonts.join(','));
if (mode === 'stills') for (const t of ts) { await pg.evaluate(t => render(+t), t); await pg.screenshot({ path: `still-${t}.png` }); }
else { const n = 600; for (let i = 0; i < n; i++) { await pg.evaluate(t => render(t), i / 30); await pg.screenshot({ path: `frames/f${String(i).padStart(4,'0')}.jpg`, type:'jpeg', quality: 95 }); } }
await b.close();
