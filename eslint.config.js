// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

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
  { ignores: ['dist/*', 'docs/*'] },
  { files: ['app/**', 'components/**'], ignores: ['**/__tests__/**'], rules: { 'no-restricted-imports': ['error', uiBoundaries] } },
  { files: ['logic/**'], ignores: ['logic/__tests__/**'], rules: { 'no-restricted-imports': ['error', logicBoundaries] } },
]);
