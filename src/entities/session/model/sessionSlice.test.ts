import { combineReducers, createSlice } from '@reduxjs/toolkit';
import { sessionExpired } from '@shared/api';
import { resetOnSessionEnd, sessionSlice, signedIn } from './sessionSlice';
import { loggedOut } from './sessionSlice';

// Stands in for any slice added later that holds per-user data.
const notes = createSlice({
  name: 'notes',
  initialState: [] as string[],
  reducers: {
    added: (state, action: { payload: string }) => [...state, action.payload],
  },
});

const reducer = resetOnSessionEnd(
  combineReducers({ session: sessionSlice.reducer, notes: notes.reducer }),
);

const signedInWithNotes = () =>
  [signedIn(), notes.actions.added('private')].reduce(
    reducer,
    reducer(undefined, { type: 'init' }),
  );

describe('resetOnSessionEnd', () => {
  it.each([
    ['logout', loggedOut()],
    ['an expired session', sessionExpired()],
  ])(
    'resets every slice on %s and leaves the session signed out',
    (_name, action) => {
      const state = reducer(signedInWithNotes(), action);

      expect(state).toEqual({ session: { status: 'signedOut' }, notes: [] });
    },
  );

  it('leaves state alone for other actions', () => {
    const before = signedInWithNotes();

    expect(reducer(before, { type: 'other' })).toBe(before);
    expect(before.notes).toEqual(['private']);
  });
});
