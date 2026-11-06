import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Entities and features inject their own endpoints, so this file never learns
// about a business object. The base query gains auth and error handling in
// Phase 4.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: () => ({}),
});
