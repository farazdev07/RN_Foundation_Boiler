/**
 * @jest-environment node
 */
import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { z } from 'zod';
import {
  baseApi,
  clearTokens,
  getAccessToken,
  sessionExpired,
  setRefreshHandler,
  setTokens,
} from '@shared/api';

const api = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: build => ({
    item: build.query<{ id: number }, string>({
      query: id => `items/${id}`,
      responseSchema: z.object({ id: z.number() }),
    }),
    save: build.mutation<unknown, void>({
      query: () => ({ url: 'items', method: 'POST' }),
    }),
  }),
});

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const makeStore = () => {
  const actions: string[] = [];
  const recorder: Middleware = () => next => action => {
    actions.push((action as { type: string }).type);
    return next(action);
  };
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: getDefault =>
      getDefault().concat(baseApi.middleware).concat(recorder),
    // Auto-batching schedules animation frames, which the Jest preset runs on
    // timers that can outlive the test environment.
    enhancers: getDefault => getDefault({ autoBatch: false }),
  });
  return { store, actions };
};

const headerOf = (call: unknown[]) =>
  (call[0] as Request).headers.get('Authorization');

const fetchMock = jest.fn<Promise<Response>, [Request]>();
const tokens = { accessToken: 'old', refreshToken: 'refresh' };
const fresh = { accessToken: 'new', refreshToken: 'refresh-2' };

describe('baseQuery', () => {
  beforeEach(async () => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    setRefreshHandler(null);
    await clearTokens();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('attaches the access token', async () => {
    await setTokens(tokens, { persist: false });
    fetchMock.mockResolvedValueOnce(json(200, { id: 1 }));
    const { store } = makeStore();

    const result = await store.dispatch(
      api.endpoints.item.initiate('1', { subscribe: false }),
    );

    expect(result.data).toEqual({ id: 1 });
    expect(headerOf(fetchMock.mock.calls[0]!)).toBe('Bearer old');
  });

  it('sends no Authorization header when signed out', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { id: 1 }));
    const { store } = makeStore();

    await store.dispatch(
      api.endpoints.item.initiate('1', { subscribe: false }),
    );

    expect(headerOf(fetchMock.mock.calls[0]!)).toBeNull();
  });

  it('turns a schema mismatch into a parse error', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { id: 'one' }));
    const { store } = makeStore();

    const result = await store.dispatch(
      api.endpoints.item.initiate('1', { subscribe: false }),
    );

    expect(result.error).toMatchObject({ kind: 'parse' });
  });

  describe('on 401', () => {
    it('refreshes and retries once with the new token', async () => {
      await setTokens(tokens, { persist: false });
      const handler = jest.fn(() => Promise.resolve(fresh));
      setRefreshHandler(handler);
      fetchMock
        .mockResolvedValueOnce(json(401))
        .mockResolvedValueOnce(json(200, { id: 1 }));
      const { store } = makeStore();

      const result = await store.dispatch(
        api.endpoints.item.initiate('1', { subscribe: false }),
      );

      expect(result.data).toEqual({ id: 1 });
      expect(handler).toHaveBeenCalledWith('refresh');
      expect(headerOf(fetchMock.mock.calls[1]!)).toBe('Bearer new');
    });

    it('refreshes only once for a burst of expired requests', async () => {
      await setTokens(tokens, { persist: false });
      const handler = jest.fn(() => Promise.resolve(fresh));
      setRefreshHandler(handler);
      fetchMock.mockImplementation(async request =>
        request.headers.get('Authorization') === 'Bearer new'
          ? json(200, { id: 1 })
          : json(401),
      );
      const { store } = makeStore();

      const results = await Promise.all(
        ['1', '2', '3'].map(id =>
          store.dispatch(api.endpoints.item.initiate(id, { subscribe: false })),
        ),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(results.map(({ data }) => data)).toEqual([
        { id: 1 },
        { id: 1 },
        { id: 1 },
      ]);
    });

    it.each([
      ['refresh is rejected', () => Promise.resolve(null)],
      ['refresh throws', () => Promise.reject(new Error('offline'))],
    ])('ends the session once when %s', async (_name, handler) => {
      await setTokens(tokens, { persist: false });
      setRefreshHandler(handler);
      fetchMock.mockImplementation(async () => json(401));
      const { store, actions } = makeStore();

      await Promise.all(
        ['1', '2'].map(id =>
          store.dispatch(api.endpoints.item.initiate(id, { subscribe: false })),
        ),
      );

      expect(actions.filter(type => type === sessionExpired.type)).toHaveLength(
        1,
      );
      expect(getAccessToken()).toBeNull();
    });

    it('does not refresh a request sent without a token', async () => {
      const handler = jest.fn(() => Promise.resolve(fresh));
      setRefreshHandler(handler);
      fetchMock.mockResolvedValueOnce(json(401, { message: 'Bad login' }));
      const { store } = makeStore();

      const result = await store.dispatch(
        api.endpoints.item.initiate('1', { subscribe: false }),
      );

      expect(handler).not.toHaveBeenCalled();
      expect(result.error).toEqual({
        kind: 'http',
        status: 401,
        message: 'Bad login',
      });
    });
  });

  describe('retries', () => {
    it('repeats a GET after a server error', async () => {
      fetchMock
        .mockResolvedValueOnce(json(503))
        .mockResolvedValueOnce(json(200, { id: 1 }));
      const { store } = makeStore();

      const result = await store.dispatch(
        api.endpoints.item.initiate('1', { subscribe: false }),
      );

      expect(result.data).toEqual({ id: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('gives up after the retry limit', async () => {
      fetchMock.mockImplementation(async () => json(503));
      const { store } = makeStore();

      const result = await store.dispatch(
        api.endpoints.item.initiate('1', { subscribe: false }),
      );

      expect(result.error).toMatchObject({ kind: 'http', status: 503 });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('never repeats a write', async () => {
      fetchMock.mockResolvedValueOnce(json(503));
      const { store } = makeStore();

      const result = await store.dispatch(
        api.endpoints.save.initiate(undefined, { track: false }),
      );

      expect(result).toMatchObject({ error: { kind: 'http', status: 503 } });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not repeat a client error', async () => {
      fetchMock.mockResolvedValueOnce(json(404));
      const { store } = makeStore();

      await store.dispatch(
        api.endpoints.item.initiate('1', { subscribe: false }),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('reports a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const { store } = makeStore();

    const result = await store.dispatch(
      api.endpoints.item.initiate('1', { subscribe: false }),
    );

    expect(result.error).toEqual({ kind: 'network' });
  });
});
