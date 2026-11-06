import { env, parseEnv } from '@shared/config';

const valid = {
  APP_ENV: 'prod',
  API_URL: 'https://api.example.com',
  CDN_URL: 'https://cdn.example.com',
};

describe('parseEnv', () => {
  it('accepts a complete environment', () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it('reads the build environment at startup', () => {
    expect(env.APP_ENV).toBe('dev');
  });

  it.each([
    ['a missing value', { ...valid, API_URL: undefined }],
    ['an unknown environment', { ...valid, APP_ENV: 'qa' }],
    ['a malformed URL', { ...valid, CDN_URL: 'not a url' }],
  ])('rejects %s', (_name, source) => {
    expect(() => parseEnv(source)).toThrow('Invalid environment');
  });

  it('requires HTTPS outside dev', () => {
    expect(() =>
      parseEnv({ ...valid, API_URL: 'http://api.example.com' }),
    ).toThrow('HTTPS');
  });

  it('allows a local HTTP API in dev', () => {
    const local = { ...valid, APP_ENV: 'dev', API_URL: 'http://10.0.2.2:3000' };

    expect(parseEnv(local).API_URL).toBe(local.API_URL);
  });
});
