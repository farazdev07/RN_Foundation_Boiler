import { createAction } from '@reduxjs/toolkit';
import {
  fetchBaseQuery,
  retry,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
} from '@reduxjs/toolkit/query';
import { env } from '@shared/config';
import { devLog } from '@shared/lib/logger';
import { isRetryable, toAppError, type AppError } from './errors';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  rotateTokens,
  type Tokens,
} from './tokens';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

// shared cannot import entities, so it announces the event and entities/session
// reacts to it.
export const sessionExpired = createAction('session/expired');

type RefreshHandler = (refreshToken: string) => Promise<Tokens | null>;

let refreshHandler: RefreshHandler | null = null;
let refreshInFlight: Promise<boolean> | null = null;

// The refresh endpoint is backend-specific, so the session entity supplies it.
export const setRefreshHandler = (handler: RefreshHandler | null): void => {
  refreshHandler = handler;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  prepareHeaders: headers => {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const refresh = async (api: BaseQueryApi): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  const tokens =
    refreshToken && refreshHandler
      ? await refreshHandler(refreshToken).catch(() => null)
      : null;

  if (tokens) {
    await rotateTokens(tokens);
    return true;
  }

  await clearTokens();
  api.dispatch(sessionExpired());
  return false;
};

// Every 401 that arrives during a refresh shares it, so a burst of expired
// requests refreshes once and ends the session at most once.
const refreshOnce = (api: BaseQueryApi): Promise<boolean> => {
  refreshInFlight ??= refresh(api).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

const methodOf = (args: string | FetchArgs): string =>
  typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();

const urlOf = (args: string | FetchArgs): string =>
  typeof args === 'string' ? args : args.url;

type ExtraOptions = object;

const authenticatedQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  AppError,
  ExtraOptions
> = async (args, api, extraOptions) => {
  // A request starting mid-refresh would only 401 with the old token.
  await refreshInFlight;

  const startedAt = Date.now();
  const sentWith = getAccessToken();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && sentWith) {
    // Another request may already have refreshed while this one was in flight.
    const refreshed =
      getAccessToken() !== sentWith ? true : await refreshOnce(api);
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  // Method, path, status and time only: headers and bodies can hold secrets.
  devLog(
    `[api] ${methodOf(args)} ${urlOf(args)} ${result.meta?.response?.status ?? 'failed'} ${Date.now() - startedAt}ms`,
  );

  const meta = result.meta ? { meta: result.meta } : {};

  return result.error
    ? { error: toAppError(result.error), ...meta }
    : { data: result.data, ...meta };
};

// Only GETs repeat: replaying a write could apply it twice.
export const baseQuery = retry(authenticatedQuery, {
  retryCondition: (error, args, { attempt }) =>
    attempt <= MAX_RETRIES &&
    methodOf(args as string | FetchArgs) === 'GET' &&
    isRetryable(error as AppError),
  backoff: attempt =>
    new Promise(resolve => {
      setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    }),
});
