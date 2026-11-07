import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../Text';
import { makeStyles } from '../theme';
import { clamp, snap, toPosition, toValue } from './rangeMath';

const THUMB = 28;
const TRACK_HEIGHT = 6;

export type Range = [number, number];

type Props = {
  value: Range;
  // Called when a drag ends or an accessibility action steps a thumb, never
  // per frame.
  onChange: (value: Range) => void;
  min?: number;
  max?: number;
  step?: number;
  // The smallest allowed distance between the two values.
  minGap?: number;
  label?: string;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  testID?: string;
};

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
  container: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  area: { height: THUMB, justifyContent: 'center' },
  track: {
    backgroundColor: colors.border,
    borderRadius: radii.full,
    height: TRACK_HEIGHT,
    marginHorizontal: THUMB / 2,
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    height: TRACK_HEIGHT,
    position: 'absolute',
  },
  thumb: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: radii.full,
    borderWidth: 2,
    height: THUMB,
    position: 'absolute',
    width: THUMB,
  },
  disabled: { opacity: 0.5 },
}));

type ThumbProps = {
  which: 'low' | 'high';
  position: SharedValue<number>;
  other: SharedValue<number>;
  track: number;
  gapPx: number;
  disabled: boolean;
  label: string;
  valueText: string;
  onEnd: () => void;
  onStep: (direction: 1 | -1) => void;
  style: object;
  testID?: string;
};

function Thumb({
  which,
  position,
  other,
  track,
  gapPx,
  disabled,
  label,
  valueText,
  onEnd,
  onStep,
  style,
  testID,
}: ThumbProps) {
  const start = useSharedValue(0);

  const pan = usePanGesture({
    enabled: !disabled,
    onBegin: () => {
      'worklet';
      start.value = position.value;
    },
    onUpdate: event => {
      'worklet';
      const next = start.value + event.translationX;
      position.value =
        which === 'low'
          ? clamp(next, 0, other.value - gapPx)
          : clamp(next, other.value + gapPx, track);
    },
    onDeactivate: () => {
      'worklet';
      scheduleOnRN(onEnd);
    },
  });

  const moved = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        testID={testID}
        style={[style, moved]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: valueText }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event =>
          onStep(event.nativeEvent.actionName === 'increment' ? 1 : -1)
        }
        hitSlop={12}
      />
    </GestureDetector>
  );
}

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  label,
  formatValue = String,
  disabled = false,
  testID,
}: Props) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const track = Math.max(width - THUMB, 0);
  const gapPx = max === min ? 0 : (minGap / (max - min)) * track;

  const low = useSharedValue(0);
  const high = useSharedValue(0);

  // Follows the controlled value, including after a drag snaps to a step.
  useEffect(() => {
    low.value = toPosition(value[0], min, max, track);
    high.value = toPosition(value[1], min, max, track);
  }, [value, min, max, track, low, high]);

  const commit = () => {
    const from = snap(toValue(low.value, min, max, track), min, max, step);
    const to = snap(toValue(high.value, min, max, track), min, max, step);
    onChange([Math.min(from, to - minGap), Math.max(to, from + minGap)]);
  };

  const stepThumb = (which: 'low' | 'high') => (direction: 1 | -1) => {
    if (disabled) {
      return;
    }
    const [from, to] = value;
    if (which === 'low') {
      onChange([clamp(from + direction * step, min, to - minGap), to]);
    } else {
      onChange([from, clamp(to + direction * step, from + minGap, max)]);
    }
  };

  const fill = useAnimatedStyle(() => ({
    left: low.value + THUMB / 2,
    width: Math.max(high.value - low.value, 0),
  }));

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const lowText = formatValue(value[0]);
  const highText = formatValue(value[1]);

  return (
    <View
      style={[styles.container, disabled && styles.disabled]}
      testID={testID}
    >
      <View style={styles.header}>
        {label ? <Text variant="label">{label}</Text> : <View />}
        <Text variant="label" color="textSecondary">
          {`${lowText} to ${highText}`}
        </Text>
      </View>
      <View
        style={styles.area}
        onLayout={onLayout}
        {...(testID && { testID: `${testID}-area` })}
      >
        <View style={styles.track} />
        <Animated.View style={[styles.fill, fill]} />
        {width > 0 ? (
          <>
            <Thumb
              which="low"
              position={low}
              other={high}
              track={track}
              gapPx={gapPx}
              disabled={disabled}
              label={`${label ?? ''} minimum`.trim()}
              valueText={lowText}
              onEnd={commit}
              onStep={stepThumb('low')}
              style={styles.thumb}
              {...(testID && { testID: `${testID}-low` })}
            />
            <Thumb
              which="high"
              position={high}
              other={low}
              track={track}
              gapPx={gapPx}
              disabled={disabled}
              label={`${label ?? ''} maximum`.trim()}
              valueText={highText}
              onEnd={commit}
              onStep={stepThumb('high')}
              style={styles.thumb}
              {...(testID && { testID: `${testID}-high` })}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}
