import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { ImageSourcePropType } from 'react-native';
import { Spinner } from '../Spinner';
import {
  MIN_SCALE,
  clampScale,
  clampTranslate,
  nextDoubleTapScale,
  shouldDismiss,
} from './zoomMath';

type Props = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  // Shared with the viewer so the backdrop fades while the image is dragged down.
  dismissY: SharedValue<number>;
  onZoomChange: (zoomed: boolean) => void;
  onDismiss: () => void;
};

export function ZoomableImage({
  source,
  width,
  height,
  dismissY,
  onZoomChange,
  onDismiss,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const report = (next: boolean) => {
    setZoomed(next);
    onZoomChange(next);
  };

  const settle = (nextScale: number) => {
    'worklet';
    scale.value = withTiming(nextScale);
    savedScale.value = nextScale;
    const nextX = clampTranslate(x.value, nextScale, width);
    const nextY = clampTranslate(y.value, nextScale, height);
    x.value = withTiming(nextX);
    y.value = withTiming(nextY);
    savedX.value = nextX;
    savedY.value = nextY;
    scheduleOnRN(report, nextScale > MIN_SCALE);
  };

  const pinch = usePinchGesture({
    onUpdate: event => {
      'worklet';
      scale.value = clampScale(savedScale.value * event.scale);
    },
    onDeactivate: () => {
      'worklet';
      settle(scale.value < 1.05 ? MIN_SCALE : scale.value);
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onDeactivate: () => {
      'worklet';
      settle(nextDoubleTapScale(scale.value));
    },
  });

  // Zoomed in: moves the image, inside its edges.
  const move = usePanGesture({
    enabled: zoomed,
    onUpdate: event => {
      'worklet';
      x.value = clampTranslate(
        savedX.value + event.translationX,
        scale.value,
        width,
      );
      y.value = clampTranslate(
        savedY.value + event.translationY,
        scale.value,
        height,
      );
    },
    onDeactivate: () => {
      'worklet';
      savedX.value = x.value;
      savedY.value = y.value;
    },
  });

  // Zoomed out: a vertical drag closes the viewer; horizontal swipes are left
  // to the pager.
  const dismiss = usePanGesture({
    enabled: !zoomed,
    activeOffsetY: [-12, 12],
    failOffsetX: [-12, 12],
    onUpdate: event => {
      'worklet';
      dismissY.value = Math.max(event.translationY, 0);
    },
    onDeactivate: event => {
      'worklet';
      if (shouldDismiss(event.translationY, event.velocityY)) {
        scheduleOnRN(onDismiss);
      } else {
        dismissY.value = withTiming(0);
      }
    },
  });

  const gestures = useSimultaneousGestures(
    pinch,
    useExclusiveGestures(doubleTap, move, dismiss),
  );

  const transformed = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value + dismissY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gestures}>
      <View style={[styles.page, { width, height }]}>
        <Animated.Image
          source={source}
          resizeMode="contain"
          style={[{ width, height }, transformed]}
          onLoadEnd={() => setLoading(false)}
          accessibilityIgnoresInvertColors
        />
        {loading ? (
          <View style={styles.loading} pointerEvents="none">
            <Spinner />
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
