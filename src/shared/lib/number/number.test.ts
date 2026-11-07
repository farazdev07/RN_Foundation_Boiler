import {
  formatCurrency,
  formatNumber,
  roundTo,
  toNumber,
} from '@shared/lib/number';

describe('toNumber', () => {
  it.each([
    [42, 42],
    ['3.5', 3.5],
    [' 7 ', 7],
    ['', 0],
    ['abc', 0],
    [null, 0],
    [undefined, 0],
    [Number.NaN, 0],
    [Infinity, 0],
    [{}, 0],
  ])('%p -> %p', (input, expected) => {
    expect(toNumber(input)).toBe(expected);
  });

  it('uses the given fallback', () => {
    expect(toNumber('x', -1)).toBe(-1);
  });
});

describe('roundTo', () => {
  it('rounds to the given decimals', () => {
    expect(roundTo(1.005, 2)).toBe(1);
    expect(roundTo(2.345, 1)).toBe(2.3);
    expect(roundTo(2.5)).toBe(2.5);
  });
});

describe('formatting', () => {
  it('formats with grouping for a locale', () => {
    expect(formatNumber(1234567.8, {}, 'en-US')).toBe('1,234,567.8');
  });

  it('formats currency for a locale', () => {
    expect(formatCurrency(1500, 'USD', 'en-US')).toBe('$1,500.00');
  });
});
