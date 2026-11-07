import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type { AppError } from './errors';

// Entities and features inject their own endpoints and tag types, so this file
// never learns about a business object.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  // Endpoints validate with `responseSchema`; a mismatch is a parse error.
  catchSchemaFailure: (failure): AppError => ({
    kind: 'parse',
    detail: failure.message,
  }),
  endpoints: () => ({}),
});
