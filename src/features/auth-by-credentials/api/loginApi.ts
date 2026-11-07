import { z } from 'zod';
import { baseApi } from '@shared/api';

const TOKEN_LIFETIME_MINUTES = 30;

export type Credentials = { username: string; password: string };

const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

const loginApi = baseApi.injectEndpoints({
  endpoints: build => ({
    login: build.mutation<z.infer<typeof loginResponseSchema>, Credentials>({
      query: credentials => ({
        url: 'auth/login',
        method: 'POST',
        body: { ...credentials, expiresInMins: TOKEN_LIFETIME_MINUTES },
      }),
      responseSchema: loginResponseSchema,
    }),
  }),
});

export const { useLoginMutation } = loginApi;
