import { useEffect } from 'react';
import { restoreSession } from '@entities/session';
import { unlockWithBiometrics } from '@features/biometric-unlock'; // @unit:biometric-unlock
import { useRealtime } from '@app/services/useRealtime'; // @unit:socket
import { useAppDispatch } from '@app/store/hooks';

// Mounted once for the whole app, so app-lifetime effects outlive navigation.
export function AppServices() {
  const dispatch = useAppDispatch();
  useRealtime(); // @unit:socket

  useEffect(() => {
    restoreSession(dispatch, {
      unlock: unlockWithBiometrics, // @unit:biometric-unlock
    });
  }, [dispatch]);

  return null;
}
