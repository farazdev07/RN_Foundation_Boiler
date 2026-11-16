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
  mediaPicker: {
    group: ['react-native-image-crop-picker'],
    message: 'Use pickMedia from @shared/lib/media-picker.',
  },
  blobUtil: {
    group: ['react-native-blob-util'],
    message: 'File transfer lives in features/file-transfer.',
  },
  socketIo: {
    group: ['socket.io-client'],
    message: 'Use the socket from @shared/api.',
  },
  sentry: {
    group: ['@sentry/*'],
    message: 'Report errors through @shared/lib/monitoring.',
  },
  forms: {
    group: ['react-hook-form', '@hookform/*'],
    message: 'Use useZodForm and the Form* fields from @shared/lib/form.',
  },
  flashList: {
    group: ['@shopify/flash-list'],
    message: 'Use List from @shared/ui.',
  },
  turboImage: {
    group: ['react-native-turbo-image'],
    message: 'Use Image from @shared/ui.',
  },
  webView: {
    group: ['react-native-webview'],
    message:
      'Use WebView from @shared/ui, which enforces an origin allow-list.',
  },
  trueSheet: {
    group: ['@lodev09/react-native-true-sheet'],
    message: 'Use BottomSheet from @shared/ui.',
  },
  jailMonkey: {
    group: ['jail-monkey'],
    message: 'Device checks live in features/device-integrity.',
  },
  navigation: {
    group: ['@react-navigation/*'],
    message:
      'Features and entities take callbacks; only screens and app navigate.',
  },
};

// The optional units inside shared/ui (see units.json). `allowed` lists the
// ones a component may import because docs/migration-map.md records it.
const OPTIONAL_UI = [
  'Carousel',
  'RangeSlider',
  'ImageViewer',
  'date-time',
  'PhoneInput',
  'OtpInput',
  'WebView',
  'BottomSheet',
];

const optionalUi = (allowed = []) => ({
  group: OPTIONAL_UI.filter(name => !allowed.includes(name)).flatMap(name => [
    `../${name}`,
    `../${name}/*`,
  ]),
  message:
    'Optional UI units must stay removable: do not import one from another shared component.',
});

// User-facing text comes from i18n (CLAUDE.md). These catch the forms it takes
// in components: JSX text, the props that are shown or read aloud, and default
// values for label-like props.
const TEXT_PROPS =
  '/^(title|label|message|placeholder|accessibilityLabel|accessibilityHint|confirmLabel|cancelLabel|actionLabel|closeLabel|doneLabel)$/';
const WORD = '/[A-Za-z]{2}/';
const textProp = `JSXAttribute[name.name=${TEXT_PROPS}]`;

const hardCodedText = {
  files: ['src/**/*.tsx'],
  ignores: ['src/**/*.test.tsx', 'src/**/testing/**'],
  rules: {
    'react/jsx-no-literals': [
      'error',
      { noStrings: true, ignoreProps: true, allowedStrings: [' · '] },
    ],
    'no-restricted-syntax': [
      'error',
      ...[
        `${textProp} > Literal[value=${WORD}]`,
        `${textProp} > JSXExpressionContainer > Literal[value=${WORD}]`,
        `${textProp} > JSXExpressionContainer > ConditionalExpression > Literal[value=${WORD}]`,
        `${textProp} > JSXExpressionContainer > LogicalExpression > Literal[value=${WORD}]`,
        `${textProp} > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=${WORD}]`,
        `AssignmentPattern[left.name=/(Label|[pP]laceholder|[tT]itle|[mM]essage)$/] > Literal[value=${WORD}]`,
      ].map(selector => ({
        selector,
        message:
          "User-facing text must come from i18n: use t() and the slice's i18n/en.ts.",
      })),
    ],
  },
};

// Flat config replaces a rule's options rather than merging them, so every path
// needs one complete list. Each list is "everything banned, except what this
// folder owns", so adding a package to `banned` covers every folder at once.
// Later blocks win; these go from general to specific.
const { navigation, ...packages } = banned;

const restrict = (files, { owns = [], extra = [] } = {}) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          ...Object.entries(packages)
            .filter(([name]) => !owns.includes(name))
            .map(([, pattern]) => pattern),
          ...extra,
        ],
      },
    ],
  },
});

const importRestrictions = [
  restrict(['src/**/*.{ts,tsx}']),
  // Optional UI units stay removable only if nothing else in the kit imports
  // them. A unit's own files import each other with "./", so this one list
  // covers core components and other units alike. A recorded exception gets
  // its own block after this one, for example
  //   restrict(['src/shared/ui/PhoneInput/**'], { extra: [optionalUi(['Select'])] })
  restrict(['src/shared/ui/**/*.{ts,tsx}'], { extra: [optionalUi()] }),
  ...[
    ['List', 'flashList'],
    ['Image', 'turboImage'],
    ['WebView', 'webView'],
    ['BottomSheet', 'trueSheet'],
  ].map(([folder, owned]) =>
    restrict([`src/shared/ui/${folder}/**/*.{ts,tsx}`], {
      owns: [owned],
      extra: [optionalUi()],
    }),
  ),
  restrict(['src/features/**/*.{ts,tsx}', 'src/entities/**/*.{ts,tsx}'], {
    extra: [navigation],
  }),
  restrict(['src/shared/storage/kv/**/*.{ts,tsx}'], { owns: ['mmkv'] }),
  restrict(['src/shared/storage/secure/**/*.{ts,tsx}'], { owns: ['keychain'] }),
  // Tests stub these packages, so they have to name them. As before,
  // the owner folders below still apply their own list to their tests.
  restrict(['src/**/*.test.{ts,tsx}'], {
    owns: Object.keys(packages).filter(name => name !== 'asyncStorage'),
  }),
  restrict(['src/shared/lib/network/**/*.{ts,tsx}'], { owns: ['netInfo'] }),
  restrict(['src/shared/lib/form/**/*.{ts,tsx}'], { owns: ['forms'] }),
  restrict(['src/app/monitoring/**/*.{ts,tsx}'], { owns: ['sentry'] }),
  restrict(['src/shared/api/socket/**/*.{ts,tsx}'], { owns: ['socketIo'] }),
  restrict(['src/shared/lib/media-picker/**/*.{ts,tsx}'], {
    owns: ['mediaPicker'],
  }),
  restrict(['src/features/device-integrity/**/*.{ts,tsx}'], {
    owns: ['jailMonkey'],
    extra: [navigation],
  }),
  // Its tests also reset device storage between cases.
  restrict(['src/features/device-integrity/**/*.test.{ts,tsx}'], {
    owns: ['jailMonkey', 'mmkv'],
    extra: [navigation],
  }),
  restrict(['src/features/file-transfer/**/*.{ts,tsx}'], {
    owns: ['blobUtil'],
    extra: [navigation],
  }),
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
  hardCodedText,
];
