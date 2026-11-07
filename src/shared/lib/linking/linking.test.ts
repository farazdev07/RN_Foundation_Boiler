import { Linking, Platform } from 'react-native';
import {
  openDialer,
  openEmail,
  openMap,
  openSms,
  openUrl,
} from '@shared/lib/linking';

const openURL = jest.spyOn(Linking, 'openURL');

const setPlatform = (os: 'ios' | 'android') =>
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

describe('linking', () => {
  beforeEach(() => {
    openURL.mockReset().mockResolvedValue(undefined);
    setPlatform('ios');
  });

  it('opens a URL', async () => {
    await expect(openUrl('https://example.com')).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    expect(openURL).toHaveBeenCalledWith('https://example.com');
  });

  it('reports a failure instead of throwing', async () => {
    openURL.mockRejectedValueOnce(new Error('No handler'));

    await expect(openUrl('weird://')).resolves.toEqual({
      ok: false,
      error: new Error('No handler'),
    });
  });

  it('wraps a non-Error rejection', async () => {
    openURL.mockRejectedValueOnce('nope');

    const result = await openUrl('weird://');

    expect(result).toEqual({ ok: false, error: new Error('nope') });
  });

  it('dials a cleaned number, keeping a leading plus', async () => {
    await openDialer('+92 (300) 123-4567');

    expect(openURL).toHaveBeenCalledWith('tel:+923001234567');
  });

  it.each([openDialer, (n: string) => openSms(n)])(
    'rejects a number with no digits',
    async open => {
      const result = await open('call me');

      expect(result.ok).toBe(false);
      expect(openURL).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['ios', 'sms:123&body=Hi%20there'],
    ['android', 'sms:123?body=Hi%20there'],
  ] as const)('builds an SMS link on %s', async (os, url) => {
    setPlatform(os);

    await openSms('123', 'Hi there');

    expect(openURL).toHaveBeenCalledWith(url);
  });

  it('opens SMS without a body', async () => {
    await openSms('123');

    expect(openURL).toHaveBeenCalledWith('sms:123');
  });

  it('builds a mailto link with only the given fields', async () => {
    await openEmail({ to: 'a@b.co', subject: 'Hello & bye', cc: '' });

    expect(openURL).toHaveBeenCalledWith(
      'mailto:a@b.co?subject=Hello%20%26%20bye',
    );
  });

  it('opens a bare mailto link', async () => {
    await openEmail({ to: 'a@b.co' });

    expect(openURL).toHaveBeenCalledWith('mailto:a@b.co');
  });

  it.each([
    ['ios', 'https://maps.apple.com/?ll=1,2'],
    ['android', 'geo:1,2?q=1,2'],
  ] as const)('opens maps on %s', async (os, url) => {
    setPlatform(os);

    await openMap(1, 2);

    expect(openURL).toHaveBeenCalledWith(url);
  });
});
