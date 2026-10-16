import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [,, mode, ...ts] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--proxy-server='+process.env.HTTPS_PROXY,'--allow-file-access-from-files'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto('file://' + process.cwd() + '/index.html');
await pg.evaluate(() => window.ready);
const shot = async (t, path, opt={}) => { await pg.evaluate(t => render(t), t); await pg.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))); await pg.screenshot({ path, ...opt }); };
if (mode === 'stills') for (const t of ts) await shot(+t, `still-${t}.png`);
else { for (let i = 0; i < 900; i++) await shot(i / 30, `frames/f${String(i).padStart(4,'0')}.jpg`, { type: 'jpeg', quality: 92 }); }
await b.close();
