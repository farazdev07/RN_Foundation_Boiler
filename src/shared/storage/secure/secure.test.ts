import * as Keychain from 'react-native-keychain';
import { secureStorage } from '@shared/storage';

const keychain = jest.mocked(Keychain);

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('returns the stored value', async () => {
      keychain.getGenericPassword.mockResolvedValueOnce({
        service: 'token',
        username: 'token',
        password: 'secret',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      });

      await expect(secureStorage.get('token')).resolves.toBe('secret');
    });

    it('returns null when nothing is stored', async () => {
      keychain.getGenericPassword.mockResolvedValueOnce(false);

      await expect(secureStorage.get('token')).resolves.toBeNull();
    });

    it('treats a read or decrypt failure as absent, never a crash', async () => {
      keychain.getGenericPassword.mockRejectedValueOnce(
        new Error('Decryption failed'),
      );

      await expect(secureStorage.get('token')).resolves.toBeNull();
    });

    it('passes a biometric prompt through', async () => {
      keychain.getGenericPassword.mockResolvedValueOnce(false);

      await secureStorage.get('token', 'Unlock');

      expect(keychain.getGenericPassword).toHaveBeenCalledWith({
        service: 'token',
        authenticationPrompt: { title: 'Unlock' },
      });
    });
  });

  describe('set', () => {
    it('stores on this device only', async () => {
      keychain.setGenericPassword.mockResolvedValueOnce({
        service: 'token',
        storage: Keychain.STORAGE_TYPE.AES_GCM,
      });

      await expect(secureStorage.set('token', 'secret')).resolves.toEqual({
        ok: true,
        value: undefined,
      });
      expect(keychain.setGenericPassword).toHaveBeenCalledWith(
        'token',
        'secret',
        {
          service: 'token',
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        },
      );
    });

    it('binds to the current biometric set when asked', async () => {
      keychain.setGenericPassword.mockResolvedValueOnce(false);

      await secureStorage.set('token', 'secret', { biometric: true });

      expect(keychain.setGenericPassword).toHaveBeenCalledWith(
        'token',
        'secret',
        expect.objectContaining({
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        }),
      );
    });

    it('reports a refused write', async () => {
      keychain.setGenericPassword.mockResolvedValueOnce(false);

      const result = await secureStorage.set('token', 'secret');

      expect(result.ok).toBe(false);
    });

    it('reports a thrown write without throwing', async () => {
      keychain.setGenericPassword.mockRejectedValueOnce('locked');

      await expect(secureStorage.set('token', 'secret')).resolves.toEqual({
        ok: false,
        error: new Error('locked'),
      });
    });
  });

  describe('remove', () => {
    it('removes the entry', async () => {
      keychain.resetGenericPassword.mockResolvedValueOnce(true);

      const result = await secureStorage.remove('token');

      expect(result.ok).toBe(true);
      expect(keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'token',
      });
    });

    it('reports a failure without throwing', async () => {
      const failure = new Error('locked');
      keychain.resetGenericPassword.mockRejectedValueOnce(failure);

      await expect(secureStorage.remove('token')).resolves.toEqual({
        ok: false,
        error: failure,
      });
    });
  });

  describe('getBiometryType', () => {
    it('returns the enrolled sensor', async () => {
      expect(await secureStorage.getBiometryType()).toBe('FaceID');
    });

    it('returns null when the check fails', async () => {
      keychain.getSupportedBiometryType.mockRejectedValueOnce(new Error('no'));

      expect(await secureStorage.getBiometryType()).toBeNull();
    });
  });
});
