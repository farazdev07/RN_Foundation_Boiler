import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from '@shared/lib/i18n';
import { useIsOnline } from '@shared/lib/network';
import { Text } from '../Text';
import { makeStyles } from '../theme';

const useStyles = makeStyles(({ colors, spacing }) => ({
  banner: {
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.xs,
  },
}));

export function NetworkBanner() {
  const styles = useStyles();
  const online = useIsOnline();
  const { t } = useTranslation();

  if (online) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      accessibilityLiveRegion="polite"
      style={styles.banner}
    >
      <Text variant="caption" color="textOnPrimary">
        {t('offline')}
      </Text>
    </Animated.View>
  );
}
