const reactNative = require('@react-native/eslint-config/flat');
const boundaries = require('eslint-plugin-boundaries');

// Import sources are matched as written, so requiring `@layer/<slice>` enforces
// two rules at once: a slice is only reachable through its index.ts, and a
// relative path can never cross a slice even if it resolves to one.
const slice = (type, alias) => ({
  to: { element: { type } },
  dependency: { source: `@${alias}/*` },
});

const screens = slice('screen', 'screens');
const features = slice('feature', 'features');
const entities = slice('entity', 'entities');
const shared = slice('shared', 'shared');
// shared/lib is split by purpose, so each folder is its own public API.
const lib = {
  to: { element: { type: 'shared-lib' } },
  dependency: { source: '@shared/lib/*' },
};

// Importing a sibling slice matches no policy, so `default: disallow` rejects it.
const layerPolicies = [
  {
    from: { element: { type: 'app' } },
    allow: [screens, features, entities, shared, lib],
  },
  {
    from: { element: { type: 'screen' } },
    allow: [features, entities, shared, lib],
  },
  { from: { element: { type: 'feature' } }, allow: [entities, shared, lib] },
  { from: { element: { type: 'entity' } }, allow: [shared, lib] },
  { from: { element: { type: 'shared' } }, allow: [shared, lib] },
  { from: { element: { type: 'shared-lib' } }, allow: [shared, lib] },
];

const banned = {
  asyncStorage: {
    group: ['@react-native-async-storage/*'],
    message: 'AsyncStorage is not allowed. Use @shared/storage.',
  },
  mmkv: {
    group: ['react-native-mmkv'],
    message: 'MMKV is only importable in shared/storage/kv.',
  },
  keychain: {
    group: ['react-native-keychain'],
    message: 'Keychain is only importable in shared/storage/secure.',
  },
  netInfo: {
    group: ['@react-native-community/netinfo'],
    message: 'NetInfo is only importable in shared/lib/network.',
  },
  sentry: {
    group: ['@sentry/*'],
    message: 'Report errors through @shared/lib/monitoring.',
  },
  navigation: {
    group: ['@react-navigation/*'],
    message:
      'Features and entities take callbacks; only screens and app navigate.',
  },
};

const { asyncStorage, mmkv, keychain, netInfo, sentry, navigation } = banned;

// Flat config replaces a rule's options rather than merging them, so every path
// needs one complete list. Later blocks win; these go from general to specific.
const restrict = (files, patterns) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
});

const importRestrictions = [
  restrict(
    ['src/**/*.{ts,tsx}'],
    [asyncStorage, mmkv, keychain, netInfo, sentry],
  ),
  restrict(
    ['src/features/**/*.{ts,tsx}', 'src/entities/**/*.{ts,tsx}'],
    [asyncStorage, mmkv, keychain, netInfo, sentry, navigation],
  ),
  restrict(
    ['src/shared/storage/kv/**/*.{ts,tsx}'],
    [asyncStorage, keychain, netInfo, sentry],
  ),
  restrict(
    ['src/shared/storage/secure/**/*.{ts,tsx}'],
    [asyncStorage, mmkv, netInfo, sentry],
  ),
  // Tests stub these packages, so they have to name them.
  restrict(['src/**/*.test.{ts,tsx}'], [asyncStorage]),
  restrict(
    ['src/shared/lib/network/**/*.{ts,tsx}'],
    [asyncStorage, mmkv, keychain, sentry],
  ),
  restrict(
    ['src/app/monitoring/**/*.{ts,tsx}'],
    [asyncStorage, mmkv, keychain, netInfo],
  ),
];

module.exports = [
  {
    ignores: [
      'android/',
      'ios/',
      'coverage/',
      'node_modules/',
      'tools/boundary-fixtures/',
      '.yarn/',
    ],
  },
  ...reactNative,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'screen', pattern: 'src/screens/*' },
        { type: 'feature', pattern: 'src/features/*' },
        { type: 'entity', pattern: 'src/entities/*' },
        { type: 'shared-lib', pattern: 'src/shared/lib/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', policies: layerPolicies },
      ],
      'boundaries/no-unknown-files': 'error',
    },
  },
  ...importRestrictions,
];
