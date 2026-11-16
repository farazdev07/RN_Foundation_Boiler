// Proves the architecture rules still bite. A plugin upgrade or config edit can
// silently stop a rule from firing, and a clean lint run would look the same, so
// each case below lints a deliberately chosen import and asserts the exact result.
const path = require('path');
const { ESLint } = require('eslint');

const fixtures = path.join(__dirname, 'boundary-fixtures');
const DEPENDENCIES = 'boundaries/dependencies';
const RESTRICTED = 'no-restricted-imports';
const JSX_TEXT = 'react/jsx-no-literals';
const TEXT_PROP = 'no-restricted-syntax';

const importing = source =>
  `import { value } from '${source}';\nexport { value };\n`;

// [description, file being linted, import source, expected rule or null]
const cases = [
  // Layers only point down.
  ['screen -> app', 'src/screens/alpha/x.ts', '@app/index', DEPENDENCIES],
  ['feature -> app', 'src/features/alpha/x.ts', '@app/index', DEPENDENCIES],
  [
    'feature -> screen',
    'src/features/alpha/x.ts',
    '@screens/beta',
    DEPENDENCIES,
  ],
  [
    'entity -> feature',
    'src/entities/alpha/x.ts',
    '@features/beta',
    DEPENDENCIES,
  ],
  [
    'entity -> screen',
    'src/entities/alpha/x.ts',
    '@screens/beta',
    DEPENDENCIES,
  ],
  ['shared -> entity', 'src/shared/alpha/x.ts', '@entities/beta', DEPENDENCIES],
  [
    'shared -> feature',
    'src/shared/alpha/x.ts',
    '@features/beta',
    DEPENDENCIES,
  ],
  ['shared -> app', 'src/shared/alpha/x.ts', '@app/index', DEPENDENCIES],

  // No sibling imports inside a layer.
  [
    'screen -> sibling',
    'src/screens/alpha/x.ts',
    '@screens/beta',
    DEPENDENCIES,
  ],
  [
    'feature -> sibling',
    'src/features/alpha/x.ts',
    '@features/beta',
    DEPENDENCIES,
  ],
  [
    'entity -> sibling',
    'src/entities/alpha/x.ts',
    '@entities/beta',
    DEPENDENCIES,
  ],

  // Public API only.
  [
    'deep feature import',
    'src/screens/alpha/x.ts',
    '@features/beta/model/internal',
    DEPENDENCIES,
  ],
  [
    'deep entity import',
    'src/features/alpha/x.ts',
    '@entities/beta/model/internal',
    DEPENDENCIES,
  ],
  [
    'deep shared import',
    'src/entities/alpha/x.ts',
    '@shared/beta/model/internal',
    DEPENDENCIES,
  ],

  // A relative path cannot cross a slice, even to an allowed target's index.
  [
    'relative to shared index',
    'src/features/alpha/x.ts',
    '../../shared/beta',
    DEPENDENCIES,
  ],
  [
    'relative to entity index',
    'src/features/alpha/x.ts',
    '../../entities/beta',
    DEPENDENCIES,
  ],
  ['relative to sibling', 'src/features/alpha/x.ts', '../beta', DEPENDENCIES],

  [
    'deep shared/lib import',
    'src/features/alpha/x.ts',
    '@shared/lib/alpha/model/internal',
    DEPENDENCIES,
  ],
  [
    'shared/lib -> feature',
    'src/shared/lib/alpha/x.ts',
    '@features/beta',
    DEPENDENCIES,
  ],
  [
    'relative to shared/lib',
    'src/features/alpha/x.ts',
    '../../shared/lib/alpha',
    DEPENDENCIES,
  ],

  // Package restrictions, including on the paths where blocks could override each other.
  [
    'AsyncStorage in a screen',
    'src/screens/alpha/x.ts',
    '@react-native-async-storage/async-storage',
    RESTRICTED,
  ],
  [
    'MMKV in a feature',
    'src/features/alpha/x.ts',
    'react-native-mmkv',
    RESTRICTED,
  ],
  [
    'Keychain in an entity',
    'src/entities/alpha/x.ts',
    'react-native-keychain',
    RESTRICTED,
  ],
  [
    'NetInfo in a screen',
    'src/screens/alpha/x.ts',
    '@react-native-community/netinfo',
    RESTRICTED,
  ],
  [
    'navigation in a feature',
    'src/features/alpha/x.ts',
    '@react-navigation/native',
    RESTRICTED,
  ],
  [
    'navigation in an entity',
    'src/entities/alpha/x.ts',
    '@react-navigation/native',
    RESTRICTED,
  ],
  [
    'Keychain in storage/kv',
    'src/shared/storage/kv/x.ts',
    'react-native-keychain',
    RESTRICTED,
  ],
  [
    'MMKV in storage/secure',
    'src/shared/storage/secure/x.ts',
    'react-native-mmkv',
    RESTRICTED,
  ],
  [
    'image picker in a screen',
    'src/screens/alpha/x.ts',
    'react-native-image-crop-picker',
    RESTRICTED,
  ],
  [
    'blob-util in shared',
    'src/shared/alpha/x.ts',
    'react-native-blob-util',
    RESTRICTED,
  ],
  [
    'blob-util in another feature',
    'src/features/alpha/x.ts',
    'react-native-blob-util',
    RESTRICTED,
  ],
  [
    'socket.io in a feature',
    'src/features/alpha/x.ts',
    'socket.io-client',
    RESTRICTED,
  ],
  [
    'socket.io elsewhere in shared/api',
    'src/shared/api/x.ts',
    'socket.io-client',
    RESTRICTED,
  ],
  [
    'Sentry in a screen',
    'src/screens/alpha/x.ts',
    '@sentry/react-native',
    RESTRICTED,
  ],
  [
    'Sentry in shared',
    'src/shared/alpha/x.ts',
    '@sentry/react-native',
    RESTRICTED,
  ],
  [
    'Sentry elsewhere in app',
    'src/app/x.ts',
    '@sentry/react-native',
    RESTRICTED,
  ],

  [
    'react-hook-form in a feature',
    'src/features/alpha/x.ts',
    'react-hook-form',
    RESTRICTED,
  ],
  [
    'a resolver in shared/ui',
    'src/shared/ui/x.ts',
    '@hookform/resolvers/zod',
    RESTRICTED,
  ],
  [
    'react-hook-form in lib/form',
    'src/shared/lib/form/x.ts',
    'react-hook-form',
    null,
  ],
  ['MMKV in a test', 'src/features/alpha/x.test.ts', 'react-native-mmkv', null],
  [
    'AsyncStorage in a test',
    'src/features/alpha/x.test.ts',
    '@react-native-async-storage/async-storage',
    RESTRICTED,
  ],

  [
    'FlashList in a screen',
    'src/screens/alpha/x.ts',
    '@shopify/flash-list',
    RESTRICTED,
  ],
  [
    'the image library in an entity',
    'src/entities/alpha/x.ts',
    'react-native-turbo-image',
    RESTRICTED,
  ],
  [
    'WebView in a feature',
    'src/features/alpha/x.ts',
    'react-native-webview',
    RESTRICTED,
  ],
  [
    'the sheet library in a screen',
    'src/screens/alpha/x.ts',
    '@lodev09/react-native-true-sheet',
    RESTRICTED,
  ],
  [
    'the image library in another UI component',
    'src/shared/ui/List/x.ts',
    'react-native-turbo-image',
    RESTRICTED,
  ],
  [
    'FlashList in ui/List',
    'src/shared/ui/List/x.ts',
    '@shopify/flash-list',
    null,
  ],
  [
    'the image library in ui/Image',
    'src/shared/ui/Image/x.ts',
    'react-native-turbo-image',
    null,
  ],
  [
    'the root check library in a screen',
    'src/screens/alpha/x.ts',
    'jail-monkey',
    RESTRICTED,
  ],
  [
    'the root check library in features/device-integrity',
    'src/features/device-integrity/x.ts',
    'jail-monkey',
    null,
  ],
  [
    'the capture protection library in a screen',
    'src/screens/alpha/x.ts',
    'react-native-capture-protection',
    RESTRICTED,
  ],
  [
    'the capture protection library in lib/screen-protection',
    'src/shared/lib/screen-protection/x.ts',
    'react-native-capture-protection',
    null,
  ],
  [
    'WebView in ui/WebView',
    'src/shared/ui/WebView/x.ts',
    'react-native-webview',
    null,
  ],
  [
    'the sheet library in ui/BottomSheet',
    'src/shared/ui/BottomSheet/x.ts',
    '@lodev09/react-native-true-sheet',
    null,
  ],

  // What must stay legal, so a rule that is too broad fails here too.
  ['app -> screen', 'src/app/x.ts', '@screens/alpha', null],
  ['app -> shared', 'src/app/x.ts', '@shared/alpha', null],
  ['screen -> feature', 'src/screens/alpha/x.ts', '@features/alpha', null],
  ['screen -> entity', 'src/screens/alpha/x.ts', '@entities/alpha', null],
  ['feature -> entity', 'src/features/alpha/x.ts', '@entities/alpha', null],
  ['feature -> shared', 'src/features/alpha/x.ts', '@shared/alpha', null],
  ['entity -> shared', 'src/entities/alpha/x.ts', '@shared/alpha', null],
  [
    'feature -> shared/lib',
    'src/features/alpha/x.ts',
    '@shared/lib/alpha',
    null,
  ],
  ['shared -> shared/lib', 'src/shared/alpha/x.ts', '@shared/lib/alpha', null],
  [
    'shared/lib -> sibling lib',
    'src/shared/lib/alpha/x.ts',
    '@shared/lib/beta',
    null,
  ],
  ['shared -> shared segment', 'src/shared/alpha/x.ts', '@shared/beta', null],
  [
    'relative inside a slice',
    'src/features/alpha/x.ts',
    './model/internal',
    null,
  ],
  [
    'MMKV in storage/kv',
    'src/shared/storage/kv/x.ts',
    'react-native-mmkv',
    null,
  ],
  [
    'Keychain in storage/secure',
    'src/shared/storage/secure/x.ts',
    'react-native-keychain',
    null,
  ],
  [
    'NetInfo in lib/network',
    'src/shared/lib/network/x.ts',
    '@react-native-community/netinfo',
    null,
  ],
  [
    'navigation in a screen',
    'src/screens/alpha/x.ts',
    '@react-navigation/native',
    null,
  ],
  [
    'image picker in lib/media-picker',
    'src/shared/lib/media-picker/x.ts',
    'react-native-image-crop-picker',
    null,
  ],
  [
    'blob-util in features/file-transfer',
    'src/features/file-transfer/x.ts',
    'react-native-blob-util',
    null,
  ],
  [
    'socket.io in shared/api/socket',
    'src/shared/api/socket/x.ts',
    'socket.io-client',
    null,
  ],
  [
    'Sentry in app/monitoring',
    'src/app/monitoring/x.ts',
    '@sentry/react-native',
    null,
  ],
];

