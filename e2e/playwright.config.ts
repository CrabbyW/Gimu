import { defineConfig, type Project } from '@playwright/test';

/** Playwright pro web build appky (spec elite fáze 0 §3.1).
 *  Port 8081 = web pro agenty (Metro bez CI=1). 8082 patří Expo Go uživatele, sem nesahat. */
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const SIZES = [
  { w: 320, h: 568 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
] as const;
const SCHEMES = ['dark', 'light'] as const;

/** Vizuální regrese běží na všech 8 kombinacích; toky a měření jen na referenčním w390-dark. */
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
  // Toky několikrát přenačtou celý dev bundle (~16 MB) + CanvasKit; na tomto stroji ~1.5 min na tok.
  timeout: 180_000,
  fullyParallel: true,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 3,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: './report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8081',
    launchOptions: { executablePath: CHROME },
    actionTimeout: 15_000,
    navigationTimeout: 120_000,
    trace: 'retain-on-failure',
    // Metro komprimuje 15MB dev bundle za běhu; pod souběhem se gzip stream zasekne (load nikdy nedoběhne). Bez komprese je to < 1 s.
    extraHTTPHeaders: { 'Accept-Encoding': 'identity' },
  },
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  webServer: [{
    // Bez CI=1: Metro musí běžet s watchem jako pro agenty. reuseExistingServer = běžící server se použije.
    command: 'npx expo start --web --port 8081',
    cwd: '..',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  }, {
    // Produkční build pro perf-prod (dist/ vytvoří `npm run e2e:perf` přes expo export).
    command: 'node e2e/serve-dist.mjs',
    cwd: '..',
    url: 'http://localhost:8083',
    reuseExistingServer: true,
    timeout: 30_000,
  }],
  projects: [
    ...projects,
    // Měření výkonu proti produkčnímu webovému buildu (dist/ přes e2e/serve-dist.mjs na 8083):
    // dev server posílá nezmenšený ~16MB bundle a čas do interakce by neodpovídal skutečné appce.
    {
      name: 'perf-prod',
      testMatch: /perf[\/].*\.spec\.ts$/,
      use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark', baseURL: 'http://localhost:8083' },
    },
  ],
});
