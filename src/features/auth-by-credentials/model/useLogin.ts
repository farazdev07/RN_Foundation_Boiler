import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { signedIn } from '@entities/session';
import { setTokens, type AppError } from '@shared/api';
import { useLoginMutation, type Credentials } from '../api/loginApi';
import { rememberedUsername } from './rememberedUsername';

export type LoginInput = Credentials & { remember: boolean };

// Remember Me decides where the refresh token lives: checked, the Keychain, so
// the session survives a restart; unchecked, memory only, and the saved
// username is forgotten.
export const useLogin = () => {
  const dispatch = useDispatch();
  const [login, { isLoading, error, reset }] = useLoginMutation();

  const submit = useCallback(
    async ({ remember, ...credentials }: LoginInput): Promise<boolean> => {
      const result = await login(credentials);
      if (!('data' in result) || !result.data) {
        return false;
      }

      await setTokens(result.data, { persist: remember });
      if (remember) {
        rememberedUsername.set(credentials.username);
      } else {
        rememberedUsername.remove();
      }
      dispatch(signedIn());
      return true;
    },
    [dispatch, login],
  );

  return {
    submit,
    isLoading,
    error: error as AppError | undefined,
    reset,
  };
};
