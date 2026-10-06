// Statický server produkčního webového buildu (`npx expo export --platform web` → dist/) pro měření výkonu.
// Dev server posílá nezmenšený ~16MB bundle a měření času do interakce by neodpovídalo skutečné appce.
// Bez závislostí; SPA fallback na index.html (expo-router web output „single“).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PERF_PORT ?? 8083);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};

async function file(path) {
  try { const s = await stat(path); return s.isFile() ? path : null; } catch { return null; }
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const safe = normalize(url).replace(/^(\.\.[\\/])+/, '');
  const target = (await file(join(ROOT, safe))) ?? join(ROOT, 'index.html');
  try {
    const body = await readFile(target);
    res.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(PORT, () => console.log(`dist on http://localhost:${PORT}`));
