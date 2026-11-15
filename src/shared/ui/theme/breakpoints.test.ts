import { breakpointFor, pickResponsive } from './breakpoints';

describe('breakpoints', () => {
  it.each([
    [0, 'compact'],
    [393, 'compact'],
    [599, 'compact'],
    [600, 'medium'],
    [839, 'medium'],
    [840, 'expanded'],
    [1366, 'expanded'],
  ] as const)('puts a %i pt window in %s', (width, expected) => {
    expect(breakpointFor(width)).toBe(expected);
  });

  it('falls back to the nearest narrower value', () => {
    expect(pickResponsive({ compact: 1, medium: 2 }, 'expanded')).toBe(2);
    expect(pickResponsive({ compact: 1, expanded: 3 }, 'medium')).toBe(1);
    expect(pickResponsive({ compact: 1, medium: 2 }, 'compact')).toBe(1);
  });

  it('keeps a falsy value that was given on purpose', () => {
    expect(pickResponsive({ compact: 4, medium: 0 }, 'medium')).toBe(0);
  });
});
