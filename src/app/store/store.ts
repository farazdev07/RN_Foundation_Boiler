import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  refreshTokens,
  resetOnSessionEnd,
  sessionCleanup,
  sessionSlice,
} from '@entities/session';
// @unit-start:products
import {
  favoritesPersistence,
  favoritesSlice,
  loadFavorites,
} from '@features/toggle-favorite';
// @unit-end:products
import { baseApi, setRefreshHandler } from '@shared/api';

setRefreshHandler(refreshTokens);

const rootReducer = resetOnSessionEnd(
  combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
    [sessionSlice.name]: sessionSlice.reducer,
    [favoritesSlice.name]: favoritesSlice.reducer, // @unit:products
  }),
);

// Persisted slices are read from MMKV synchronously here, so the first render
// already has them: no rehydration step, no loading gate. Each slice validates
// its own stored shape and falls back to its initial state.
const loadPersistedState = () => ({
  [favoritesSlice.name]: loadFavorites(), // @unit:products
});

export const createStore = () =>
  configureStore({
    reducer: rootReducer,
    preloadedState: loadPersistedState(),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        // RTK Query's cache is written only by RTK itself, through Immer, from
        // parsed JSON. Walking a long product list on every action made these
        // dev-only checks slow enough to warn on an emulator. Every other
        // slice is still checked.
        immutableCheck: { ignoredPaths: [baseApi.reducerPath] },
        serializableCheck: { ignoredPaths: [baseApi.reducerPath] },
      })
        .prepend(sessionCleanup.middleware)
        .prepend(favoritesPersistence.middleware) // @unit:products
        .concat(baseApi.middleware),
  });

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
