# Elite fáze 0 — workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proces najde chyby dřív než uživatel. V repu přibude Playwright (E2E, vizuální regrese, měření), ochranné hooky, ESLint pravidlo pro worklety, shell pro agenty a nová rubrika ratingu.

**Architecture:** Testy prohlížeče žijí v `e2e/` a běží proti webovému dev serveru na 8081. Hooky jsou jeden Node skript `.claude/hooks/guard.mjs` volaný z PreToolUse. Čistá rozhodovací logika je v exportovaných funkcích testovaných přes `node --test`. ESLint pravidlo je lokální plugin v `eslint-rules/`, testované přes RuleTester. Dokumenty (`CLAUDE.md`, agenti) jsou textové změny.

**Tech Stack:** `@playwright/test` (systémový Chrome), Node ≥ 20 (`node --test`), ESLint flat config, Jest.

**Spec:** `docs/superpowers/specs/2026-10-06-elite-faze0-workflow-design.md`

## Global Constraints
- Porty: 8081 = web pro agenty (bez CI=1), 8082 = Expo Go uživatele. 8082 a cloudflared se nikdy nezabíjí.
- `docs/QA.md` a `docs/LOG.md` se jen doplňují (append-only).
- Žádné placené služby a žádné stahování browserů. Chrome přes `CHROME_PATH` nebo `channel: 'chrome'`.
- Worklet pravidlo: ve workletu jen sdílené hodnoty a čísla, nikdy gesto, funkce ani objekt, který je obsahuje.
- Copy appky je anglicky, dokumentace česky.

## Review Focus
- Hook nesmí blokovat legitimní práci: `npx expo start --web --port 8081` bez CI, `taskkill //F //PID <pid na 8081>` a běžný Edit LOG připsáním musí projít. Test v Task 1.
- Hook musí zablokovat Write přepisující QA.md i Edit, který mění dřívější obsah. Test v Task 1.
- Flaky snímky (fonty, CanvasKit, animace) → Reduce Motion emulace, `document.fonts.ready`, `animations: 'disabled'`. Ověřit dvojím během bez diffu v Task 3.
- ESLint pravidlo nesmí hlásit správný kód (rozbalené sdílené hodnoty `x.value`). Test v Task 2.
- `npm run e2e` musí fungovat i bez běžícího serveru (`webServer` ho spustí) i s běžícím (`reuseExistingServer`). Ověřit v Task 3.

---

### Task 1: Ochranný hook (guard) + testy + registrace

**Files:**
- Create: `.claude/hooks/guard.mjs`, `.claude/hooks/guard.test.mjs`
- Modify: `.claude/settings.json` (hooks.PreToolUse)

**Interfaces:**
- Produces: `export function checkBash(cmd: string, portOwners: { port8082: number[] }): string | null` (null = povoleno, jinak důvod); `export function checkWrite(path: string): string | null`; `export function checkEdit(path: string, oldStr: string, newStr: string, fileText: string): string | null`. Main čte JSON z stdin (`tool_name`, `tool_input`), při zákazu `process.stderr.write(reason)` a `process.exit(2)`.

