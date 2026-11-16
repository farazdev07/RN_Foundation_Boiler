import { useState } from 'react';
import { View } from 'react-native';
import { env } from '@shared/config';
import { useTranslation } from '@shared/lib/i18n';
import { Button, Icon, Modal, Text, makeStyles } from '@shared/ui';
import {
  acknowledgeWarning,
  decideIntegrity,
  isDeviceCompromised,
  isWarningAcknowledged,
  type IntegrityPolicy,
} from '../model/deviceIntegrity';

type Props = {
  // What to do on a rooted or jailbroken device. Defaults to the
  // DEVICE_INTEGRITY env value, and to "off" when that is not set.
  policy?: IntegrityPolicy;
};

const useStyles = makeStyles(({ colors, spacing }) => ({
  cover: {
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
    inset: 0,
    justifyContent: 'center',
    padding: spacing.xl,
    position: 'absolute',
  },
  text: { gap: spacing.sm },
}));

// Mount once, last, so the blocking state sits above everything else.
export function DeviceIntegrityGate({
  policy = env.DEVICE_INTEGRITY ?? 'off',
}: Props) {
  const styles = useStyles();
  const { t } = useTranslation('deviceIntegrity');
  const { t: tCommon } = useTranslation();
  // The device does not change while the app runs, so this is read once.
  const [verdict, setVerdict] = useState(() =>
    policy === 'off'
      ? 'ok'
      : decideIntegrity(policy, isDeviceCompromised(), isWarningAcknowledged()),
  );
  const appName = tCommon('appName');

  if (verdict === 'ok') {
    return null;
  }

  if (verdict === 'warn') {
    const acknowledge = () => {
      acknowledgeWarning();
      setVerdict('ok');
    };
    return (
      <Modal visible dismissible={false} onRequestClose={acknowledge}>
        <Text variant="subtitle" accessibilityRole="header">
          {t('warnTitle')}
        </Text>
        <Text color="textSecondary">{t('warnMessage', { appName })}</Text>
        <Button
          testID="device-integrity-acknowledge"
          title={t('acknowledge')}
          onPress={acknowledge}
        />
      </Modal>
    );
  }

  return (
    <View
      testID="device-integrity-blocked"
      style={styles.cover}
      accessibilityViewIsModal
    >
      <Icon name="shield-alert" size={40} color="error" />
      <View style={styles.text}>
        <Text variant="title" align="center" accessibilityRole="header">
          {t('blockedTitle')}
        </Text>
        <Text color="textSecondary" align="center">
          {t('blockedMessage', { appName })}
        </Text>
      </View>
    </View>
  );
}
