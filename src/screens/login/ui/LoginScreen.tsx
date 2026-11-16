import { View } from 'react-native';
import { LoginForm } from '@features/auth-by-credentials';
import { useTranslation } from '@shared/lib/i18n';
import { useScreenProtection } from '@shared/lib/screen-protection'; // @unit:screen-protection
import { Screen, Text, makeStyles } from '@shared/ui';

const useStyles = makeStyles(({ spacing }) => ({
  content: { gap: spacing.lg, paddingTop: spacing.xl },
}));

// Replace this screen, or LoginForm inside it, to change how people sign in.
// Navigation only cares that the session becomes signed in.
export function LoginScreen() {
  const styles = useStyles();
  const { t } = useTranslation('auth');
  // The password is on this screen. Protect any other sensitive screen the
  // same way.
  useScreenProtection(); // @unit:screen-protection

  return (
    <Screen keyboardAware>
      <View style={styles.content}>
        <Text variant="title">{t('welcome')}</Text>
        <LoginForm />
      </View>
    </Screen>
  );
}
