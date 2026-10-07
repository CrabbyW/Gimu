// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');
// Lokální pravidla (spec elite fáze 0 §3.4): worklet nesmí zachytit objekt (pád na nativu, web ho neukáže).
const noWorkletObjectCapture = require('./eslint-rules/no-worklet-object-capture');

const uiBoundaries = {
  patterns: [
    { group: ['@/store/*', '@/store'], message: 'UI čte data přes hooks/, ne ze store.' },
    // Regex místo gitignore glob: '@/data' vyloučí celý adresář a '!@/data/copy' už ho nedokáže vrátit.
    { regex: '^@/data(/(?!copy$).*)?$', message: 'UI čte obsah přes services/, ne z data/ (výjimka: @/data/copy = UI texty).' },
    { group: ['@/services/mock/*'], message: 'Implementaci volí jen services/index.ts.' },
  ],
};
const logicBoundaries = {
  patterns: [
    { group: ['react', 'react-native', 'expo*', '@/store*', '@/services*', '@/data*', '@/theme*'], message: 'logic/ je čistá: jen @/types.' },
  ],
};

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'docs/*', 'video/**', 'e2e/report/**', 'e2e/test-results/**', '.agents/**', '.superpowers/**', '.expo/**'] },
  { files: ['app/**', 'components/**'], ignores: ['**/__tests__/**'], rules: { 'no-restricted-imports': ['error', uiBoundaries] } },
  {
    files: ['app/**', 'components/**', 'hooks/**', 'lib/**'],
    plugins: { local: { rules: { 'no-worklet-object-capture': noWorkletObjectCapture } } },
    rules: { 'local/no-worklet-object-capture': 'error' },
  },
  { files: ['logic/**'], ignores: ['logic/__tests__/**'], rules: { 'no-restricted-imports': ['error', logicBoundaries] } },
]);
