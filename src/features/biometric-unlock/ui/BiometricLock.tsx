import { View } from 'react-native';
import { useLogout } from '@entities/session';
import { useTranslation } from '@shared/lib/i18n';
import { Button, Icon, Text, makeStyles } from '@shared/ui';
import { useBiometricRelock } from '../model/relock';

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
  actions: { alignSelf: 'stretch', gap: spacing.sm },
}));

// Mount once, after the navigator, so it sits above every screen. It does not
// sit above an open RN Modal, which is its own native window.
export function BiometricLock() {
  const styles = useStyles();
  const { t } = useTranslation('biometric');
  const { t: tCommon } = useTranslation();
  const { locked, checking, retry } = useBiometricRelock();
  const logout = useLogout();

  if (!locked) {
    return null;
  }

  return (
    <View
      testID="biometric-lock"
      style={styles.cover}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <Icon name="lock" size={40} color="textSecondary" />
      <Text variant="title" align="center" accessibilityRole="header">
        {t('lockedTitle', { appName: tCommon('appName') })}
      </Text>
      <View style={styles.actions}>
        <Button
          testID="biometric-lock-unlock"
          title={t('unlock')}
          loading={checking}
          onPress={retry}
        />
        <Button
          testID="biometric-lock-logout"
          title={t('logout')}
          variant="secondary"
          disabled={checking}
          onPress={logout}
        />
      </View>
    </View>
  );
}
