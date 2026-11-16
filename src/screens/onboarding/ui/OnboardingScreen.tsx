import { View } from 'react-native';
import { useTranslation } from '@shared/lib/i18n';
import { Button, Icon, Screen, Text, makeStyles } from '@shared/ui';
import { completeOnboarding } from '../model/onboarding';

const useStyles = makeStyles(({ spacing }) => ({
  content: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  text: { gap: spacing.sm },
}));

// Shown once per install, before the login screen. Replace the content with
// the app's own pages; the only contract is calling `completeOnboarding`.
export function OnboardingScreen() {
  const styles = useStyles();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation();

  return (
    <Screen>
      <View style={styles.content}>
        <Icon name="sparkles" size={40} color="primary" />
        <View style={styles.text}>
          <Text variant="title" accessibilityRole="header">
            {t('title', { appName: tCommon('appName') })}
          </Text>
          <Text color="textSecondary">{t('body')}</Text>
        </View>
        <Button
          testID="onboarding-start"
          title={t('start')}
          onPress={completeOnboarding}
        />
      </View>
    </Screen>
  );
}
