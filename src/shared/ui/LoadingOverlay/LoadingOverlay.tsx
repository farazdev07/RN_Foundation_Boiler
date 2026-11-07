import { Modal as RNModal, View } from 'react-native';
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
        accessibilityLabel={message ?? 'Loading'}
      >
        <Spinner size="large" color="surface" />
        {message ? <Text color="surface">{message}</Text> : null}
      </View>
    </RNModal>
  );
}