// Whole snippets rather than one import, for rules about what a file contains.
// [description, file being linted, code, expected rule or null]
const codeCases = [
  [
    'core UI -> optional UI unit',
    'src/shared/ui/Button/x.ts',
    importing('../Carousel'),
    RESTRICTED,
  ],
  [
    'optional UI unit -> another unit',
    'src/shared/ui/PhoneInput/x.ts',
    importing('../date-time'),
    RESTRICTED,
  ],
  [
    'optional UI unit -> core UI',
    'src/shared/ui/PhoneInput/x.ts',
    importing('../TextInput'),
    null,
  ],
  [
    'hard-coded JSX text',
    'src/screens/alpha/x.tsx',
    'export const X = () => <Text>Save</Text>;\n',
    JSX_TEXT,
  ],
  [
    'hard-coded label prop',
    'src/screens/alpha/x.tsx',
    'export const X = () => <Button title="Save" />;\n',
    TEXT_PROP,
  ],
  [
    'hard-coded label in a condition',
    'src/screens/alpha/x.tsx',
    "export const X = (on) => <Button accessibilityLabel={on ? 'Hide' : 'Show'} />;\n",
    TEXT_PROP,
  ],
  [
    'hard-coded default for a label prop',
    'src/shared/ui/Alpha/x.tsx',
    "export const X = ({ closeLabel = 'Close' }) => <Button title={closeLabel} />;\n",
    TEXT_PROP,
  ],
  [
    'translated text and non-text props',
    'src/screens/alpha/x.tsx',
    'export const X = ({ t }) => <Button title={t(\'save\')} variant="ghost" testID="save" />;\n',
    null,
  ],
  [
    'literal text in a test',
    'src/screens/alpha/x.test.tsx',
    'export const X = () => <Text>Save</Text>;\n',
    null,
  ],
];

