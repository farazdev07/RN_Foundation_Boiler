import { compareVersions, decide, type AppConfig } from './versionGate';

describe('compareVersions', () => {
  it.each([
    ['1.2.3', '1.2.3', 0],
    ['1.2.3', '1.2.4', -1],
    ['1.10.0', '1.9.9', 1],
    ['2.0', '2.0.0', 0],
    ['1.4.0-beta.2', '1.4.0', 0],
    ['1.4.0+77', '1.4.1', -1],
    ['nonsense', '0.0.1', -1],
  ] as const)('%s against %s is %i', (left, right, expected) => {
    expect(compareVersions(left, right)).toBe(expected);
  });
});

describe('decide', () => {
  const store = 'https://store.test/app';
  const config: AppConfig = {
    ios: { minVersion: '2.0.0', latestVersion: '2.3.0', storeUrl: store },
    android: { minVersion: '1.5.0', storeUrl: store },
  };

  it('blocks a version below the minimum', () => {
    expect(decide(config, '1.9.9', 'ios')).toEqual({
      kind: 'required',
      storeUrl: store,
    });
  });

  it('offers an update between the minimum and the latest', () => {
    expect(decide(config, '2.1.0', 'ios')).toEqual({
      kind: 'optional',
      storeUrl: store,
      latestVersion: '2.3.0',
    });
  });

  it('lets the latest version, and a newer one, through', () => {
    expect(decide(config, '2.3.0', 'ios')).toEqual({ kind: 'ok' });
    expect(decide(config, '3.0.0', 'ios')).toEqual({ kind: 'ok' });
  });

  it('reads each platform from its own entry', () => {
    expect(decide(config, '1.9.9', 'android')).toEqual({ kind: 'ok' });
    expect(decide({ ios: config.ios }, '0.1.0', 'android')).toEqual({
      kind: 'ok',
    });
  });

  it('puts maintenance ahead of everything else', () => {
    expect(
      decide(
        { ...config, maintenance: { active: true, message: 'Back at 9' } },
        '1.0.0',
        'ios',
      ),
    ).toEqual({ kind: 'maintenance', message: 'Back at 9' });
    expect(
      decide({ ...config, maintenance: { active: false } }, '2.3.0', 'ios'),
    ).toEqual({ kind: 'ok' });
  });
});
