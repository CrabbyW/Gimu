import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fontScale, tabularNums, tabularVariants, type as typography, typeMaxScale } from '@/theme/tokens';
import { PATHS } from '@/data/paths';

/** Elite fáze 4: všechna čísla mají tabulární číslice ze stylu v theme; Doto má strop zvětšení. */
const NUMERIC = ['hero', 'heroShort', 'displayXL', 'display', 'dotStat', 'dotTitleShort', 'stat', 'counter', 'telemetry', 'label', 'pill', 'badgeLabel'] as const;

test('číselné stupně typografie jsou tabulární', () => {
  for (const v of NUMERIC) expect(tabularVariants[v]).toBe(true);
  expect(tabularNums.fontVariant).toEqual(['tabular-nums']);
});

test('každý stupeň Doto má maxFontSizeMultiplier ≤ 1.3 a velikost ≥ 28 pt', () => {
  for (const [k, t] of Object.entries(typography)) {
    if (t.fontFamily !== typography.hero.fontFamily) continue;
    expect(t.fontSize).toBeGreaterThanOrEqual(28);
    const cap = typeMaxScale[k as keyof typeof typography];
    expect(cap).toBeDefined();
    expect(cap!).toBeLessThanOrEqual(1.3);
  }
});

const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (f === '__tests__' || f === 'node_modules') return [];
  return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : [];
});

test('`tabular-nums` se nepíše natvrdo mimo theme (jediný zdroj `tabularNums`)', () => {
  const root = join(__dirname, '..', '..');
  const offenders = ['app', 'components'].flatMap((d) => walk(join(root, d))).filter((p) => readFileSync(p, 'utf8').includes("'tabular-nums'"));
  expect(offenders).toEqual([]);
});

test('čísla v definovaných komponentách používají tabularNums (liga, pódium, lekce, oslava, comeback)', () => {
  const root = join(__dirname, '..', '..');
  for (const f of ['app/(tabs)/league.tsx', 'components/league/Podium.tsx', 'app/lesson/[id].tsx', 'components/lesson/LessonCompleteScene.tsx', 'components/season/ComebackCard.tsx', 'components/ui/TopBar.tsx', 'components/ui/SectionLabel.tsx']) {
    expect(readFileSync(join(root, f), 'utf8')).toMatch(/tabularNums/);
  }
});

test('jednořádkový Doto titulek se nezmenší pod 28 pt a názvy sekcí se vejdou do 320 pt při 28 pt', () => {
  expect(typography.display.fontSize * fontScale.titleMin).toBeGreaterThanOrEqual(28);
  for (const p of Object.values(PATHS)) for (const s of p.sections) {
    expect(s.title.length * fontScale.dotAdvance * 28).toBeLessThanOrEqual(320 - 48);
  }
});
