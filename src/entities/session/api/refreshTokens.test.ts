/**
 * @jest-environment node
 */
import { refreshTokens } from './refreshTokens';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

describe('refreshTokens', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('posts the refresh token and returns the new pair', async () => {
    fetchMock.mockResolvedValue(
      json(200, { accessToken: 'a2', refreshToken: 'r2', extra: true }),
    );

    const result = await refreshTokens('r1');

    expect(result).toEqual({
      ok: true,
      value: { accessToken: 'a2', refreshToken: 'r2' },
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.test/auth/refresh');
    expect(JSON.parse(init.body as string)).toMatchObject({
      refreshToken: 'r1',
    });
  });

  it.each([400, 401, 403])('treats %i as a rejected token', async status => {
    fetchMock.mockResolvedValue(json(status, {}));

    expect(await refreshTokens('r1')).toEqual({ ok: false, error: 'rejected' });
  });

  it.each([
    ['a server error', () => Promise.resolve(json(503, {}))],
    [
      'a network failure',
      () => Promise.reject(new TypeError('Network request failed')),
    ],
    ['an unexpected body', () => Promise.resolve(json(200, { token: 'x' }))],
  ])(
    'treats %s as unavailable, keeping the session',
    async (_name, respond) => {
      fetchMock.mockImplementation(respond);

      expect(await refreshTokens('r1')).toEqual({
        ok: false,
        error: 'unavailable',
      });
    },
  );
});
