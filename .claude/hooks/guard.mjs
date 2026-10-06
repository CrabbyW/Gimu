// Ochranný hook (CLAUDE.md, spec elite fáze 0 §4.2): blokuje příkazy, které dnes shodily Expo Go uživatele
// nebo přepsaly append-only dokumenty. PreToolUse: exit 2 + důvod na stderr = nástroj se nespustí.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const APPEND_ONLY = /(^|[\\/])docs[\\/](QA|LOG)\.md$/i;

/** Bash/PowerShell příkaz → důvod zákazu, nebo null. `owners.port8082` = PID naslouchající na 8082. */
export function checkBash(cmd, owners) {
  const c = cmd.replace(/\s+/g, ' ');
  if (/taskkill\b[^|;&]*[\/\\]{1,2}IM\s+node(\.exe)?\b/i.test(c) || /\b(pkill|killall)\s+(-\S+\s+)*node\b/i.test(c)) {
    return 'Zakázáno: zabití všech node procesů shodí Expo Go uživatele (port 8082). Zabij jen PID naslouchající na 8081.';
  }
  if (/taskkill\b[^|;&]*[\/\\]{1,2}IM\s+cloudflared/i.test(c) || /\b(pkill|killall)\s+(-\S+\s+)*cloudflared/i.test(c)) {
    return 'Zakázáno: cloudflared je tunel pro iPhone uživatele.';
  }
  for (const m of c.matchAll(/taskkill\b[^|;&]*[\/\\]{1,2}PID\s+(\d+)/gi)) {
    if (owners.port8082.includes(Number(m[1]))) return 'Zakázáno: PID naslouchá na portu 8082 (Expo Go uživatele).';
  }
  if (/\bCI=(1|true)\b/i.test(c) && /expo\s+start/.test(c)) return 'Zakázáno: Metro s CI=1 nesleduje změny souborů. Spusť bez CI.';
  // Přepis (>) append-only dokumentů; připsání (>>) je v pořádku.
  if (/(^|[^>])>\s*["']?[^\s"'|;&]*docs[\\/](QA|LOG)\.md/i.test(c)) {
    return 'Zakázáno: docs/QA.md a docs/LOG.md jsou append-only — připisuj přes >> nebo Edit.';
  }
  return null;
}

/** Write (celý soubor) na append-only dokument je zakázaný. */
export function checkWrite(path) {
  return APPEND_ONLY.test(path) ? 'docs/QA.md a docs/LOG.md jsou append-only: použij Edit a připiš na konec.' : null;
}

/** Edit append-only dokumentu projde jen jako připsání: `new_string` začíná `old_string`, který v souboru je. */
export function checkEdit(path, oldStr, newStr, fileText) {
  if (!APPEND_ONLY.test(path)) return null;
  if (!fileText.includes(oldStr) || !newStr.startsWith(oldStr)) {
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

const isMain = process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].replace(/\//g, '\\').toLowerCase()
  || (process.argv[1] ?? '').endsWith('guard.mjs');

if (isMain) {
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
