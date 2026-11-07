import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export type AppError =
  | { kind: 'network' }
  | { kind: 'timeout' }
  | { kind: 'parse'; detail: string }
  | { kind: 'http'; status: number; message: string | null }
  | { kind: 'unknown'; detail: string };

const readServerMessage = (data: unknown): string | null => {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const { message } = data as { message?: unknown };
  return typeof message === 'string' ? message : null;
};

export const toAppError = (error: FetchBaseQueryError): AppError => {
  switch (error.status) {
    case 'FETCH_ERROR':
      return { kind: 'network' };
    case 'TIMEOUT_ERROR':
      return { kind: 'timeout' };
    case 'PARSING_ERROR':
      return { kind: 'parse', detail: error.error };
    case 'CUSTOM_ERROR':
      return { kind: 'unknown', detail: error.error };
    default:
      return {
        kind: 'http',
        status: error.status,
        message: readServerMessage(error.data),
      };
  }
};

export const isRetryable = (error: AppError): boolean =>
  error.kind === 'network' ||
  error.kind === 'timeout' ||
  (error.kind === 'http' && error.status >= 500);

export const getErrorMessage = (error: AppError): string => {
  switch (error.kind) {
    case 'network':
      return 'Check your connection and try again.';
    case 'timeout':
      return 'The request took too long. Try again.';
    case 'http':
      return error.message ?? 'Something went wrong. Try again.';
    default:
      return 'Something went wrong. Try again.';
  }
};
