import * as Keychain from 'react-native-keychain';
import {
  clearTokens,
  getAccessToken,
  isSessionPersisted,
  readPersistedRefreshToken,
  setTokens,
} from '@shared/api';

const keychain = jest.mocked(Keychain);
const tokens = { accessToken: 'access', refreshToken: 'refresh' };

describe('tokens', () => {
  beforeEach(async () => {
    await clearTokens();
    jest.clearAllMocks();
  });

  it('keeps the access token out of the Keychain', async () => {
    await setTokens(tokens, { persist: true });

    expect(getAccessToken()).toBe('access');
    expect(keychain.setGenericPassword).toHaveBeenCalledTimes(1);
    expect(keychain.setGenericPassword).toHaveBeenCalledWith(
      'auth.refreshToken',
      'refresh',
      expect.anything(),
    );
  });

  it('stores nothing and clears old entries when not persisting', async () => {
    await setTokens(tokens, { persist: false });

    expect(getAccessToken()).toBe('access');
    expect(keychain.setGenericPassword).not.toHaveBeenCalled();
    expect(keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'auth.refreshToken',
    });
  });

  it('reads the persisted refresh token', async () => {
    keychain.getGenericPassword.mockResolvedValueOnce({
      service: 'auth.refreshToken',
      username: 'auth.refreshToken',
      password: 'refresh',
      storage: Keychain.STORAGE_TYPE.AES_GCM,
    });

    await expect(readPersistedRefreshToken()).resolves.toBe('refresh');
  });

  it('clears memory and the Keychain', async () => {
    await setTokens(tokens, { persist: true });

    await clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(keychain.resetGenericPassword).toHaveBeenCalled();
  });

  it('reports whether the session survives a restart', async () => {
    expect(isSessionPersisted()).toBe(false);

    await setTokens(tokens, { persist: false });
    expect(isSessionPersisted()).toBe(false);

    await setTokens(tokens, { persist: true });
    expect(isSessionPersisted()).toBe(true);
  });
});
