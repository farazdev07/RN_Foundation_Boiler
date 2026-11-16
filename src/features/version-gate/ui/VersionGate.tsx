import { View } from 'react-native';
import { env } from '@shared/config';
import { useTranslation } from '@shared/lib/i18n';
import { openUrl } from '@shared/lib/linking';
import { Button, ConfirmDialog, Icon, Text, makeStyles } from '@shared/ui';
import { useVersionGate } from '../model/useVersionGate';

type Props = {
  // Where the app config document lives. Unset turns the gate off.
  configUrl?: string | undefined;
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
  action: { alignSelf: 'stretch' },
}));

// Mount once, after the navigator, so the blocking states sit above every
// screen. Shows nothing while the app is up to date.
export function VersionGate({
  configUrl = env.APP_CONFIG_URL || undefined,
}: Props) {
  const styles = useStyles();
  const { t } = useTranslation('versionGate');
  const { t: tCommon } = useTranslation();
  const { decision, checking, recheck, dismiss } = useVersionGate(configUrl);
  const appName = tCommon('appName');

  if (decision.kind === 'ok') {
    return null;
  }

  if (decision.kind === 'optional') {
    return (
      <ConfirmDialog
        visible
        testID="version-gate-optional"
        title={t('updateAvailableTitle')}
        message={t('updateAvailableMessage', { appName })}
        confirmLabel={t('update')}
        cancelLabel={t('later')}
        onConfirm={() => {
          openUrl(decision.storeUrl);
          dismiss();
        }}
        onCancel={dismiss}
      />
    );
  }

  const maintenance = decision.kind === 'maintenance';

  return (
    <View
      testID={
        maintenance ? 'version-gate-maintenance' : 'version-gate-required'
      }
      style={styles.cover}
      accessibilityViewIsModal
    >
      <Icon
        name={maintenance ? 'wrench' : 'download'}
        size={40}
        color="textSecondary"
      />
      <View style={styles.text}>
        <Text variant="title" align="center" accessibilityRole="header">
          {t(maintenance ? 'maintenanceTitle' : 'updateRequiredTitle')}
        </Text>
        <Text color="textSecondary" align="center">
          {maintenance
            ? (decision.message ?? t('maintenanceMessage', { appName }))
            : t('updateRequiredMessage', { appName })}
        </Text>
      </View>
      <View style={styles.action}>
        {maintenance ? (
          <Button
            testID="version-gate-retry"
            title={tCommon('retry')}
            loading={checking}
            onPress={recheck}
          />
        ) : (
          <Button
            testID="version-gate-update"
            title={t('update')}
            onPress={() => openUrl(decision.storeUrl)}
          />
        )}
      </View>
    </View>
  );
}
