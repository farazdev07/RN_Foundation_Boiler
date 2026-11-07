import { formatDate, formatTime, getDeviceTimeZone } from '@shared/lib/date';

const date = new Date(Date.UTC(2026, 10, 7, 9, 5));

describe('date', () => {
  it('reads the device time zone', () => {
    expect(getDeviceTimeZone()).toEqual(expect.any(String));
  });

  it('falls back when no zone is reported', () => {
    jest
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValueOnce({
        timeZone: '',
      } as Intl.ResolvedDateTimeFormatOptions);

    expect(getDeviceTimeZone('Asia/Karachi')).toBe('Asia/Karachi');
  });

  it('formats a date for a locale', () => {
    expect(
      formatDate(date, { dateStyle: 'medium', timeZone: 'UTC' }, 'en-US'),
    ).toBe('Nov 7, 2026');
  });

  it('formats a time', () => {
    expect(formatTime(date, 'en-US')).toEqual(expect.stringMatching(/\d/));
  });
});
