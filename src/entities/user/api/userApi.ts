import { baseApi } from '@shared/api';
import { userSchema, type User } from '../model/user';

const userApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getCurrentUser: build.query<User, void>({
      query: () => 'auth/me',
      responseSchema: userSchema,
    }),
  }),
});

export const { useGetCurrentUserQuery } = userApi;
export const getCurrentUser = userApi.endpoints.getCurrentUser;
