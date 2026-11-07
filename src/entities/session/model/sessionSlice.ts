import {
  createSlice,
  type Reducer,
  type UnknownAction,
} from '@reduxjs/toolkit';
import { sessionExpired } from '@shared/api';

export type SessionStatus = 'unknown' | 'signedOut' | 'signedIn';

export type SessionState = { status: SessionStatus };

const initialState: SessionState = { status: 'unknown' };

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Launch finished checking for a saved session.
    sessionChecked: (_state, action: { payload: { signedIn: boolean } }) => ({
      status: action.payload.signedIn ? 'signedIn' : 'signedOut',
    }),
    signedIn: () => ({ status: 'signedIn' as const }),
    loggedOut: () => ({ status: 'signedOut' as const }),
  },
  extraReducers: builder => {
    builder.addCase(sessionExpired, () => ({ status: 'signedOut' as const }));
  },
});

export const { sessionChecked, signedIn, loggedOut } = sessionSlice.actions;

export const selectSessionStatus = (state: {
  session: SessionState;
}): SessionStatus => state.session.status;

// An ended session, by choice or by the server, leaves nothing for the next user.
export const isSessionEnd = (action: UnknownAction): boolean =>
  loggedOut.match(action) || sessionExpired.match(action);

// Wraps the root reducer so every slice, including ones added later, returns to
// its initial state when the session ends. The session slice still sees the
// action, so it ends as `signedOut` rather than `unknown`.
export const resetOnSessionEnd =
  <S>(reducer: Reducer<S>): Reducer<S> =>
  (state, action) =>
    reducer(isSessionEnd(action) ? undefined : state, action);