- [ ] **Step 1: Test** (`node --test .claude/hooks/guard.test.mjs`):
```js
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { checkBash, checkWrite, checkEdit } from './guard.mjs';
const owners = { port8082: [4242] };
test('blokuje zabití všech node', () => assert.ok(checkBash('taskkill //F //IM node.exe', owners)));
test('blokuje taskkill /IM node bez .exe', () => assert.ok(checkBash('taskkill /F /IM node', owners)));
test('blokuje kill procesu na 8082', () => assert.ok(checkBash('taskkill //F //PID 4242', owners)));
test('povolí kill procesu na 8081', () => assert.equal(checkBash('taskkill //F //PID 777', owners), null));
test('blokuje zabití cloudflared', () => assert.ok(checkBash('taskkill //F //IM cloudflared.exe', owners)));
test('blokuje CI=1 s expo start', () => assert.ok(checkBash('CI=1 npx expo start --web --port 8081', owners)));
test('povolí expo start bez CI', () => assert.equal(checkBash('npx expo start --web --port 8081 --clear', owners), null));
test('blokuje Write na QA.md a LOG.md', () => { assert.ok(checkWrite('C:/x/appka/docs/QA.md')); assert.ok(checkWrite('docs\\LOG.md')); });
test('povolí Write jinam', () => assert.equal(checkWrite('docs/RATING.md'), null));
test('Edit LOG: připsání projde', () => assert.equal(checkEdit('docs/LOG.md', 'konec', 'konec\nnový', 'a\nkonec'), null));
test('Edit LOG: změna starého obsahu blokována', () => assert.ok(checkEdit('docs/LOG.md', 'konec', 'jinak', 'a\nkonec')));
test('Edit jinde projde', () => assert.equal(checkEdit('app/x.ts', 'a', 'b', 'a'), null));
```
- [ ] **Step 2:** Spustit → FAIL (modul chybí).
- [ ] **Step 3: Implementace**
```js
// Ochranný hook (CLAUDE.md, spec elite fáze 0 §4.2): blokuje nebezpečné příkazy a přepisování append-only dokumentů.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const APPEND_ONLY = /(^|[\\/])docs[\\/](QA|LOG)\.md$/i;
export function checkBash(cmd, owners) {
  const c = cmd.replace(/\s+/g, ' ');
  if (/taskkill\b[^|;&]*\/IM\s+node(\.exe)?\b/i.test(c)) return 'Zakázáno: zabití všech node procesů shodí Expo Go uživatele (port 8082). Zabij jen PID na 8081.';
  if (/(taskkill\b[^|;&]*\/IM\s+cloudflared|pkill\s+cloudflared|kill\b.*cloudflared)/i.test(c)) return 'Zakázáno: cloudflared je tunel pro iPhone uživatele.';
  for (const m of c.matchAll(/taskkill\b[^|;&]*\/PID\s+(\d+)/gi)) if (owners.port8082.includes(Number(m[1]))) return 'Zakázáno: PID naslouchá na portu 8082 (Expo Go uživatele).';
  if (/\bCI=1\b/.test(c) && /expo\s+start/.test(c)) return 'Zakázáno: Metro s CI=1 nesleduje změny souborů. Spusť bez CI.';
  return null;
}
export function checkWrite(path) { return APPEND_ONLY.test(path) ? 'docs/QA.md a docs/LOG.md jsou append-only: použij Edit a připiš na konec.' : null; }
export function checkEdit(path, oldStr, newStr, fileText) {
  if (!APPEND_ONLY.test(path)) return null;
  if (!fileText.includes(oldStr) || !newStr.startsWith(oldStr)) return 'docs/QA.md a docs/LOG.md jsou append-only: new_string musí začínat old_string (jen připsání).';
  return null;
}
function port8082Owners() {
  try {
    const out = execSync('netstat -ano', { encoding: 'utf8' });
    return [...out.matchAll(/:8082\s+\S+\s+LISTENING\s+(\d+)/g)].map((m) => Number(m[1]));
  } catch { return []; }
}
if (process.argv[1] && process.argv[1].endsWith('guard.mjs')) {
  let raw = ''; process.stdin.on('data', (d) => { raw += d; }); process.stdin.on('end', () => {
    const { tool_name: tool, tool_input: input = {} } = JSON.parse(raw || '{}');
    let reason = null;
    if (tool === 'Bash' || tool === 'PowerShell') reason = checkBash(String(input.command ?? ''), { port8082: port8082Owners() });
    if (tool === 'Write') reason = checkWrite(String(input.file_path ?? ''));
    if (tool === 'Edit') { let text = ''; try { text = readFileSync(input.file_path, 'utf8'); } catch { /* nový soubor */ } reason = checkEdit(String(input.file_path ?? ''), String(input.old_string ?? ''), String(input.new_string ?? ''), text); }
    if (reason) { process.stderr.write(reason); process.exit(2); }
    process.exit(0);
  });
}
```
- [ ] **Step 4:** `node --test .claude/hooks/guard.test.mjs` → PASS. Nesmí se spustit main (ověřit, že test proces neskončí exitem).
- [ ] **Step 5:** `.claude/settings.json`: přidat
```json
{ "hooks": { "PreToolUse": [ { "matcher": "Bash|PowerShell|Write|Edit", "hooks": [ { "type": "command", "command": "node .claude/hooks/guard.mjs" } ] } ] } }
```
(sloučit s existujícím obsahem). Ověřit: `echo '{"tool_name":"Bash","tool_input":{"command":"taskkill //F //IM node.exe"}}' | node .claude/hooks/guard.mjs; echo $?` → 2.
- [ ] **Step 6:** Commit `chore(workflow): ochranný hook (node procesy, port 8082, cloudflared, CI=1, append-only QA/LOG)`.

### Task 2: ESLint pravidlo no-worklet-object-capture

**Files:**
- Create: `eslint-rules/no-worklet-object-capture.js`, `eslint-rules/__tests__/no-worklet-object-capture.test.js`
- Modify: `eslint.config.js` (registrace lokálního pluginu, `error` pro `app/ components/ hooks/ lib/`)

