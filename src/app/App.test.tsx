import { createMMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';
import { z } from 'zod';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import App from '@app/App';
import { store } from '@app/store/store';
import { logout } from '@entities/session';
import { getCurrentUser } from '@entities/user';
import { getAccessToken } from '@shared/api';
import { defineKey } from '@shared/storage';

// The whole app runs for real: store, navigation, storage and the Keychain mock.
// Only the network is faked, as a small dummyjson stand-in.
const users = {
  emilys: { id: 1, firstName: 'Emily', password: 'emilyspass' },
  michaelw: { id: 2, firstName: 'Michael', password: 'michaelwpass' },
} as const;
type Username = keyof typeof users;

const revokedRefreshTokens = new Set<string>();
const expiredAccessTokens = new Set<string>();
const meAuthHeaders: (string | null)[] = [];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const issueTokens = (username: string, generation: number) => ({
  accessToken: `access-${username}-${generation}`,
  refreshToken: `refresh-${username}-${generation}`,
});

const isUser = (name: string | undefined): name is Username =>
  name !== undefined && name in users;

const fakeServer = async (
  input: string | Request,
  init?: RequestInit,
): Promise<Response> => {
  const request = new Request(input, init);
  const path = new URL(request.url).pathname;

  if (path === '/auth/login') {
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };
    return isUser(username) && users[username].password === password
      ? json(200, { id: users[username].id, ...issueTokens(username, 1) })
      : json(400, { message: 'Invalid credentials' });
  }

  if (path === '/auth/refresh') {
    const { refreshToken } = (await request.json()) as { refreshToken: string };
    const [, username, generation] = refreshToken.split('-');
    return revokedRefreshTokens.has(refreshToken) || !isUser(username)
      ? json(403, { message: 'Invalid refresh token' })
      : json(200, issueTokens(username, Number(generation) + 1));
  }

  if (path === '/auth/me') {
    const header = request.headers.get('Authorization');
    meAuthHeaders.push(header);
    const token = header?.replace('Bearer ', '') ?? '';
    const username = token.split('-')[1];
    return isUser(username) && !expiredAccessTokens.has(token)
      ? json(200, {
          id: users[username].id,
          username,
          email: `${username}@test`,
          firstName: users[username].firstName,
          lastName: 'Test',
        })
      : json(401, { message: 'Invalid/Expired Token!' });
  }

  return json(404, { message: 'Not found' });
};

// Something a feature might keep per user, to prove account data is wiped.
const draftNote = defineKey({
  name: 'test.draftNote',
  schema: z.string(),
  version: 1,
  kind: 'user',
  scope: 'account',
});

const device = () => createMMKV({ id: 'device' });
const account = () => createMMKV({ id: 'account' });

const keychainHas = async (service: string) =>
  (await Keychain.getGenericPassword({ service })) !== false;

const markInstalled = () => device().set('app.installed', '{"v":1,"d":true}');

const signIn = async (
  username: Username,
  { remember = true, password = users[username].password as string } = {},
) => {
  await fireEvent.changeText(screen.getByTestId('login-username'), username);
  await fireEvent.changeText(screen.getByTestId('login-password'), password);
  if (!remember) {
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'Remember me' }),
    );
  }
  await fireEvent.press(screen.getByTestId('login-submit'));
};

const logOutThroughSettings = async () => {
  await fireEvent.press(screen.getByTestId('tab-settings'));
  await fireEvent.press(screen.getByTestId('settings-logout'));
  await fireEvent.press(screen.getByTestId('logout-dialog-confirm'));
  await screen.findByTestId('login-submit');
};

