import { useGetCurrentUserQuery } from '@entities/user';
import { asAppError, getErrorMessage } from '@shared/api';
import { useTranslation } from '@shared/lib/i18n';
import { EmptyState, Screen, Skeleton, Text } from '@shared/ui';

// A minimal signed-in landing screen that stays when the products unit is
// removed. Replace it with the app's own home. It shows the three states every
// data screen needs: loading, failed with a retry, and loaded.
export function HomeScreen() {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation();
  const { data: user, error, isLoading, refetch } = useGetCurrentUserQuery();

  return (
    <Screen belowHeader scrollable>
      <Text variant="title">{tCommon('appName')}</Text>
      {isLoading ? <Skeleton width={160} height={20} /> : null}
      {user ? (
        <Text testID="home-greeting">
          {t('greeting', { name: user.firstName })}
        </Text>
      ) : null}
      {error && !user ? (
        <EmptyState
          testID="home-error"
          icon="wifi-off"
          title={t('errorTitle')}
          message={getErrorMessage(asAppError(error))}
          actionLabel={tCommon('retry')}
          onAction={() => refetch()}
        />
      ) : null}
    </Screen>
  );
}