**Interfaces:**
- Produces: pravidlo `local/no-worklet-object-capture`. Uvnitř funkce předané do `useAnimatedStyle|useAnimatedProps|useDerivedValue|useAnimatedReaction` nebo do gesture metod `onBegin|onStart|onUpdate|onChange|onEnd|onFinalize|onTouchesDown|onTouchesMove|onTouchesUp|onTouchesCancelled` hlásí MemberExpression tvaru `a.b.value` / `a.b.get()` / `a.b.set()` (tj. `.value`/`.get`/`.set` na členu objektu). Zpráva: „Worklet zachytává objekt `a` (může obsahovat Gesture/funkci → na nativu pád). Rozbal sdílenou hodnotu: `const { b } = a`.“

- [ ] **Step 1: Test** (Jest + RuleTester):
```js
const { RuleTester } = require('eslint');
const rule = require('../no-worklet-object-capture');
const tester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } } });
tester.run('no-worklet-object-capture', rule, {
  valid: [
    'const s = useAnimatedStyle(() => ({ opacity: x.value }));',
    'const { spin: a } = spin; useAnimatedReaction(() => a.value, () => {});',
    'Gesture.Pan().onUpdate((e) => { x.set(e.x); });',
    'const r = obj.inner.value;',
  ],
  invalid: [
    { code: 'useAnimatedReaction(() => spin.spin.value, () => {});', errors: 1 },
    { code: 'const d = useDerivedValue(() => clock.value + spin.angle.value);', errors: 1 },
    { code: 'Gesture.Pan().onUpdate(() => { state.pad.set(1); });', errors: 1 },
  ],
});
```
- [ ] **Step 2:** `npx jest eslint-rules` → FAIL.
- [ ] **Step 3: Implementace** (`meta.type: 'problem'`; `create(context)` sleduje zásobník „uvnitř workletu“: při vstupu do ArrowFunctionExpression/FunctionExpression, která je 1. argumentem CallExpression s callee `Identifier` v množině hooků nebo `MemberExpression` s property v množině gesture metod; v něm na `MemberExpression` kde `property.name === 'value'` (nebo CallExpression `.get()`/`.set()`) a `object` je sám `MemberExpression` s `object.type === 'Identifier'` → report). Testy zelené.
- [ ] **Step 4:** Zaregistrovat v `eslint.config.js` jako `plugins: { local: { rules: { 'no-worklet-object-capture': rule } } }`, `rules: { 'local/no-worklet-object-capture': 'error' }`. Spustit `npx eslint .` → opravit nálezy (rozbalením), případně odůvodněné `// eslint-disable-next-line local/no-worklet-object-capture -- <důvod>`.
- [ ] **Step 5:** `npx tsc --noEmit && npx jest && npx eslint .` zelené. Commit `chore(lint): pravidlo no-worklet-object-capture`.

### Task 3: Playwright v repu — config, helpery, E2E toky, vizuální regrese, měření

**Files:**
- Create: `e2e/playwright.config.ts`, `e2e/helpers.ts`, `e2e/flows/{onboarding,lesson,stage-up,league,settings-reset,tabbar}.spec.ts`, `e2e/visual/screens.spec.ts`, `e2e/perf/budget.spec.ts`, `e2e/__screenshots__/` (baseline)
- Modify: `package.json` (devDependency `@playwright/test`, skripty `e2e`, `e2e:visual`, `e2e:update`, `e2e:perf`), `jest` `testPathIgnorePatterns` += `/e2e/`, `.gitignore` (`e2e/test-results/`, `e2e/report/`)

**Interfaces:**
- Produces: `loadDemo(page)`, `resetApp(page)`, `waitForIdle(page)`, `gotoTab(page, 'league'|'progress'|'season'|'profile'|'')`; projekty `w320-dark`, `w320-light`, … `w430-light`.

