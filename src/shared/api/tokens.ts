import { secureStorage } from '@shared/storage';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const REFRESH_TOKEN_KEY = 'auth.refreshToken';

// The access token only ever lives in memory. Without `persist` the refresh token
// does too, so the session ends with the process.
let current: Tokens | null = null;
let persisted = false;

export const getAccessToken = (): string | null => current?.accessToken ?? null;

export const getRefreshToken = (): string | null =>
  current?.refreshToken ?? null;

export const setTokens = async (
  tokens: Tokens,
  { persist }: { persist: boolean },
): Promise<void> => {
  current = tokens;
  persisted = persist;

  if (persist) {
    await secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } else {
    await secureStorage.remove(REFRESH_TOKEN_KEY);
  }
};

// A rotated token keeps the storage mode chosen when the session began.
export const rotateTokens = (tokens: Tokens): Promise<void> =>
  setTokens(tokens, { persist: persisted });

export const readPersistedRefreshToken = (): Promise<string | null> =>
  secureStorage.get(REFRESH_TOKEN_KEY);

export const clearTokens = async (): Promise<void> => {
  current = null;
  persisted = false;
  await secureStorage.remove(REFRESH_TOKEN_KEY);
};
