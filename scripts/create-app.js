#!/usr/bin/env node
// Turns a fresh copy of this repo into a new app: sets its name and bundle IDs,
// then removes any optional units. See "Starting a new app" in the README.
//
//   node scripts/create-app.js --name Acme --bundle-id com.acme.app \
//     --display-name "Acme" [--remove products,socket | --remove all]
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CURRENT = {
  name: 'RNFoundation',
  bundleId: 'com.faraz.foundation',
  displayName: 'RN Foundation',
  packageName: 'rn-foundation',
};

const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.yarn',
  'node_modules',
  'Pods',
  'build',
  '.gradle',
  '.cxx',
  'vendor',
  'coverage',
  'docs',
  'tools',
]);
const TEXT_FILE =
  /\.(gradle|kt|swift|m|mm|h|plist|xml|pbxproj|xcscheme|xcworkspacedata|storyboard|json|yml|properties|js|ts|tsx|md)$|(^|\/)(Podfile|Podfile\.lock|Gemfile)$/;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Expected "--option value", got "${key}"`);
    }
    args[key.slice(2)] = value;
  }
  return args;
}

function validate({ name, bundleId, displayName }) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name ?? '')) {
    throw new Error('--name must be PascalCase letters and digits, e.g. Acme');
  }
  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){1,}$/.test(bundleId ?? '')) {
    throw new Error('--bundle-id must look like com.acme.app');
  }
  if (!displayName) {
    throw new Error('--display-name is required');
  }
}

function walk(directory, visit) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full, visit);
    } else {
      visit(full);
    }
  }
}

// The longest strings go first, and "scripts/" keeps its own constants.
function rewriteIdentity(root, identity) {
  const replacements = [
    [CURRENT.bundleId, identity.bundleId],
    [CURRENT.displayName, identity.displayName],
    [CURRENT.name, identity.name],
    [CURRENT.packageName, identity.packageName],
  ];

  walk(root, file => {
    const relative = path.relative(root, file);
    if (relative.startsWith('scripts') || !TEXT_FILE.test(relative)) {
      return;
    }
    const before = fs.readFileSync(file, 'utf8');
    const after = replacements.reduce(
      (text, [from, to]) => text.split(from).join(to),
      before,
    );
    if (after !== before) {
      fs.writeFileSync(file, after);
    }
  });
}

function moveDirectory(from, to) {
  if (!fs.existsSync(from) || from === to) {
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
}

function pruneEmptyParents(directory, stopAt) {
  let current = directory;
  while (current !== stopAt && fs.readdirSync(current).length === 0) {
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

function renameNativePaths(root, { name, bundleId }) {
  const java = path.join(root, 'android/app/src/main/java');
  const oldPackage = path.join(java, ...CURRENT.bundleId.split('.'));
  moveDirectory(oldPackage, path.join(java, ...bundleId.split('.')));
  if (fs.existsSync(path.dirname(oldPackage))) {
    pruneEmptyParents(path.dirname(oldPackage), java);
  }

  const ios = path.join(root, 'ios');
  moveDirectory(path.join(ios, CURRENT.name), path.join(ios, name));
  moveDirectory(
    path.join(ios, `${CURRENT.name}.xcodeproj`),
    path.join(ios, `${name}.xcodeproj`),
  );

  const schemes = path.join(ios, `${name}.xcodeproj/xcshareddata/xcschemes`);
  if (fs.existsSync(schemes)) {
    for (const scheme of fs.readdirSync(schemes)) {
      fs.renameSync(
        path.join(schemes, scheme),
        path.join(schemes, scheme.replace(CURRENT.name, name)),
      );
    }
  }

  // Generated for the old name; `pod install` recreates all of these.
  for (const generated of [
    `${CURRENT.name}.xcworkspace`,
    'Pods',
    'build',
    'Podfile.lock',
  ]) {
    fs.rmSync(path.join(ios, generated), { recursive: true, force: true });
  }
}

// Removes lines tagged `@unit:<name>` and blocks between `@unit-start:<name>`
// and `@unit-end:<name>`. Comment syntax does not matter, so this also works in
// Gradle, XML and plist files.
function stripUnitMarkers(text, unit) {
  const kept = [];
  let insideBlock = false;
  let found = false;

  for (const line of text.split('\n')) {
    if (line.includes(`@unit-start:${unit}`)) {
      insideBlock = true;
      found = true;
    } else if (line.includes(`@unit-end:${unit}`)) {
      insideBlock = false;
    } else if (line.includes(`@unit:${unit}`)) {
      found = true;
    } else if (!insideBlock) {
      kept.push(line);
    }
  }

  if (insideBlock) {
    throw new Error(`Unclosed @unit-start:${unit} block`);
  }
  return { text: kept.join('\n'), found };
}

function removeUnit(root, name, unit) {
  for (const target of unit.paths ?? []) {
    fs.rmSync(path.join(root, target), { recursive: true, force: true });
  }

  // A touchpoint with no marker means the manifest and the code have drifted.
  for (const touchpoint of unit.touchpoints ?? []) {
    const file = path.join(root, touchpoint);
    const result = stripUnitMarkers(fs.readFileSync(file, 'utf8'), name);
    if (!result.found) {
      throw new Error(`Unit "${name}": no marker found in ${touchpoint}`);
    }
    fs.writeFileSync(file, result.text);
  }

  if (unit.packages?.length) {
    const file = path.join(root, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const dependency of unit.packages) {
      delete manifest.dependencies?.[dependency];
      delete manifest.devDependencies?.[dependency];
    }
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

function removeUnits(root, requested) {
  const manifestPath = path.join(root, 'units.json');
  const units = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const names =
    requested === 'all'
      ? Object.keys(units)
      : requested.split(',').filter(Boolean);

  for (const name of names) {
    if (!units[name]) {
      throw new Error(
        `Unknown unit "${name}". Known: ${Object.keys(units).join(', ')}`,
      );
    }
    removeUnit(root, name, units[name]);
    delete units[name];
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(units, null, 2)}\n`);
}

function createApp(root, options) {
  const identity = {
    name: options.name,
    bundleId: options['bundle-id'],
    displayName: options['display-name'],
    packageName: options.name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase(),
  };
  validate(identity);

  if (options.remove) {
    removeUnits(root, options.remove);
  }
  rewriteIdentity(root, identity);
  renameNativePaths(root, identity);
  return identity;
}

if (require.main === module) {
  const root = path.join(__dirname, '..');
  try {
    const identity = createApp(root, parseArgs(process.argv.slice(2)));
    execSync('node scripts/init-env.js', { cwd: root, stdio: 'inherit' });
    console.log(`Created ${identity.name} (${identity.bundleId}). Next:`);
    console.log('  yarn install');
    console.log('  cd ios && bundle exec pod install');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createApp, parseArgs, stripUnitMarkers, validate };