- [ ] **Step 1:** `npm i -D @playwright/test` (bez `npx playwright install`). Config: `testDir: 'e2e'`, `use: { baseURL: 'http://localhost:8081', launchOptions: { executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' } }`, `webServer: { command: 'npx expo start --web --port 8081', url: 'http://localhost:8081', reuseExistingServer: true, timeout: 180_000 }`, `expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } }`, projekty 4 šířky × `colorScheme` dark/light (flows a perf jen `w390-dark`).
- [ ] **Step 2:** `helpers.ts`: `waitForIdle` = `await page.evaluate(() => document.fonts.ready)`, čekání na `globalThis.CanvasKit`, `page.emulateMedia({ reducedMotion: 'reduce' })` pro vizuální testy, krátké `waitForTimeout(600)`; `loadDemo` = goto `/dev`, klik `getByText(/Load demo profile/i)`, čekat na URL `/`; `resetApp` = Settings → „Reset app“ → potvrzení (`page.on('dialog', d => d.accept())`).
- [ ] **Step 3: E2E toky** (každý s reálnými asserty):
  - onboarding: projít 6 kroků (vybrat první volbu, vyplnit váhu, …) → mapa má `[START LESSON]`.
  - lesson: loadDemo → `[START LESSON]` → opakovaně `[SKIP]` dokud nenaskočí `[CONTINUE]` → klik → mapa; série v status line +1.
  - stage-up: /dev → stage → `/stage-up` → `[CONTINUE]`.
  - league: loadDemo → tab Liga → pódium (3 sloupce) viditelné nad tabulkou.
  - settings-reset: loadDemo → Settings → Reset app → `/onboarding/path`.
  - tabbar: 1 klik na každý tab přepne URL; drag po liště z 1. na 3. slot → po puštění URL `/progress`.
- [ ] **Step 4: Vizuální** `screens.spec.ts`: pro mapu, lekci (1. cvik), oslavu (Reduce Motion konečný stav), ligu, progres, sezónu, profil, nastavení, onboarding/path → `await expect(page).toHaveScreenshot('<obrazovka>.png', { fullPage: false })`. Vygenerovat baseline `npm run e2e:update`, pak `npm run e2e:visual` 2× po sobě → 0 diffů (flaky ošetřit maskou `mask: [page.locator('[data-testid=status-live-dot]')]` apod.).
- [ ] **Step 5: Měření** `budget.spec.ts`: na každé obrazovce `document.querySelectorAll('canvas').length <= 12`; rAF sampler 5 s na mapě a v oslavě bez Reduce Motion → medián fps ≥ 55; mapa: čas od `goto('/')` po viditelné `[START LESSON]` ≤ 3000 ms.
- [ ] **Step 6:** `npm run e2e` zelené (s i bez běžícího serveru na 8081). Commit `test(e2e): Playwright toky, vizuální regrese a měření v repu` (včetně baseline).

### Task 4: Shell pro agenty a nová rubrika

**Files:**
- Modify: `.claude/agents/design-agent.md`, `.claude/agents/motion-agent.md` (tools += Bash; povinný závěr: tsc, jest, eslint, `npm run e2e:visual -- --grep <obrazovka>`; zakázané příkazy dle hooku), `.claude/agents/qa-agent.md` (spouští `npm run e2e`, kontrola nativního logu `$TEMP/expogo.log`, append-only, iPhone checklist ≤ 5 bodů), `.claude/agents/rating-agent.md` (nová rubrika: 4 brány + 7 kategorií dle spec §5, výjimka 85/85 „čeká na iPhone“)

- [ ] **Step 1:** Upravit frontmatter `tools:` a těla agentů. Text rubriky zkopírovat ze spec §5 (tabulka a brány beze změny).
- [ ] **Step 2:** Ověřit, že soubory agentů jsou validní (frontmatter parsovatelný: `name`, `description`, `tools`). Commit `chore(agents): shell pro design/motion, QA s e2e a nativním logem, nová rubrika ratingu`.

### Task 5: CLAUDE.md, Expo server, LOG, ověřovací kolo

**Files:**
- Modify: `CLAUDE.md` (sekce „Pravidla pro všechny“ a „Workflow (BOSS)“ doplnit podle spec §4.3), `docs/HANDOFF.md`, `docs/LOG.md` (append), `README.md` (sekce Testy: `npm run e2e*`, porty)

- [ ] **Step 1:** CLAUDE.md doplnit body: porty 8081/8082, nové QA po commitu s kódem, kolo končí iPhone checklistem + nativním logem, worklet pravidlo (hlídá ESLint), append-only QA/LOG (hlídá hook), odkaz na rubriku v rating-agent.md.
- [ ] **Step 2:** Expo Go server: start bez `--clear` + prewarm bundlu (`curl` index.bundle přes tunel) — zapsat postup do HANDOFF „Praktické“.
- [ ] **Step 3:** LOG záznam bosse (fáze 0: co, rozhodnutí, otevřené), README sekce Testy.
- [ ] **Step 4: Ověřovací kolo:** qa-agent podle nového zadání (e2e, nativní log, iPhone checklist) → rating-agent podle nové rubriky → 100/100 (příp. 85/85 „čeká na iPhone“). Commit `docs(workflow): CLAUDE.md pravidla, README testy, LOG fáze 0`.
