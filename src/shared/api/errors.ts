import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { i18next } from '@shared/lib/i18n';

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

const KINDS = new Set(['network', 'timeout', 'parse', 'http', 'unknown']);

// RTK Query types a hook's error as AppError or a SerializedError (something
// threw inside a query). This gives callers one type without a cast.
export const asAppError = (error: unknown): AppError => {
  if (typeof error === 'object' && error !== null) {
    const { kind, message } = error as { kind?: unknown; message?: unknown };
    if (typeof kind === 'string' && KINDS.has(kind)) {
      return error as AppError;
    }
    if (typeof message === 'string') {
      return { kind: 'unknown', detail: message };
    }
  }
  return { kind: 'unknown', detail: String(error) };
};

export const isRetryable = (error: AppError): boolean =>
  error.kind === 'network' ||
  error.kind === 'timeout' ||
  (error.kind === 'http' && error.status >= 500);

// Takes whatever a query hook reports, so screens never cast.
export const getErrorMessage = (reported: unknown): string => {
  const error = asAppError(reported);
  switch (error.kind) {
    case 'network':
      return i18next.t('common:errorNetwork');
    case 'timeout':
      return i18next.t('common:errorTimeout');
    case 'http':
      return error.message ?? i18next.t('common:errorGeneric');
    default:
      return i18next.t('common:errorGeneric');
  }
};
