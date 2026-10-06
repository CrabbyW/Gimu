// Ochranný hook (CLAUDE.md, spec elite fáze 0 §4.2): blokuje příkazy, které shodily Expo Go uživatele
// nebo přepsaly append-only dokumenty. PreToolUse: exit 2 + důvod na stderr = nástroj se nespustí.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const APPEND_ONLY = /(^|[\\/])docs[\\/](QA|LOG)\.md$/i;

// Pravidla platí jen pro příkaz v pozici příkazu (začátek řádku nebo po ; & | ( ), ne pro text,
// který ho jen zmiňuje (dokumentace v heredocu, report).
const CMD = '(?:^|[;&|(]\\s*)';
const rx = (body) => new RegExp(CMD + body, 'im');

const KILL_ALL_NODE = [
  rx('taskkill\\b[^|;&\\n]*[\\/\\\\]{1,2}IM\\s+node(\\.exe)?\\b'),
  rx('(pkill|killall)\\s+(-\\S+\\s+)*node\\b'),
  rx('(Stop-Process|spps|kill)\\s+[^;&|\\n]*-Name\\s+["\']?node\\b'),
  rx('Get-Process\\s+["\']?node\\b[^;\\n]*\\|\\s*(Stop-Process|spps|kill)\\b'),
];
const KILL_TUNNEL = [
  rx('taskkill\\b[^|;&\\n]*[\\/\\\\]{1,2}IM\\s+cloudflared'),
  rx('(pkill|killall)\\s+(-\\S+\\s+)*cloudflared'),
  rx('(Stop-Process|spps|kill)\\s+[^;&|\\n]*-Name\\s+["\']?cloudflared'),
];
const CI_EXPO = rx('(?:\\w+=\\S*\\s+)*CI=(1|true)\\b[^\\n|;&`]*\\bexpo\\s+start\\b');
const KILL_PID = /(?:taskkill\b[^|;&\n]*[\\/]{1,2}PID\s+|Stop-Process\s+(?:-Force\s+)?-Id\s+)(\d+)/gi;
// Přepis (>) append-only dokumentů; připsání (>>) je v pořádku.
const OVERWRITE_DOC = /(^|[^>])>\s*["']?[^\s"'|;&]*docs[\\/](QA|LOG)\.md/i;

/** Bash/PowerShell příkaz → důvod zákazu, nebo null. `owners.port8082` = PID naslouchající na 8082. */
export function checkBash(cmd, owners) {
  if (KILL_ALL_NODE.some((r) => r.test(cmd))) {
    return 'Zakázáno: zabití všech node procesů shodí Expo Go uživatele (port 8082). Zabij jen PID naslouchající na 8081.';
  }
  if (KILL_TUNNEL.some((r) => r.test(cmd))) return 'Zakázáno: cloudflared je tunel pro iPhone uživatele.';
  for (const m of cmd.matchAll(KILL_PID)) {
    if (owners.port8082.includes(Number(m[1]))) {
      return 'Zakázáno: PID naslouchá na portu 8082 (Expo Go uživatele). Server uživatele restartuje jen boss přes TaskStop vlastní úlohy.';
    }
  }
  if (CI_EXPO.test(cmd)) return 'Zakázáno: Metro s CI=1 nesleduje změny souborů. Spusť bez CI.';
  if (OVERWRITE_DOC.test(cmd)) return 'Zakázáno: docs/QA.md a docs/LOG.md jsou append-only — připisuj přes >> nebo Edit.';
  return null;
}

/** Write (celý soubor) na append-only dokument je zakázaný. */
export function checkWrite(path) {
  return APPEND_ONLY.test(path) ? 'docs/QA.md a docs/LOG.md jsou append-only: použij Edit a připiš na konec.' : null;
}

/** Edit append-only dokumentu projde jen jako připsání: `new_string` začíná `old_string`, který v souboru je.
 *  Soubory v repu mají CRLF (git autocrlf), Edit posílá LF: porovnává se normalizovaný text. */
export function checkEdit(path, oldStr, newStr, fileText) {
  if (!APPEND_ONLY.test(path)) return null;
  const lf = (t) => t.replace(/\r\n/g, '\n');
  if (!lf(fileText).includes(lf(oldStr)) || !lf(newStr).startsWith(lf(oldStr))) {
    return 'docs/QA.md a docs/LOG.md jsou append-only: new_string musí začínat old_string (jen připsání).';
  }
  return null;
}

function port8082Owners() {
  try {
    const out = execSync('netstat -ano', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return [...out.matchAll(/:8082\s+\S+\s+LISTENING\s+(\d+)/g)].map((m) => Number(m[1]));
  } catch {
    return [];
  }
}

if ((process.argv[1] ?? '').endsWith('guard.mjs')) {
  let raw = '';
  process.stdin.on('data', (d) => { raw += d; });
  process.stdin.on('end', () => {
    let payload = {};
    try { payload = JSON.parse(raw || '{}'); } catch { process.exit(0); }
    const tool = payload.tool_name;
    const input = payload.tool_input ?? {};
    let reason = null;
    if (tool === 'Bash' || tool === 'PowerShell') reason = checkBash(String(input.command ?? ''), { port8082: port8082Owners() });
    else if (tool === 'Write') reason = checkWrite(String(input.file_path ?? ''));
    else if (tool === 'Edit') {
      let text = '';
      try { text = readFileSync(String(input.file_path ?? ''), 'utf8'); } catch { /* nový soubor */ }
      reason = checkEdit(String(input.file_path ?? ''), String(input.old_string ?? ''), String(input.new_string ?? ''), text);
    }
    if (reason) { process.stderr.write(reason); process.exit(2); }
    process.exit(0);
  });
}
