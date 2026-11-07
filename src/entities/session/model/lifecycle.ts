import type { Dispatch } from '@reduxjs/toolkit';
import { z } from 'zod';
import {
  clearTokens,
  readPersistedRefreshToken,
  resumeSession,
} from '@shared/api';
import { defineKey } from '@shared/storage';
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

export const restoreSession = async (dispatch: Dispatch): Promise<void> => {
  if (!installMarker.get()) {
    await clearTokens();
    installMarker.set(true);
  }

  const refreshToken = await readPersistedRefreshToken();
  if (refreshToken) {
    resumeSession(refreshToken);
  }
  dispatch(sessionChecked({ signedIn: refreshToken !== null }));
};

// Tokens go first, so no request can still authenticate once the UI says
// signed out. The rest of the wipe runs on `loggedOut` in sessionCleanup.
export const logout = async (dispatch: Dispatch): Promise<void> => {
  await clearTokens();
  dispatch(loggedOut());
};
