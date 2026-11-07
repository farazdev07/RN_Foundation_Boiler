import { createMMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';
import {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricUnlockAvailable,
  isBiometricUnlockEnabled,
  unlockWithBiometrics,
} from './biometricUnlock';

const keychain = jest.mocked(Keychain);
const gateStored = async () =>
  (await Keychain.getGenericPassword({ service: 'biometric.gate' })) !== false;

// A failed or cancelled biometric prompt makes the Keychain read come back empty.
const failNextPrompt = () => {
  keychain.getGenericPassword.mockResolvedValueOnce(false);
};

describe('biometric unlock', () => {
  beforeEach(async () => {
    await disableBiometricUnlock();
    createMMKV({ id: 'account' }).clearAll();
    jest.clearAllMocks();
  });

  it('is off by default and lets the session through', async () => {
    expect(isBiometricUnlockEnabled()).toBe(false);
    expect(await unlockWithBiometrics()).toBe(true);
    expect(keychain.getGenericPassword).not.toHaveBeenCalled();
  });

  it('is available only with an enrolled sensor', async () => {
    expect(await isBiometricUnlockAvailable()).toBe(true);

    keychain.getSupportedBiometryType.mockResolvedValueOnce(null);
    expect(await isBiometricUnlockAvailable()).toBe(false);
  });

  it('turns on after a successful check, behind biometric access control', async () => {
    const result = await enableBiometricUnlock();

    expect(result.ok).toBe(true);
    expect(isBiometricUnlockEnabled()).toBe(true);
    expect(keychain.setGenericPassword).toHaveBeenCalledWith(
      'biometric.gate',
      expect.any(String),
      expect.objectContaining({
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      }),
    );
  });

  it('stays off when the confirming check fails', async () => {
    failNextPrompt();

    const result = await enableBiometricUnlock();

    expect(result.ok).toBe(false);
    expect(isBiometricUnlockEnabled()).toBe(false);
    expect(await gateStored()).toBe(false);
  });

  it('unlocks with a matching biometric and refuses a failed one', async () => {
    await enableBiometricUnlock();

    expect(await unlockWithBiometrics()).toBe(true);

    failNextPrompt();
    expect(await unlockWithBiometrics()).toBe(false);
  });

  it('turns off and removes the Keychain entry', async () => {
    await enableBiometricUnlock();

    await disableBiometricUnlock();

    expect(isBiometricUnlockEnabled()).toBe(false);
    expect(await gateStored()).toBe(false);
  });
});
