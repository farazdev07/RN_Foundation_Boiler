import { Linking } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { appVersion } from '@shared/config';
import { common, initI18n } from '@shared/lib/i18n';
import { ThemeProvider } from '@shared/ui';
import { versionGateStrings } from '../i18n';
import { VersionGate } from './VersionGate';

const URL = 'https://config.test/app.json';
const store = 'https://store.test/app';

const respondWith = (body: unknown, status = 200) =>
  jest.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  ) as unknown as typeof fetch;

const renderGate = (configUrl: string | undefined) =>
  render(
    <ThemeProvider>
      <VersionGate configUrl={configUrl} />
    </ThemeProvider>,
  );

const platforms = (entry: object) => ({ ios: entry, android: entry });

describe('VersionGate', () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

  beforeAll(() => {
    initI18n({ common, versionGate: versionGateStrings });
  });

  beforeEach(() => {
    createMMKV({ id: 'device' }).clearAll();
    openURL.mockClear();
    // A failed config fetch is reported, which logs in tests.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('blocks an unsupported version and sends the user to the store', async () => {
    globalThis.fetch = respondWith(
      platforms({ minVersion: '99.0.0', storeUrl: store }),
    );
    await renderGate(URL);

    await fireEvent.press(await screen.findByTestId('version-gate-update'));

    expect(openURL).toHaveBeenCalledWith(store);
    // Still blocked: opening the store does not let the old version through.
    expect(screen.getByTestId('version-gate-required')).toBeOnTheScreen();
  });

  const optional = platforms({
    minVersion: '0.0.1',
    latestVersion: '99.0.0',
    storeUrl: store,
  });

  it('offers a newer version, and remembers "Later" for that version', async () => {
    globalThis.fetch = respondWith(optional);
    await renderGate(URL);

    expect(await screen.findByText('Update available')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('version-gate-optional-cancel'));

    await waitFor(() =>
      expect(screen.queryByText('Update available')).toBeNull(),
    );
    expect(
      createMMKV({ id: 'device' }).getString('versionGate.dismissed'),
    ).toBe('{"v":1,"d":"99.0.0"}');
  });

  it('does not offer a version the user already said "Later" to', async () => {
    createMMKV({ id: 'device' }).set(
      'versionGate.dismissed',
      '{"v":1,"d":"99.0.0"}',
    );
    globalThis.fetch = respondWith(optional);
    await renderGate(URL);

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(screen.queryByText('Update available')).toBeNull();
  });

  it('shows maintenance with the server message, and clears it on retry', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            maintenance: { active: true, message: 'Back at 9' },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ maintenance: { active: false } })),
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await renderGate(URL);

    expect(await screen.findByText('Back at 9')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('version-gate-retry'));

    await waitFor(() =>
      expect(screen.queryByTestId('version-gate-maintenance')).toBeNull(),
    );
  });

  it.each([
    ['the request fails', () => Promise.reject(new TypeError('offline'))],
    [
      'the server errors',
      () => Promise.resolve(new Response('', { status: 500 })),
    ],
    [
      'the document is malformed',
      () => Promise.resolve(new Response('{"ios":1}')),
    ],
  ])('lets the app through when %s', async (_case, respond) => {
    const fetchMock = jest.fn(respond);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await renderGate(URL);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByTestId('version-gate-required')).toBeNull();
    expect(screen.queryByTestId('version-gate-maintenance')).toBeNull();
  });

  it('does nothing without a config URL', async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await renderGate(undefined);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('compares against the version in package.json', () => {
    expect(appVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
