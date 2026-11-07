import { View } from 'react-native';
import { LoginForm } from '@features/auth-by-credentials';
import { useTranslation } from '@shared/lib/i18n';
import { Screen, Text, makeStyles } from '@shared/ui';

const useStyles = makeStyles(({ spacing }) => ({
  content: { gap: spacing.lg, paddingTop: spacing.xl },
}));

// Replace this screen, or LoginForm inside it, to change how people sign in.
// Navigation only cares that the session becomes signed in.
export function LoginScreen() {
  const styles = useStyles();
  const { t } = useTranslation('auth');

  return (
    <Screen keyboardAware>
      <View style={styles.content}>
        <Text variant="title">{t('welcome')}</Text>
        <LoginForm />
      </View>
    </Screen>
  );
}
