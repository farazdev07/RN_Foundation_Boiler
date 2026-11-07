import { createListenerMiddleware, type Dispatch } from '@reduxjs/toolkit';
import { baseApi, clearTokens, sessionExpired } from '@shared/api';
import { clearAccountStorage } from '@shared/storage';

type Cleanup = () => void | Promise<void>;

const cleanups = new Set<Cleanup>();

// Slices that keep their own per-user data outside Redux (a biometric Keychain
// entry, say) register a cleanup here instead of this file importing them.
export const onSessionEnd = (cleanup: Cleanup): (() => void) => {
  cleanups.add(cleanup);
  return () => {
    cleanups.delete(cleanup);
  };
};

const runWipe = async (dispatch: Dispatch): Promise<void> => {
  // Drops RTK Query's running queries and subscriptions, not just its state.
  dispatch(baseApi.util.resetApiState());
  clearAccountStorage();
  await clearTokens();
  await Promise.all([...cleanups].map(cleanup => cleanup()));
};

let pending: Promise<void> = Promise.resolve();

// Clears everything the signed-in user left outside Redux; Redux itself is
// reset by resetOnSessionEnd. Wipes run one at a time, and the returned
// promise settles when this one and any before it are done.
export const wipeSessionData = (dispatch: Dispatch): Promise<void> => {
  pending = pending.then(() => runWipe(dispatch)).catch(() => undefined);
  return pending;
};

// Sign-in waits on this, so a wipe still running from an expired session can
// never clear the tokens of the session that follows it.
export const whenSessionWiped = (): Promise<void> => pending;

// Logout awaits the wipe itself. A session the server ends arrives as an
// action from the base query, with no caller to wait, so it is handled here.
export const sessionCleanup = createListenerMiddleware();

sessionCleanup.startListening({
  actionCreator: sessionExpired,
  effect: async (_action, api) => {
    await wipeSessionData(api.dispatch);
  },
});
