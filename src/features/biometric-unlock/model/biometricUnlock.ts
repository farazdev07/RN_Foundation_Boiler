import { z } from 'zod';
import { onSessionEnd } from '@entities/session';
import { i18next } from '@shared/lib/i18n';
import { err, ok, type Result } from '@shared/lib/result';
import { defineKey, secureStorage } from '@shared/storage';

// A small Keychain entry that only a current biometric match can read. It is
// a gate in front of the saved session, not the token itself: protecting the
// refresh token directly would make Android ask for a fingerprint every time
// the token rotates. See docs/adr (biometric unlock).
const GATE_KEY = 'biometric.gate';
const GATE_VALUE = 'unlocked';

// Account scope: logout wipes it, so biometrics never bring back a session the
// user ended, and the next account starts with the feature off.
const enabledKey = defineKey({
  name: 'biometric.enabled',
  schema: z.boolean(),
  version: 1,
  kind: 'user',
  scope: 'account',
});

const prompt = () =>
  i18next.t('biometric:prompt', { appName: i18next.t('common:appName') });

export const isBiometricUnlockEnabled = (): boolean =>
  enabledKey.get() === true;

export const isBiometricUnlockAvailable = async (): Promise<boolean> =>
  (await secureStorage.getBiometryType()) !== null;

// Writes the gate, then reads it back with a prompt so the user proves the
// sensor works before the app starts relying on it.
export const enableBiometricUnlock = async (): Promise<Result<void>> => {
  const written = await secureStorage.set(GATE_KEY, GATE_VALUE, {
    biometric: true,
  });
  if (!written.ok) {
    return written;
  }
  if ((await secureStorage.get(GATE_KEY, prompt())) !== GATE_VALUE) {
    await secureStorage.remove(GATE_KEY);
    return err(new Error('Biometric check did not pass'));
  }
  enabledKey.set(true);
  return ok(undefined);
};

export const disableBiometricUnlock = async (): Promise<void> => {
  enabledKey.remove();
  await secureStorage.remove(GATE_KEY);
};

// For restoreSession. A cancelled prompt, a failed match or a changed set of
// enrolled fingers or faces all read as null, which ends the session.
export const unlockWithBiometrics = async (): Promise<boolean> =>
  !isBiometricUnlockEnabled() ||
  (await secureStorage.get(GATE_KEY, prompt())) === GATE_VALUE;

// The flag lives in account storage, which the session wipe already clears;
// the Keychain entry needs removing here.
onSessionEnd(async () => {
  await secureStorage.remove(GATE_KEY);
});
