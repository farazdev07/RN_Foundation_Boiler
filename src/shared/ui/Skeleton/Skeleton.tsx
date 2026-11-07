import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
};

const PULSE_MS = 800;

export function Skeleton({ width = '100%', height = 16, radius }: Props) {
  const { colors, radii } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: PULSE_MS }),
      -1,
      true,
    );
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="skeleton"
      style={[
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius ?? radii.sm,
          height,
          width,
        },
        pulse,
      ]}
    />
  );
}
