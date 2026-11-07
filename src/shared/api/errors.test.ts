import { getErrorMessage, type AppError } from '@shared/api';
import { isRetryable, toAppError } from './errors';

describe('toAppError', () => {
  it.each([
    [{ status: 'FETCH_ERROR', error: 'x' }, { kind: 'network' }],
    [{ status: 'TIMEOUT_ERROR', error: 'x' }, { kind: 'timeout' }],
    [
      { status: 'PARSING_ERROR', error: 'bad', originalStatus: 200, data: '' },
      { kind: 'parse', detail: 'bad' },
    ],
    [
      { status: 'CUSTOM_ERROR', error: 'odd' },
      { kind: 'unknown', detail: 'odd' },
    ],
    [
      { status: 404, data: { message: 'Not found' } },
      { kind: 'http', status: 404, message: 'Not found' },
    ],
    [
      { status: 500, data: 'oops' },
      { kind: 'http', status: 500, message: null },
    ],
    [
      { status: 500, data: { message: 1 } },
      { kind: 'http', status: 500, message: null },
    ],
  ] as const)('maps %j', (error, expected) => {
    expect(toAppError(error)).toEqual(expected);
  });
});

describe('isRetryable', () => {
  it.each<[AppError, boolean]>([
    [{ kind: 'network' }, true],
    [{ kind: 'timeout' }, true],
    [{ kind: 'http', status: 503, message: null }, true],
    [{ kind: 'http', status: 404, message: null }, false],
    [{ kind: 'parse', detail: '' }, false],
  ])('%j -> %s', (error, expected) => {
    expect(isRetryable(error)).toBe(expected);
  });
});

describe('getErrorMessage', () => {
  it('prefers the server message', () => {
    expect(
      getErrorMessage({ kind: 'http', status: 400, message: 'Email taken' }),
    ).toBe('Email taken');
  });

  it.each<[AppError, string]>([
    [{ kind: 'network' }, 'connection'],
    [{ kind: 'timeout' }, 'too long'],
    [{ kind: 'http', status: 500, message: null }, 'went wrong'],
    [{ kind: 'unknown', detail: 'x' }, 'went wrong'],
  ])('has a fallback for %j', (error, text) => {
    expect(getErrorMessage(error)).toContain(text);
  });
});
