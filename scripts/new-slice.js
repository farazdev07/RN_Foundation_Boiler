#!/usr/bin/env node
// Scaffolds a slice so every one starts with the same shape: a public index.ts,
// its own strings, and a co-located test. See "Adding a feature" in the README.
//
//   node scripts/new-slice.js feature rate-product
//   node scripts/new-slice.js entity order
//   node scripts/new-slice.js screen order-history
const fs = require('fs');
const path = require('path');

const LAYERS = { feature: 'features', entity: 'entities', screen: 'screens' };

const pascal = name =>
  name
    .split('-')
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('');
const camel = name => pascal(name).replace(/^./, first => first.toLowerCase());
const words = name =>
  name.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());

function validate(layer, name) {
  if (!LAYERS[layer]) {
    throw new Error(
      `Unknown layer "${layer}". Use one of: ${Object.keys(LAYERS).join(', ')}`,
    );
  }
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name ?? '')) {
    throw new Error('The name must be kebab-case, e.g. rate-product');
  }
}

const stringsFile = (ns, title) =>
  `export const ${ns} = {\n  title: '${title}',\n};\n`;

function featureFiles(name) {
  const ns = camel(name);
  const Component = pascal(name);
  return {
    'i18n/en.ts': stringsFile(ns, words(name)),
    'index.ts': `export { ${ns} as ${ns}Strings } from './i18n/en';
export { ${Component} } from './ui/${Component}';
`,
    [`ui/${Component}.tsx`]: `import { useTranslation } from '@shared/lib/i18n';
import { Button } from '@shared/ui';

type Props = {
  // Features never navigate. The screen decides what happens next.
  onDone: () => void;
};

export function ${Component}({ onDone }: Props) {
  const { t } = useTranslation('${ns}');

  return <Button title={t('title')} onPress={onDone} />;
}
`,
    [`ui/${Component}.test.tsx`]: `import { fireEvent, render, screen } from '@testing-library/react-native';
import { common, initI18n } from '@shared/lib/i18n';
import { ThemeProvider } from '@shared/ui';
import { ${ns}Strings } from '../index';
import { ${Component} } from './${Component}';

// A starting point: replace it with tests for what this feature does.
describe('${Component}', () => {
  beforeAll(() => {
    initI18n({ common, ${ns}: ${ns}Strings });
  });

  it('reports back to the screen', async () => {
    const onDone = jest.fn();
    await render(
      <ThemeProvider>
        <${Component} onDone={onDone} />
      </ThemeProvider>,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: ${ns}Strings.title }),
    );

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
`,
  };
}

function screenFiles(name) {
  const ns = camel(name);
  const Component = `${pascal(name)}Screen`;
  return {
    'i18n/en.ts': stringsFile(ns, words(name)),
    'index.ts': `export { ${ns} as ${ns}Strings } from './i18n/en';
export { ${Component} } from './ui/${Component}';
`,
    [`ui/${Component}.tsx`]: `import { useTranslation } from '@shared/lib/i18n';
import { Screen, Text } from '@shared/ui';

export function ${Component}() {
  const { t } = useTranslation('${ns}');

  return (
    <Screen>
      <Text variant="title">{t('title')}</Text>
    </Screen>
  );
}
`,
  };
}

function entityFiles(name) {
  const ns = camel(name);
  const Type = pascal(name);
  return {
    'index.ts': `export { ${ns}Schema, type ${Type} } from './model/${ns}';
`,
    [`model/${ns}.ts`]: `import { z } from 'zod';

// Only the fields the app reads. Unknown fields from the server are dropped.
export const ${ns}Schema = z.object({
  id: z.number().int(),
});

export type ${Type} = z.infer<typeof ${ns}Schema>;
`,
    [`model/${ns}.test.ts`]: `import { ${ns}Schema } from './${ns}';

// A starting point: extend it as the schema grows.
describe('${ns}Schema', () => {
  it('drops fields the app does not read', () => {
    expect(${ns}Schema.parse({ id: 1, internal: 'x' })).toEqual({ id: 1 });
  });

  it('rejects a response without an id', () => {
    expect(${ns}Schema.safeParse({}).success).toBe(false);
  });
});
`,
  };
}

// A feature and a screen with the same name would share one i18n namespace.
function assertNamespaceFree(root, name) {
  const file = path.join(root, 'src/app/i18n/index.ts');
  if (fs.readFileSync(file, 'utf8').includes(`${camel(name)}Strings`)) {
    throw new Error(
      `The i18n namespace "${camel(name)}" is already registered; choose another name`,
    );
  }
}

// Adds the slice's strings to app/i18n: an import, and a namespace entry.
function registerStrings(root, layer, name) {
  const file = path.join(root, 'src/app/i18n/index.ts');
  const ns = camel(name);
  const text = fs.readFileSync(file, 'utf8');
  const importAnchor = "import { common, initI18n } from '@shared/lib/i18n';";
  const entryAnchor = '\n});';
  if (!text.includes(importAnchor) || !text.includes(entryAnchor)) {
    throw new Error(
      'src/app/i18n/index.ts has changed shape; register the strings by hand',
    );
  }
  fs.writeFileSync(
    file,
    text
      .replace(
        importAnchor,
        `import { ${ns}Strings } from '@${LAYERS[layer]}/${name}';\n${importAnchor}`,
      )
      .replace(entryAnchor, `\n  ${ns}: ${ns}Strings,${entryAnchor}`),
  );
}

function createSlice(root, layer, name) {
  validate(layer, name);
  const directory = path.join(root, 'src', LAYERS[layer], name);
  if (fs.existsSync(directory)) {
    throw new Error(`${path.relative(root, directory)} already exists`);
  }

  const files = {
    feature: featureFiles,
    screen: screenFiles,
    entity: entityFiles,
  }[layer](name);
  if (files['i18n/en.ts']) {
    assertNamespaceFree(root, name);
  }
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(directory, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  if (files['i18n/en.ts']) {
    registerStrings(root, layer, name);
  }
  return Object.keys(files).map(file =>
    path.join('src', LAYERS[layer], name, file),
  );
}

const NEXT_STEPS = {
  feature: 'Compose it in a screen. It takes callbacks; it never navigates.',
  entity:
    'Inject its endpoints into baseApi with this schema as the responseSchema.',
  screen:
    'Add its route in src/app/navigation/RootNavigator.tsx (wrap it in layout: routeLayout).',
};

if (require.main === module) {
  const [layer, name] = process.argv.slice(2);
  try {
    const created = createSlice(path.join(__dirname, '..'), layer, name);
    created.forEach(file => console.log(`created ${file}`));
    console.log(NEXT_STEPS[layer]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createSlice };
