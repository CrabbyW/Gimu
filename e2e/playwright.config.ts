import { defineConfig, type Project } from '@playwright/test';

/** Playwright pro web build appky (spec elite fáze 0 §3.1).
 *  Testy běží proti PRODUKČNÍMU webovému exportu (`expo export --platform web` → dist/, statický server
 *  `e2e/serve-dist.mjs` na 8083): načte se za ~2 s místo desítek sekund dev bundlu a nesahá na Metro.
 *  Dev Metro na 8081 (agenti) ani 8082 (Expo Go uživatele) e2e nepotřebuje, takže je nezatěžuje.
 *  Skripty `npm run e2e*` export předem vytvoří. */
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = `http://localhost:${process.env.PERF_PORT ?? 8083}`;

const SIZES = [
  { w: 320, h: 568 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
] as const;
const SCHEMES = ['dark', 'light'] as const;

/** Vizuální regrese běží na všech 8 kombinacích; toky jen na referenčním w390-dark. */
const projects: Project[] = SIZES.flatMap(({ w, h }) =>
  SCHEMES.map((scheme) => {
    const name = `w${w}-${scheme}`;
    return {
      name,
      testMatch: name === 'w390-dark' ? /(flows|visual)[\/].*\.spec\.ts$/ : /visual[\/].*\.spec\.ts$/,
      use: { viewport: { width: w, height: h }, colorScheme: scheme, hasTouch: false },
    } satisfies Project;
  }),
);

export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  timeout: 90_000,
  fullyParallel: true,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 3,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: './report', open: 'never' }]],
  use: {
    baseURL: BASE,
    launchOptions: { executablePath: CHROME },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
  },
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  webServer: {
    command: 'node e2e/serve-dist.mjs',
    cwd: '..',
    url: BASE,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    ...projects,
    // Měření výkonu (plátna, čas do interakce, fps) na stejném produkčním buildu.
    {
      name: 'perf-prod',
      testMatch: /perf[\/].*\.spec\.ts$/,
      use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
    },
  ],
});
