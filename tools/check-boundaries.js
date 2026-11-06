// Proves the architecture rules still bite. A plugin upgrade or config edit can
// silently stop a rule from firing, and a clean lint run would look the same, so
// each case below lints a deliberately chosen import and asserts the exact result.
const path = require('path');
const { ESLint } = require('eslint');

const fixtures = path.join(__dirname, 'boundary-fixtures');
const DEPENDENCIES = 'boundaries/dependencies';
const RESTRICTED = 'no-restricted-imports';

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
];

const ARCHITECTURE_RULES = new Set([DEPENDENCIES, RESTRICTED]);

async function main() {
  // The resolver reads ./tsconfig.json from the process cwd, not the ESLint cwd.
  process.chdir(fixtures);

  const eslint = new ESLint({
    cwd: fixtures,
    overrideConfigFile: path.join(__dirname, '..', 'eslint.config.js'),
    ignore: false,
  });

  let failures = 0;

  for (const [description, file, source, expected] of cases) {
    const [result] = await eslint.lintText(importing(source), {
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
    `boundary fixtures: ${cases.length - failures}/${cases.length} passed`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
