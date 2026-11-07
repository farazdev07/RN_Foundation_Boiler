import { useEffect } from 'react';
import { restoreSession } from '@entities/session';
import { useAppDispatch } from '@app/store/hooks';

// Mounted once for the whole app, so app-lifetime effects outlive navigation.
export function AppServices() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    restoreSession(dispatch);
  }, [dispatch]);

  return null;
}
