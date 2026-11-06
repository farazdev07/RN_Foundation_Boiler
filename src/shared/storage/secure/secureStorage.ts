import * as Keychain from 'react-native-keychain';
import { devWarn } from '@shared/lib/logger';
import { err, ok, type Result } from '@shared/lib/result';

type SetOptions = {
  // Requires the current biometric set to read the value back. Enrolling a new
  // finger or face invalidates it, which reads as absent.
  biometric?: boolean;
};

// THIS_DEVICE_ONLY keeps secrets out of backups and off restored devices.
const ACCESSIBLE = Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

// A failed read returns null, never throws: a locked keystore, a decrypt error
// or a cancelled biometric prompt all mean "signed out", not a crash.
export const secureStorage = {
  async get(key: string, prompt?: string): Promise<string | null> {
    try {
      const stored = await Keychain.getGenericPassword({
        service: key,
        ...(prompt && { authenticationPrompt: { title: prompt } }),
      });
      return stored ? stored.password : null;
    } catch {
      devWarn(`secureStorage: could not read "${key}"`);
      return null;
    }
  },

  async set(
    key: string,
    value: string,
    { biometric = false }: SetOptions = {},
  ): Promise<Result<void>> {
    try {
      const stored = await Keychain.setGenericPassword(key, value, {
        service: key,
        accessible: ACCESSIBLE,
        ...(biometric && {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        }),
      });
      return stored
        ? ok(undefined)
        : err(new Error('Keychain refused the write'));
    } catch (error) {
      return err(toError(error));
    }
  },

  async remove(key: string): Promise<Result<void>> {
    try {
      await Keychain.resetGenericPassword({ service: key });
      return ok(undefined);
    } catch (error) {
      return err(toError(error));
    }
  },
};
