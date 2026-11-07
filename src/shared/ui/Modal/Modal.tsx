import type { PropsWithChildren } from 'react';
import { Modal as RNModal, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastViewport } from '../Toast';
import { makeStyles } from '../theme';

type Props = PropsWithChildren<{
  visible: boolean;
  onRequestClose: () => void;
  // Tapping outside the card closes the modal.
  dismissible?: boolean;
}>;

const useStyles = makeStyles(({ colors, radii, spacing, elevations }) => ({
  backdrop: { backgroundColor: colors.overlay },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    ...elevations.high,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.md,
    maxWidth: 480,
    padding: spacing.lg,
    width: '100%',
  },
}));

// RN's Modal sits above the app root, so it hosts its own gesture root and
// toast viewport.
export function Modal({
  visible,
  onRequestClose,
  dismissible = true,
  children,
}: Props) {
  const styles = useStyles();

  return (
    <RNModal
      transparent
      animationType="fade"
      statusBarTranslucent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        {/* The backdrop is a sibling of the card, not its parent. An accessible
            parent would merge the card into one "Close" element on iOS, hiding
            the dialog's own buttons from VoiceOver and UI tests. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          disabled={!dismissible}
          onPress={onRequestClose}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.card}>{children}</View>
        </View>
        <ToastViewport />
      </GestureHandlerRootView>
    </RNModal>
  );
}
