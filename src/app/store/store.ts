import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  refreshTokens,
  resetOnSessionEnd,
  sessionCleanup,
  sessionSlice,
} from '@entities/session';
import { baseApi, setRefreshHandler } from '@shared/api';

setRefreshHandler(refreshTokens);

const rootReducer = resetOnSessionEnd(
  combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
    [sessionSlice.name]: sessionSlice.reducer,
  }),
);

export const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware()
        .prepend(sessionCleanup.middleware)
        .concat(baseApi.middleware),
  });

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