describe('App auth', () => {
  // RTK Query leaves timers running after a test: a 15 s request timeout and a
  // 500 ms subscription sync. Jest gives a finished worker 500 ms to exit, so
  // any pending timer gets it force-exited. Unref'd timers still fire while the
  // process lives but never hold it open. Installed once, so restoring the
  // per-test mocks cannot remove it.
  const realSetTimeout = globalThis.setTimeout;
  beforeAll(() => {
    globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
      const timer = realSetTimeout(...args);
      (timer as unknown as { unref?: () => void }).unref?.();
      return timer;
    }) as typeof setTimeout;
  });

  afterAll(() => {
    globalThis.setTimeout = realSetTimeout;
  });

  beforeEach(() => {
    globalThis.fetch = jest.fn(fakeServer) as typeof fetch;
    revokedRefreshTokens.clear();
    expiredAccessTokens.clear();
    meAuthHeaders.length = 0;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    screen.unmount();
    await logout(store.dispatch);
    device().clearAll();
    jest.restoreAllMocks();
  });

  it('starts on the login screen when there is no saved session', async () => {
    await render(<App />);

    expect(await screen.findByText('Welcome back')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
  });

  it('asks for both fields before calling the server', async () => {
    await render(<App />);
    await fireEvent.press(await screen.findByTestId('login-submit'));

    expect(screen.getAllByText('Required')).toHaveLength(2);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('shows the server error for wrong credentials and stays signed out', async () => {
    await render(<App />);
    await screen.findByTestId('login-submit');

    await signIn('emilys', { password: 'wrong' });

    expect(await screen.findByText('Invalid credentials')).toBeOnTheScreen();
    expect(store.getState().session.status).toBe('signedOut');
    expect(getAccessToken()).toBeNull();
  });

  it('with Remember Me, keeps the refresh token in the Keychain and the username on the device, never the password', async () => {
    await render(<App />);
    await screen.findByTestId('login-submit');

    await signIn('emilys');

    expect(await screen.findByText('Hi, Emily')).toBeOnTheScreen();
    expect(await keychainHas('auth.refreshToken')).toBe(true);
    expect(device().getString('auth.rememberedUsername')).toBe(
      '{"v":1,"d":"emilys"}',
    );

    const everythingStored = [device(), account()]
      .flatMap(kv => kv.getAllKeys().map(key => kv.getString(key) ?? ''))
      .join('\n');
    expect(everythingStored).not.toContain('emilyspass');
    expect(Keychain.setGenericPassword).not.toHaveBeenCalledWith(
      expect.anything(),
      'emilyspass',
      expect.anything(),
    );
  });

  it('without Remember Me, keeps tokens in memory only and forgets the saved username', async () => {
    device().set('auth.rememberedUsername', '{"v":1,"d":"emilys"}');
    await render(<App />);
    expect(await screen.findByDisplayValue('emilys')).toBeOnTheScreen();

    await signIn('emilys', { remember: false });

    expect(await screen.findByText('Hi, Emily')).toBeOnTheScreen();
    expect(getAccessToken()).toBe('access-emilys-1');
    expect(await keychainHas('auth.refreshToken')).toBe(false);
    expect(device().contains('auth.rememberedUsername')).toBe(false);
  });

  it('logout wipes the session, cache, account storage and Keychain, then a second account starts clean', async () => {
    await render(<App />);
    await screen.findByTestId('login-submit');
    await signIn('emilys');
    await screen.findByText('Hi, Emily');
    draftNote.set("Emily's draft");

    await logOutThroughSettings();

    // Nothing of the first account survives.
    const state = store.getState();
    expect(state.session.status).toBe('signedOut');
    expect(state.api.queries).toEqual({});
    expect(state.api.mutations).toEqual({});
    expect(account().getAllKeys()).toEqual([]);
    expect(draftNote.get()).toBeUndefined();
    expect(await keychainHas('auth.refreshToken')).toBe(false);
    expect(getAccessToken()).toBeNull();
    // The username stays for prefill because Remember Me was on.
    expect(screen.getByDisplayValue('emilys')).toBeOnTheScreen();

    // Account switch: the second user never sees the first one's data.
    meAuthHeaders.length = 0;
    await signIn('michaelw');

    expect(await screen.findByText('Hi, Michael')).toBeOnTheScreen();
    expect(screen.queryByText('Hi, Emily')).toBeNull();
    expect(meAuthHeaders).toEqual(['Bearer access-michaelw-1']);
    expect(draftNote.get()).toBeUndefined();
  });

  it('restores a remembered session on launch and refreshes it on the first request', async () => {
    markInstalled();
    await Keychain.setGenericPassword('auth.refreshToken', 'refresh-emilys-1', {
      service: 'auth.refreshToken',
    });

    await render(<App />);

    expect(await screen.findByText('Hi, Emily')).toBeOnTheScreen();
    expect(meAuthHeaders).toEqual([null, 'Bearer access-emilys-2']);
  });

  it('drops a Keychain token left by a previous install', async () => {
    await Keychain.setGenericPassword('auth.refreshToken', 'refresh-emilys-1', {
      service: 'auth.refreshToken',
    });

    await render(<App />);

    expect(await screen.findByTestId('login-submit')).toBeOnTheScreen();
    expect(await keychainHas('auth.refreshToken')).toBe(false);
  });

  it('signs out and wipes account data when the server rejects the refresh token', async () => {
    await render(<App />);
    await screen.findByTestId('login-submit');
    await signIn('emilys');
    await screen.findByText('Hi, Emily');
    draftNote.set("Emily's draft");

    expiredAccessTokens.add('access-emilys-1');
    revokedRefreshTokens.add('refresh-emilys-1');
    // Any authenticated request will do; refetching the user is the simplest.
    await act(async () => {
      await store.dispatch(
        getCurrentUser.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        }),
      );
    });

    expect(await screen.findByTestId('login-submit')).toBeOnTheScreen();
    await waitFor(() => expect(draftNote.get()).toBeUndefined());
    expect(store.getState().session.status).toBe('signedOut');
    expect(await keychainHas('auth.refreshToken')).toBe(false);
  });
});
