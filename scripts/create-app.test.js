/**
 * @jest-environment node
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp, stripUnitMarkers, validate } = require('./create-app');

const write = (root, file, content) => {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
};
const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');

const options = {
  name: 'AcmeShop',
  'bundle-id': 'com.acme.shop',
  'display-name': 'Acme Shop',
};

describe('stripUnitMarkers', () => {
  it('removes single tagged lines and marked blocks, keeping the rest', () => {
    const source = [
      'keep one',
      'drop line // @unit:socket',
      '// @unit-start:socket',
      'drop block',
      '// @unit-end:socket',
      'keep two',
    ].join('\n');

    expect(stripUnitMarkers(source, 'socket')).toEqual({
      text: 'keep one\nkeep two',
      found: true,
    });
  });

  it('ignores markers belonging to another unit', () => {
    const source = 'line // @unit:media';

    expect(stripUnitMarkers(source, 'socket')).toEqual({
      text: source,
      found: false,
    });
  });

  it('rejects an unclosed block', () => {
    expect(() => stripUnitMarkers('// @unit-start:socket', 'socket')).toThrow(
      'Unclosed',
    );
  });
});

describe('validate', () => {
  it.each([
    [{ name: 'acme', bundleId: 'com.acme.app', displayName: 'A' }, '--name'],
    [{ name: 'Acme', bundleId: 'acme', displayName: 'A' }, '--bundle-id'],
    [{ name: 'Acme', bundleId: 'com.acme.app' }, '--display-name'],
  ])('rejects %j', (identity, message) => {
    expect(() => validate(identity)).toThrow(message);
  });
});

describe('createApp', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'create-app-'));
    write(
      root,
      'package.json',
      '{"name":"rn-foundation","dependencies":{"socket.io-client":"1.0.0","react":"1.0.0"}}',
    );
    write(
      root,
      'app.json',
      '{"name":"RNFoundation","displayName":"RN Foundation"}',
    );
    write(
      root,
      'android/app/build.gradle',
      'namespace "com.faraz.foundation"\nresValue "string", "app_name", "RN Foundation Dev"',
    );
    write(
      root,
      'android/app/src/main/java/com/faraz/foundation/MainActivity.kt',
      'package com.faraz.foundation\n"RNFoundation"',
    );
    write(root, 'ios/Podfile', "target 'RNFoundation' do");
    write(root, 'ios/RNFoundation/Info.plist', '<string>RNFoundation</string>');
    write(
      root,
      'ios/RNFoundation.xcodeproj/project.pbxproj',
      'PRODUCT_BUNDLE_IDENTIFIER = com.faraz.foundation.dev;',
    );
    write(
      root,
      'ios/RNFoundation.xcodeproj/xcshareddata/xcschemes/RNFoundation-Dev.xcscheme',
      'RNFoundation.app',
    );
    write(root, 'ios/Podfile.lock', 'stale');
    write(
      root,
      'src/app/services/AppServices.tsx',
      'keep\nuseSocket(); // @unit:socket',
    );
    write(root, 'src/shared/api/socket/index.ts', 'export {};');
    write(
      root,
      'units.json',
      JSON.stringify({
        socket: {
          paths: ['src/shared/api/socket'],
          packages: ['socket.io-client'],
          touchpoints: ['src/app/services/AppServices.tsx'],
        },
      }),
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('renames identifiers, native paths and schemes', () => {
    createApp(root, options);

    expect(JSON.parse(read(root, 'package.json')).name).toBe('acme-shop');
    expect(JSON.parse(read(root, 'app.json'))).toEqual({
      name: 'AcmeShop',
      displayName: 'Acme Shop',
    });
    expect(read(root, 'android/app/build.gradle')).toBe(
      'namespace "com.acme.shop"\nresValue "string", "app_name", "Acme Shop Dev"',
    );
    expect(
      read(root, 'android/app/src/main/java/com/acme/shop/MainActivity.kt'),
    ).toBe('package com.acme.shop\n"AcmeShop"');
    expect(
      fs.existsSync(path.join(root, 'android/app/src/main/java/com/faraz')),
    ).toBe(false);
    expect(read(root, 'ios/AcmeShop.xcodeproj/project.pbxproj')).toContain(
      'com.acme.shop.dev',
    );
    expect(
      fs.existsSync(
        path.join(
          root,
          'ios/AcmeShop.xcodeproj/xcshareddata/xcschemes/AcmeShop-Dev.xcscheme',
        ),
      ),
    ).toBe(true);
    expect(fs.existsSync(path.join(root, 'ios/AcmeShop/Info.plist'))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(root, 'ios/Podfile.lock'))).toBe(false);
  });

  it('removes a unit with its folder, package and touchpoints', () => {
    createApp(root, { ...options, remove: 'socket' });

    expect(fs.existsSync(path.join(root, 'src/shared/api/socket'))).toBe(false);
    expect(read(root, 'src/app/services/AppServices.tsx')).toBe('keep');
    expect(JSON.parse(read(root, 'package.json')).dependencies).toEqual({
      react: '1.0.0',
    });
    expect(JSON.parse(read(root, 'units.json'))).toEqual({});
  });

  it('fails when a touchpoint has lost its marker', () => {
    write(root, 'src/app/services/AppServices.tsx', 'no marker here');

    expect(() => createApp(root, { ...options, remove: 'all' })).toThrow(
      'no marker found',
    );
  });

  it('rejects an unknown unit', () => {
    expect(() => createApp(root, { ...options, remove: 'nope' })).toThrow(
      'Unknown unit',
    );
  });
});
