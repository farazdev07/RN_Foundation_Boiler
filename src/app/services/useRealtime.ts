import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSessionStatus } from '@entities/session';
import { socket } from '@shared/api';
import { subscribeToConnectivity } from '@shared/lib/network';

// The realtime connection lives exactly as long as a signed-in session, and is
// nudged to reconnect at once when the network or the app comes back rather
// than waiting out the backoff.
export function useRealtime(): void {
  const signedIn = useSessionStatus() === 'signedIn';

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    socket.start();
    const stopNetwork = subscribeToConnectivity(online => {
      if (online) {
        socket.wake();
      }
    });
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        socket.wake();
      }
    });
    return () => {
      stopNetwork();
      appState.remove();
      socket.stop();
    };
  }, [signedIn]);
}
