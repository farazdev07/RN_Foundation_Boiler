import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSessionStatus } from '@entities/session';
import {
  isBiometricUnlockEnabled,
  unlockWithBiometrics,
} from './biometricUnlock';

// How long the app may sit in the background before coming back asks for
// biometrics again. Shorter is safer and more annoying; a banking app may want 0.
export const RELOCK_AFTER_MS = 60_000;

export const shouldRelock = (
  leftAt: number | null,
  now: number,
  after: number = RELOCK_AFTER_MS,
): boolean => leftAt !== null && now - leftAt >= after;

type Relock = {
  // The app's content must be covered.
  locked: boolean;
  // A biometric prompt is on screen.
  checking: boolean;
  retry: () => void;
};

// Covers the app as it goes to the background, so the app switcher shows the
// cover and not the content. Coming back lifts the cover after a short absence
// and asks for biometrics after a long one. Does nothing unless the user has
// turned biometric unlock on.
export const useBiometricRelock = (): Relock => {
  const signedIn = useSessionStatus() === 'signedIn';
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const leftAt = useRef<number | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    const passed = await unlockWithBiometrics();
    setChecking(false);
    if (passed) {
      setLocked(false);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) {
      return undefined;
    }
    // "inactive" is ignored on purpose: the biometric prompt itself makes the
    // app inactive on iOS, and that must not count as leaving.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background' && isBiometricUnlockEnabled()) {
        leftAt.current ??= Date.now();
        setLocked(true);
      }
      if (state === 'active' && leftAt.current !== null) {
        const due = shouldRelock(leftAt.current, Date.now());
        leftAt.current = null;
        if (due) {
          check();
        } else {
          setLocked(false);
        }
      }
    });
    return () => {
      leftAt.current = null;
      subscription.remove();
    };
  }, [signedIn, check]);

  return { locked: locked && signedIn, checking, retry: check };
};
