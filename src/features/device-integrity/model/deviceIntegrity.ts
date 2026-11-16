import JailMonkey from 'jail-monkey';
import { z } from 'zod';
import { reportError } from '@shared/lib/monitoring';
import { defineKey } from '@shared/storage';

export type IntegrityPolicy = 'off' | 'warn' | 'block';

export type IntegrityVerdict = 'ok' | 'warn' | 'block';

// Device scope: the warning is about the phone, so it is shown once per
// install, not once per account.
const acknowledgedKey = defineKey({
  name: 'deviceIntegrity.acknowledged',
  schema: z.boolean(),
  version: 1,
  kind: 'user',
  scope: 'device',
});

// Root or jailbreak, or a hooking framework such as Frida or Xposed. Mock
// location and developer options are left out on purpose: testers and
// developers have them on, and they say nothing about the app's storage.
export const isDeviceCompromised = (): boolean => {
  try {
    return JailMonkey.isJailBroken() || JailMonkey.hookDetected();
  } catch (error) {
    // A check that cannot run must not lock people out of the app.
    reportError(error, { where: 'deviceIntegrity.check' });
    return false;
  }
};

export const decideIntegrity = (
  policy: IntegrityPolicy,
  compromised: boolean,
  acknowledged: boolean,
): IntegrityVerdict => {
  if (policy === 'off' || !compromised) {
    return 'ok';
  }
  if (policy === 'block') {
    return 'block';
  }
  return acknowledged ? 'ok' : 'warn';
};

export const isWarningAcknowledged = (): boolean =>
  acknowledgedKey.get() === true;

export const acknowledgeWarning = (): void => {
  acknowledgedKey.set(true);
};
