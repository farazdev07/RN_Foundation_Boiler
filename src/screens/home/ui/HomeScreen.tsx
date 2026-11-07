import { useGetCurrentUserQuery } from '@entities/user';
import { useTranslation } from '@shared/lib/i18n';
import { Screen, Text } from '@shared/ui';

// A minimal signed-in landing screen that stays when the products unit is
// removed. Replace it with the app's own home.
export function HomeScreen() {
  const { t } = useTranslation('home');
  const { data: user } = useGetCurrentUserQuery();

  return (
    <Screen belowHeader scrollable>
      <Text variant="title">{t('common:appName')}</Text>
      {user ? (
        <Text testID="home-greeting">
          {t('greeting', { name: user.firstName })}
        </Text>
      ) : null}
    </Screen>
  );
}
