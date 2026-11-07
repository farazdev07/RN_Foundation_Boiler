import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { isSessionPersisted } from '@shared/api';
import { useTranslation } from '@shared/lib/i18n';
import { Checkbox, Text, makeStyles, showToast } from '@shared/ui';
import {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricUnlockAvailable,
  isBiometricUnlockEnabled,
} from '../model/biometricUnlock';

const useStyles = makeStyles(({ spacing }) => ({
  row: { gap: spacing.xs },
}));

// Hidden on devices without an enrolled sensor. Needs a session that survives
// a restart, since there is nothing to unlock otherwise.
export function BiometricToggle() {
  const styles = useStyles();
  const { t } = useTranslation('biometric');
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(isBiometricUnlockEnabled);
  const [busy, setBusy] = useState(false);
  const persisted = isSessionPersisted();

  useEffect(() => {
    let active = true;
    isBiometricUnlockAvailable().then(result => {
      if (active) {
        setAvailable(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!available) {
    return null;
  }

  const onChange = async (next: boolean) => {
    setBusy(true);
    if (next) {
      const result = await enableBiometricUnlock();
      if (!result.ok) {
        showToast(t('enableFailed'), 'error');
      }
    } else {
      await disableBiometricUnlock();
    }
    setEnabled(isBiometricUnlockEnabled());
    setBusy(false);
  };

  return (
    <View style={styles.row}>
      <Checkbox
        label={t('toggle')}
        checked={enabled}
        disabled={busy || !persisted}
        onChange={onChange}
      />
      <Text variant="caption" color="textSecondary">
        {persisted ? t('hint') : t('needsRememberMe')}
      </Text>
    </View>
  );
}
