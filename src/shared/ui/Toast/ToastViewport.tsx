import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../Text';
import { makeStyles } from '../theme';
import { toastStore } from './toastStore';

const VISIBLE_MS = 3000;
const DISMISS_DISTANCE = 40;

const useStyles = makeStyles(({ colors, radii, spacing, elevations }) => ({
  toast: {
    ...elevations.medium,
    borderRadius: radii.md,
    marginHorizontal: spacing.md,
    padding: spacing.md,
  },
  info: { backgroundColor: colors.textPrimary },
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.error },
}));

const dismiss = (id: number) => toastStore.hide(id);

// Mount one at the app root; Modal mounts its own so toasts show above it.
export function ToastViewport() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [viewportId, setViewportId] = useState<number | null>(null);
  const toast = useSyncExternalStore(toastStore.subscribe, toastStore.getToast);
  const isTop = useSyncExternalStore(
    toastStore.subscribe,
    () => viewportId !== null && toastStore.isTopViewport(viewportId),
  );
  const offsetY = useSharedValue(0);

  useEffect(() => {
    const { id, unregister } = toastStore.registerViewport();
    setViewportId(id);
    return unregister;
  }, []);

  useEffect(() => {
    offsetY.value = 0;
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => toastStore.hide(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, offsetY]);

  const toastId = toast?.id ?? -1;

  // Swiping up past a short distance dismisses; a smaller drag springs back.
  const swipe = usePanGesture({
    onUpdate: event => {
      'worklet';
      offsetY.value = Math.min(0, event.translationY);
    },
    onDeactivate: event => {
      'worklet';
      if (event.translationY < -DISMISS_DISTANCE) {
        scheduleOnRN(dismiss, toastId);
      } else {
        offsetY.value = withTiming(0);
      }
    },
  });

  const dragged = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  if (!toast || !isTop) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8 }]}
    >
      {/* Entering/exiting animate transform too, so the drag offset lives on an
          inner view; on one view Reanimated warns that they overwrite each other. */}
      <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
        <GestureDetector gesture={swipe}>
          <Animated.View
            testID="toast"
            style={[styles.toast, styles[toast.variant], dragged]}
          >
            <Pressable
              accessibilityRole="alert"
              accessibilityHint="Swipe up or tap to dismiss"
              onPress={() => dismiss(toast.id)}
            >
              <Text color="surface">{toast.message}</Text>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
}
