import { useState } from 'react';
import { View } from 'react-native';
import { useLogout } from '@entities/session';
import { BiometricToggle } from '@features/biometric-unlock'; // @unit:biometric-unlock
import { useTranslation } from '@shared/lib/i18n';
import {
  Button,
  ConfirmDialog,
  RadioGroup,
  Screen,
  Text,
  makeStyles,
  useThemePreference,
  type ThemePreference,
} from '@shared/ui';

const useStyles = makeStyles(({ spacing }) => ({
  content: { gap: spacing.lg },
  section: { gap: spacing.sm },
}));

export function SettingsScreen() {
  const styles = useStyles();
  const { t } = useTranslation('settings');
  const { preference, setPreference } = useThemePreference();
  const logout = useLogout();
  const [confirming, setConfirming] = useState(false);

  const options: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('system') },
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
  ];

  return (
    <Screen belowHeader scrollable>
      <View style={styles.content}>
        <RadioGroup
          label={t('appearance')}
          options={options}
          value={preference}
          onChange={setPreference}
        />
        <View style={styles.section}>
          <Text variant="label">{t('account')}</Text>
          {/* @unit-start:biometric-unlock */}
          <BiometricToggle />
          {/* @unit-end:biometric-unlock */}
          <Button
            testID="settings-logout"
            title={t('logout')}
            variant="destructive"
            icon="log-out"
            onPress={() => setConfirming(true)}
          />
        </View>
      </View>
      <ConfirmDialog
        testID="logout-dialog"
        visible={confirming}
        title={t('logoutTitle')}
        message={t('logoutMessage')}
        confirmLabel={t('logout')}
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          logout();
        }}
      />
    </Screen>
  );
}
