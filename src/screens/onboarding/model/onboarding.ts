import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { defineKey } from '@shared/storage';

// Device scope: onboarding is about the install, not the account, so logging
// out or switching user does not show it again. Reinstalling does.
const doneKey = defineKey({
  name: 'onboarding.done',
  schema: z.boolean(),
  version: 1,
  kind: 'user',
  scope: 'device',
});

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isOnboardingDone = (): boolean => doneKey.get() === true;

export const completeOnboarding = (): void => {
  doneKey.set(true);
  listeners.forEach(listener => listener());
};

// Re-renders when onboarding is completed.
export const useOnboardingDone = (): boolean =>
  useSyncExternalStore(subscribe, isOnboardingDone);