const ARCHITECTURE_RULES = new Set([
  DEPENDENCIES,
  RESTRICTED,
  JSX_TEXT,
  TEXT_PROP,
]);

async function main() {
  // The resolver reads ./tsconfig.json from the process cwd, not the ESLint cwd.
  process.chdir(fixtures);

  const eslint = new ESLint({
    cwd: fixtures,
    overrideConfigFile: path.join(__dirname, '..', 'eslint.config.js'),
    ignore: false,
  });

  let failures = 0;

  const all = [
    ...cases.map(([description, file, source, expected]) => [
      description,
      file,
      importing(source),
      expected,
    ]),
    ...codeCases,
  ];

  for (const [description, file, code, expected] of all) {
    const [result] = await eslint.lintText(code, {
      filePath: path.join(fixtures, file),
    });
    const fired = [
      ...new Set(
        result.messages
          .map(({ ruleId }) => ruleId)
          .filter(ruleId => ARCHITECTURE_RULES.has(ruleId)),
      ),
    ];
    const passed = expected
      ? fired.length === 1 && fired[0] === expected
      : fired.length === 0;

    if (!passed) {
      failures += 1;
      console.error(
        `FAIL ${description}: expected ${expected ?? 'no error'}, got ${fired.join(', ') || 'no error'}`,
      );
    }
  }

  console.log(
    `boundary fixtures: ${all.length - failures}/${all.length} passed`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
