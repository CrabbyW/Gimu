import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBash, checkWrite, checkEdit } from './guard.mjs';

const owners = { port8082: [4242] };

test('blokuje zabití všech node', () => assert.ok(checkBash('taskkill //F //IM node.exe', owners)));
test('blokuje taskkill /IM node bez .exe', () => assert.ok(checkBash('taskkill /F /IM node', owners)));
test('blokuje kill procesu na 8082', () => assert.ok(checkBash('taskkill //F //PID 4242', owners)));
test('povolí kill procesu na 8081', () => assert.equal(checkBash('taskkill //F //PID 777', owners), null));
test('blokuje zabití cloudflared', () => assert.ok(checkBash('taskkill //F //IM cloudflared.exe', owners)));
test('blokuje CI=1 s expo start', () => assert.ok(checkBash('CI=1 npx expo start --web --port 8081', owners)));
test('povolí expo start bez CI', () => assert.equal(checkBash('npx expo start --web --port 8081 --clear', owners), null));
test('blokuje CI=1 přes cd && (stejný segment po &&? ne — dva příkazy)', () => assert.ok(checkBash('cd app && CI=1 npx expo start', owners)));
test('povolí text, který CI=1 jen zmiňuje', () => {
  assert.equal(checkBash("python - <<'X'\ns = '`npx expo start --web`, NIKDY s `CI=1`'\nX", owners), null);
});
test('blokuje přepis QA přes >', () => assert.ok(checkBash('echo x > docs/QA.md', owners)));
test('povolí připsání do LOG přes >>', () => assert.equal(checkBash('cat >> docs/LOG.md <<EOF', owners), null));
test('blokuje Write na QA.md a LOG.md', () => {
  assert.ok(checkWrite('C:/x/appka/docs/QA.md'));
  assert.ok(checkWrite(String.raw`docs\LOG.md`));
});
test('povolí Write jinam', () => assert.equal(checkWrite('docs/RATING.md'), null));
test('Edit LOG: připsání projde', () => assert.equal(checkEdit('docs/LOG.md', 'konec', 'konec\nnový', 'a\nkonec'), null));
test('Edit LOG: změna starého obsahu blokována', () => assert.ok(checkEdit('docs/LOG.md', 'konec', 'jinak', 'a\nkonec')));
test('Edit jinde projde', () => assert.equal(checkEdit('app/x.ts', 'a', 'b', 'a'), null));
