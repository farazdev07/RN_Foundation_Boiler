import type { Dispatch } from '@reduxjs/toolkit';
import { z } from 'zod';
import {
  clearTokens,
  readPersistedRefreshToken,
  resumeSession,
} from '@shared/api';
import { defineKey } from '@shared/storage';
import { wipeSessionData } from './sessionCleanup';
import { loggedOut, sessionChecked } from './sessionSlice';

// MMKV is deleted with the app but the iOS Keychain is not. A missing marker
// means a fresh install, so a refresh token found now belongs to a previous one.
const installMarker = defineKey({
  name: 'app.installed',
  schema: z.literal(true),
  version: 1,
  kind: 'cache',
  scope: 'device',
});

type RestoreOptions = {
  // Runs before a saved session is resumed, such as a biometric check. A false
  // result ends the session as a full logout, so whoever signs in next starts
  // with nothing left from the previous account.
  unlock?: () => Promise<boolean>;
};

export const restoreSession = async (
  dispatch: Dispatch,
  { unlock }: RestoreOptions = {},
): Promise<void> => {
  if (!installMarker.get()) {
    await clearTokens();
    installMarker.set(true);
  }

  const refreshToken = await readPersistedRefreshToken();
  if (!refreshToken) {
    dispatch(sessionChecked({ signedIn: false }));
    return;
  }

  const unlocked = unlock ? await unlock().catch(() => false) : true;
  if (!unlocked) {
    await logout(dispatch);
    return;
  }

  resumeSession(refreshToken);
  dispatch(sessionChecked({ signedIn: true }));
};

// Tokens go first, so no request can still authenticate once the UI says
// signed out. Resolves only after every trace of the account is gone.
export const logout = async (dispatch: Dispatch): Promise<void> => {
  await clearTokens();
  dispatch(loggedOut());
  await wipeSessionData(dispatch);
};
