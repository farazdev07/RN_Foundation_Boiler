import { useEffect } from 'react';
import { restoreSession } from '@entities/session';
import { unlockWithBiometrics } from '@features/biometric-unlock'; // @unit:biometric-unlock
import { useAppDispatch } from '@app/store/hooks';

// Mounted once for the whole app, so app-lifetime effects outlive navigation.
export function AppServices() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    restoreSession(dispatch, {
      unlock: unlockWithBiometrics, // @unit:biometric-unlock
    });
  }, [dispatch]);

  return null;
}
