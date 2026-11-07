// Parses a number from anything a form or API might hand over. Invalid or
// non-finite input becomes the fallback instead of NaN.
export const toNumber = (value: unknown, fallback = 0): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale?: string,
): string => new Intl.NumberFormat(locale, options).format(value);

export const formatCurrency = (
  value: number,
  currency: string,
  locale?: string,
): string => formatNumber(value, { style: 'currency', currency }, locale);
