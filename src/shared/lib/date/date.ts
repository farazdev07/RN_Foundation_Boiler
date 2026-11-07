export const getDeviceTimeZone = (fallback = 'UTC'): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;

export const formatDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  locale?: string,
): string => new Intl.DateTimeFormat(locale, options).format(date);

export const formatTime = (date: Date, locale?: string): string =>
  formatDate(date, { timeStyle: 'short' }, locale);
