import { resolveAssetUrl } from '@shared/lib/url';

describe('resolveAssetUrl', () => {
  it.each([
    ['https://other.cdn/a.png', 'https://other.cdn/a.png'],
    ['HTTP://legacy/a.png', 'HTTP://legacy/a.png'],
    ['img/a.png', 'https://cdn.test/img/a.png'],
    ['/img/a.png', 'https://cdn.test/img/a.png'],
  ])('%p -> %p', (path, expected) => {
    expect(resolveAssetUrl(path)).toBe(expected);
  });

  it('joins a base with a trailing slash cleanly', () => {
    expect(resolveAssetUrl('a.png', 'https://cdn.x/')).toBe(
      'https://cdn.x/a.png',
    );
  });

  it.each([null, undefined, ''])('returns null for %p', path => {
    expect(resolveAssetUrl(path)).toBeNull();
  });
});
