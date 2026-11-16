import { parsePins, pinningConfig } from './pinning';

describe('certificate pinning config', () => {
  it('reads a comma-separated list and ignores blanks', () => {
    expect(parsePins(' aaa= , bbb=,, ')).toEqual(['aaa=', 'bbb=']);
    expect(parsePins('')).toEqual([]);
    expect(parsePins(undefined)).toEqual([]);
  });

  it('is off when there are no pins', () => {
    expect(pinningConfig('https://api.example.com/v1', [])).toEqual({});
  });

  it('pins the API host, and only that host', () => {
    expect(
      pinningConfig('https://api.example.com/v1', ['aaa=', 'bbb=']),
    ).toEqual({
      'api.example.com': {
        includeSubdomains: false,
        publicKeyHashes: ['aaa=', 'bbb='],
      },
    });
  });

  it('refuses a single pin, which would lock users out on renewal', () => {
    expect(() => pinningConfig('https://api.example.com', ['aaa='])).toThrow(
      'at least two pins',
    );
  });
});
