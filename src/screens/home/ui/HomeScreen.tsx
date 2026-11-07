import { ScrollView, StyleSheet } from 'react-native';
import { useGetCurrentUserQuery } from '@entities/user';
import { useTranslation } from '@shared/lib/i18n';
import { Text } from '@shared/ui';
import { RuntimeCheck } from './RuntimeCheck';

// Placeholder until the reference feature. RuntimeCheck is the native smoke test
// and goes when the smoke flow moves to real screens.
export function HomeScreen() {
  const { t } = useTranslation('home');
  const { data: user } = useGetCurrentUserQuery();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title">RN Foundation</Text>
      {user ? (
        <Text testID="home-greeting">
          {t('greeting', { name: user.firstName })}
        </Text>
      ) : null}
      <RuntimeCheck />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
});
