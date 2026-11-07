import { createListenerMiddleware } from '@reduxjs/toolkit';
import { baseApi, clearTokens } from '@shared/api';
import { clearAccountStorage } from '@shared/storage';
import { isSessionEnd } from './sessionSlice';

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

// Redux state is reset by resetOnSessionEnd. This clears everything else the
// signed-in user left behind.
export const sessionCleanup = createListenerMiddleware();

sessionCleanup.startListening({
  predicate: isSessionEnd,
  effect: async (_action, api) => {
    // Drops RTK Query's running queries and subscriptions, not just its state.
    api.dispatch(baseApi.util.resetApiState());
    clearAccountStorage();
    // Both current paths have already cleared them; repeated so a future path
    // that ends the session cannot leave a refresh token behind.
    await clearTokens();
    await Promise.all([...cleanups].map(cleanup => cleanup()));
  },
});
