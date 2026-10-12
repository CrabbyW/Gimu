// Vyrenderuje nativní splash a ikony z geometrie opice v2 (plán vast-snuggling-sunbeam, krok 3).
// Použití: `npm run gen:splash` (Chrome přes Playwright, CHROME_PATH jako v e2e).
// Čísla = `components/mascot/monkeyGeometry.ts` (V2: hlava, uši, obličej, oči) a dark paleta `theme/palettes.ts`
// (mascotFur/Face/Eye, base); výřez = `dots.splash.view` v `theme/tokens.ts`. Při změně geometrie spusť znovu.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

export const V2_HEAD = {
  head: { cx: 100, cy: 66, r: 42 },
  ears: { dx: 42, dy: -4, r: 18 },
  face: 'M100 55 C93 41 67 41 66 62 C65 81 87 95 100 104 C113 95 135 81 134 62 C133 41 107 41 100 55 Z',
  eyes: { dx: 12, cy: 69, rx: 5, ry: 7 },
};
export const DARK = { base: '#0B0B0C', fur: '#E9EBEE', face: '#3A3C40', eye: '#E9EBEE' };
/** Výřez viewBoxu kolem hlavy (x, y, strana) = `dots.splash.view`. */
export const VIEW = [34, 0, 132];

/** SVG hlavy: `scale` = podíl strany obrázku, který zabere výřez (1 = splash, menší = ikona s okrajem). */
export function headSvg({ size, scale = 1, background = null, mono = false }) {
  const [x, y, side] = VIEW;
  const full = side / scale;
  const vx = x - (full - side) / 2, vy = y - (full - side) / 2;
  const { head, ears, face, eyes } = V2_HEAD;
  const fur = mono ? '#FFFFFF' : DARK.fur;
  const bg = background ? `<rect x="${vx}" y="${vy}" width="${full}" height="${full}" fill="${background}"/>` : '';
  // Monochromní ikona: obličej a oči jako výřez (maska), ne barva.
  const inner = mono
    ? `<mask id="m"><rect x="${vx}" y="${vy}" width="${full}" height="${full}" fill="white"/><path d="${face}" fill="black"/></mask>
       <g mask="url(#m)"><circle cx="${head.cx - ears.dx}" cy="${head.cy + ears.dy}" r="${ears.r}" fill="${fur}"/><circle cx="${head.cx + ears.dx}" cy="${head.cy + ears.dy}" r="${ears.r}" fill="${fur}"/><circle cx="${head.cx}" cy="${head.cy}" r="${head.r}" fill="${fur}"/></g>
       <ellipse cx="${head.cx - eyes.dx}" cy="${eyes.cy}" rx="${eyes.rx}" ry="${eyes.ry}" fill="${fur}"/><ellipse cx="${head.cx + eyes.dx}" cy="${eyes.cy}" rx="${eyes.rx}" ry="${eyes.ry}" fill="${fur}"/>`
    : `<circle cx="${head.cx - ears.dx}" cy="${head.cy + ears.dy}" r="${ears.r}" fill="${fur}"/>
       <circle cx="${head.cx + ears.dx}" cy="${head.cy + ears.dy}" r="${ears.r}" fill="${fur}"/>
       <circle cx="${head.cx}" cy="${head.cy}" r="${head.r}" fill="${fur}"/>
       <path d="${face}" fill="${DARK.face}"/>
       <ellipse cx="${head.cx - eyes.dx}" cy="${eyes.cy}" rx="${eyes.rx}" ry="${eyes.ry}" fill="${DARK.eye}"/>
       <ellipse cx="${head.cx + eyes.dx}" cy="${eyes.cy}" rx="${eyes.rx}" ry="${eyes.ry}" fill="${DARK.eye}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vx} ${vy} ${full} ${full}">${bg}${inner}</svg>`;
}

const OUT = [
  // Nativní splash: průhledné pozadí, výřez přes celý obrázek (app.json `imageWidth` = `dots.splash.head`).
  { file: 'assets/splash-icon.png', svg: headSvg({ size: 1024 }) },
  // iOS ikona: hlava na dark base s okrajem.
  { file: 'assets/icon.png', svg: headSvg({ size: 1024, scale: 0.66, background: DARK.base }) },
  // Android adaptivní ikona: popředí v bezpečné zóně (66 % → hlava ~ 50 %), pozadí plné, monochrom = silueta.
  { file: 'assets/android-icon-foreground.png', svg: headSvg({ size: 1024, scale: 0.5 }) },
  { file: 'assets/android-icon-background.png', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${DARK.base}"/></svg>` },
  { file: 'assets/android-icon-monochrome.png', svg: headSvg({ size: 1024, scale: 0.5, mono: true }) },
];

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  for (const o of OUT) {
    await page.setContent(`<html><body style="margin:0;background:transparent">${o.svg}</body></html>`);
    await page.locator('svg').screenshot({ path: path.join(ROOT, o.file), omitBackground: true });
    console.log('ok', o.file);
  }
  await browser.close();
}
