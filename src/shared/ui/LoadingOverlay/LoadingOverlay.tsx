import { Modal as RNModal, View } from 'react-native';
import { useTranslation } from '@shared/lib/i18n';
import { Spinner } from '../Spinner';
import { Text } from '../Text';
import { makeStyles } from '../theme';

type Props = { visible: boolean; message?: string };

const useStyles = makeStyles(({ colors, spacing }) => ({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
}));

// Blocks the whole screen. Prefer inline loading states; use this only when the
// user must not act until something finishes.
export function LoadingOverlay({ visible, message }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <RNModal
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={() => undefined}
    >
      <View
        style={styles.backdrop}
        accessibilityRole="progressbar"
        accessibilityLabel={message ?? t('loading')}
      >
        <Spinner size="large" color="surface" />
        {message ? <Text color="surface">{message}</Text> : null}
      </View>
    </RNModal>
  );
}
