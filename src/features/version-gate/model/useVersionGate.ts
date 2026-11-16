import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { z } from 'zod';
import { appVersion } from '@shared/config';
import { reportError } from '@shared/lib/monitoring';
import { defineKey } from '@shared/storage';
import { fetchAppConfig } from '../api/fetchAppConfig';
import { decide, type GateDecision } from './versionGate';

// How often coming back to the foreground may re-check.
const RECHECK_AFTER_MS = 5 * 60_000;

// The optional update the user last said "Later" to, so it is offered once per
// version and not on every launch.
const dismissedKey = defineKey({
  name: 'versionGate.dismissed',
  schema: z.string(),
  version: 1,
  kind: 'user',
  scope: 'device',
});

type VersionGateState = {
  decision: GateDecision;
  checking: boolean;
  // Re-checks now. For the maintenance screen's "Try again".
  recheck: () => void;
  // Hides an optional update until a newer one appears.
  dismiss: () => void;
};

// Fails open: with no URL, no network or a broken document the app carries on.
// A config outage must never lock every user out.
export const useVersionGate = (
  configUrl: string | undefined,
): VersionGateState => {
  const [decision, setDecision] = useState<GateDecision>({ kind: 'ok' });
  const [checking, setChecking] = useState(false);
  const checkedAt = useRef(0);

  const check = useCallback(async () => {
    if (!configUrl) {
      return;
    }
    checkedAt.current = Date.now();
    setChecking(true);
    const config = await fetchAppConfig(configUrl);
    setChecking(false);
    if (!config.ok) {
      reportError(config.error, { where: 'versionGate.fetch' });
      setDecision({ kind: 'ok' });
      return;
    }
    const next = decide(config.value, appVersion, Platform.OS);
    setDecision(
      next.kind === 'optional' && dismissedKey.get() === next.latestVersion
        ? { kind: 'ok' }
        : next,
    );
  }, [configUrl]);

  useEffect(() => {
    check();
    const subscription = AppState.addEventListener('change', state => {
      if (
        state === 'active' &&
        Date.now() - checkedAt.current >= RECHECK_AFTER_MS
      ) {
        check();
      }
    });
    return () => subscription.remove();
  }, [check]);

  const dismiss = useCallback(() => {
    setDecision(current => {
      if (current.kind === 'optional') {
        dismissedKey.set(current.latestVersion);
      }
      return { kind: 'ok' };
    });
  }, []);

  return { decision, checking, recheck: check, dismiss };
};
