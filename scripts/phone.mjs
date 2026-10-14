// Telefon (Expo Go mimo Wi-Fi) jedním příkazem: `npm run phone`.
// Cloudflare quick tunel → demo server (EXPO_PUBLIC_DEMO=1) na 8084 → předehřátí iOS + Android bundlu přes tunel
// → kontrola $TEMP/expogo.log (ERROR = selhání) → odkaz exps://… a QR (phone-qr.png, je-li k dispozici python segno).
// Procesy běží odpojeně dál; PID jsou v .phone.json. `npm run phone -- stop` je ukončí. Port 8082 se nepoužívá.
import { spawn, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, openSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STATE = '.phone.json';
const PORT = 8084;
const LOG = join(process.env.TEMP ?? tmpdir(), 'expogo.log');
const CF_DIR = join(process.env.LOCALAPPDATA ?? tmpdir(), 'opice-cloudflared');
const CF = join(CF_DIR, process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kill = (pid) => { try { execSync(process.platform === 'win32' ? `taskkill /PID ${pid} /F /T` : `kill ${pid}`, { stdio: 'ignore' }); } catch { /* už neběží */ } };

if (process.argv[2] === 'stop') {
  if (existsSync(STATE)) { const s = JSON.parse(readFileSync(STATE, 'utf8')); kill(s.server); kill(s.tunnel); writeFileSync(STATE, '{}'); }
  console.log('Telefon zastaven.');
  process.exit(0);
}

// Předchozí běh pryč (jen vlastní procesy z .phone.json).
if (existsSync(STATE)) { const s = JSON.parse(readFileSync(STATE, 'utf8')); if (s.server) kill(s.server); if (s.tunnel) kill(s.tunnel); }

if (!existsSync(CF)) {
  mkdirSync(CF_DIR, { recursive: true });
  const asset = process.platform === 'win32' ? 'cloudflared-windows-amd64.exe' : 'cloudflared-linux-amd64';
  console.log('Stahuji cloudflared…');
  execSync(`curl -sL -o "${CF}" https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`);
}

const cfLog = join(tmpdir(), 'opice-cloudflared.log');
const tunnel = spawn(CF, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], { detached: true, stdio: ['ignore', openSync(cfLog, 'w'), openSync(cfLog, 'a')] });
tunnel.unref();
let url = null;
for (let i = 0; i < 60 && !url; i++) { await sleep(1000); url = (readFileSync(cfLog, 'utf8').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/) ?? [])[0] ?? null; }
if (!url) { console.error('Tunel nenaběhl, viz ' + cfLog); kill(tunnel.pid); process.exit(1); }

const server = spawn('npx', ['expo', 'start', '--port', String(PORT)], {
  detached: true, shell: true, stdio: ['ignore', openSync(LOG, 'w'), openSync(LOG, 'a')],
  env: { ...process.env, EXPO_PUBLIC_DEMO: '1', EXPO_PACKAGER_PROXY_URL: url },
});
server.unref();
writeFileSync(STATE, JSON.stringify({ tunnel: tunnel.pid, server: server.pid, url }, null, 2));

const ok = async (u, init) => { try { const r = await fetch(u, init); return r.ok; } catch { return false; } };
for (let i = 0; i < 90 && !(await ok(`http://localhost:${PORT}/status`)); i++) await sleep(2000);
const q = 'dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable';
// Studený build trvá i přes 100 s a Cloudflare tunel delší požadavek utne (524/530) → předehřát přes localhost, pak ověřit tunel.
for (const p of ['ios', 'android']) await ok(`http://localhost:${PORT}/index.bundle?platform=${p}&${q}`);
for (const p of ['ios', 'android']) {
  const m = await ok(url, { headers: { 'expo-platform': p, accept: 'application/expo+json' } });
  const b = (await ok(`${url}/index.bundle?platform=${p}&${q}`)) || (await ok(`${url}/index.bundle?platform=${p}&${q}`));
  console.log(`${p}: manifest ${m ? 'OK' : 'CHYBA'}, bundle ${b ? 'OK' : 'CHYBA'}`);
  if (!m || !b) process.exitCode = 1;
}
const errors = readFileSync(LOG, 'utf8').split('\n').filter((l) => l.includes('ERROR'));
console.log(`expogo.log: ${errors.length} × ERROR`);
if (errors.length) { console.log(errors.slice(0, 5).join('\n')); process.exitCode = 1; }

const link = url.replace('https://', 'exps://');
try { execSync(`python -c "import segno; segno.make('${link}', error='m').save('phone-qr.png', scale=12, border=4)"`, { stdio: 'ignore' }); console.log('QR: phone-qr.png'); }
catch { console.log('QR se nevytvořil (chybí python segno) — použij odkaz.'); }
console.log(`\nOdkaz pro Expo Go: ${link}\nZastavení: npm run phone -- stop`);
process.exit();
