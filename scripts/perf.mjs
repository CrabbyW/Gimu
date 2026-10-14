// Výkon proti uložené referenci (CLAUDE.md „Ověřování je odstupňované“): žádná stavba staré verze ve worktree.
//   node scripts/perf.mjs baseline          → spustí e2e/perf (export webu + Playwright, workers 1) a zapíše e2e/perf/baseline.json
//   node scripts/perf.mjs compare [--grep X] → spustí totéž a porovná fps s referencí; exit 1, když metrika klesne pod 85 % reference
// Měří stejný stroj ve stejném stavu → reference má smysl jen pro tento stroj; po schváleném kole ji zapisuje QA.
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const mode = process.argv[2];
if (mode !== 'baseline' && mode !== 'compare') {
  console.error('použití: node scripts/perf.mjs baseline | compare [--grep <scéna>]');
  process.exit(2);
}
const gi = process.argv.indexOf('--grep');
const grep = gi > 0 ? process.argv[gi + 1] : null;
const BASE = 'e2e/perf/baseline.json';
const TOLERANCE = 0.85;

execSync('npx expo export --platform web', { stdio: 'inherit' });
const out = join(mkdtempSync(join(tmpdir(), 'perf-')), 'report.json');
const args = ['playwright', 'test', '-c', 'e2e/playwright.config.ts', '--project=perf-prod', '--workers', '1', '--reporter=json'];
if (grep) args.push('--grep', grep);
const run = spawnSync('npx', args, { encoding: 'utf8', shell: true, env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: out }, maxBuffer: 64 * 1024 * 1024 });
if (!existsSync(out)) { console.error(run.stdout?.slice(-2000), run.stderr?.slice(-2000)); process.exit(1); }

/** Metriky z anotací `fps-*` (popis „<číslo>“ nebo „<název> <číslo>“). */
const metrics = {};
const walk = (s) => {
  for (const spec of s.specs ?? []) for (const t of spec.tests ?? []) for (const r of t.results ?? [])
    for (const a of [...(r.annotations ?? []), ...(t.annotations ?? [])])
      if (a.type?.startsWith('fps-')) { const n = Number(String(a.description).trim().split(' ').pop()); if (Number.isFinite(n)) metrics[a.type] = n; }
  for (const c of s.suites ?? []) walk(c);
};
walk(JSON.parse(readFileSync(out, 'utf8')));
if (Object.keys(metrics).length === 0) { console.error('Žádné fps metriky — perf testy nedoběhly.'); process.exit(1); }
const commit = execSync('git rev-parse --short HEAD').toString().trim();

if (mode === 'baseline') {
  writeFileSync(BASE, JSON.stringify({ commit, measuredAt: new Date().toISOString(), metrics }, null, 2) + '\n');
  console.table(metrics);
  console.log(`Reference zapsána do ${BASE} (${commit}).`);
  process.exit(0);
}
if (!existsSync(BASE)) { console.error(`Chybí ${BASE} — nejdřív node scripts/perf.mjs baseline.`); process.exit(1); }
const ref = JSON.parse(readFileSync(BASE, 'utf8'));
const rows = Object.entries(metrics).map(([k, v]) => {
  const b = ref.metrics[k];
  const ratio = b ? v / b : null;
  return { metrika: k, reference: b ?? '—', teď: v, poměr: ratio ? ratio.toFixed(2) : 'nová', ok: ratio == null || ratio >= TOLERANCE ? 'ano' : 'NE' };
});
console.log(`Reference ${ref.commit} (${ref.measuredAt}) vs. ${commit}:`);
console.table(rows);
process.exit(rows.some((r) => r.ok === 'NE') ? 1 : 0);
