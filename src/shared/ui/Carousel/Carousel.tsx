import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  AppState,
  FlatList,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { makeStyles } from '../theme';
import { activeDotIndex } from './activeDot';

type Props<T> = {
  data: readonly T[];
  renderItem: (info: { item: T; index: number; width: number }) => ReactElement;
  keyExtractor: (item: T, index: number) => string;
  autoPlay?: boolean;
  intervalMs?: number;
  // For a screen that is not focused, which this component cannot detect.
  paused?: boolean;
  maxDots?: number;
  onIndexChange?: (index: number) => void;
  testID?: string;
};

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: radii.full,
    height: 8,
    width: 8,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 20,
  },
}));

export function Carousel<T>({
  data,
  renderItem,
  keyExtractor,
  autoPlay = true,
  intervalMs = 3000,
  paused = false,
  maxDots = 5,
  onIndexChange,
  testID,
}: Props<T>) {
  const styles = useStyles();
  const listRef = useRef<FlatList<T>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Only an explicit background pauses it; an unknown state counts as visible.
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background',
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setForeground(state !== 'background'),
    );
    return () => subscription.remove();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(next);
      onIndexChange?.(next);
    },
    [onIndexChange],
  );

  const running =
    autoPlay &&
    !paused &&
    !dragging &&
    foreground &&
    data.length > 1 &&
    width > 0;

  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = setInterval(() => {
      setIndex(current => {
        const next = (current + 1) % data.length;
        listRef.current?.scrollToOffset({
          offset: next * width,
          animated: true,
        });
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [running, intervalMs, data.length, width, onIndexChange]);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    setDragging(false);
    if (width > 0) {
      goTo(Math.round(event.nativeEvent.contentOffset.x / width));
    }
  };

  const activeDot = activeDotIndex(index, data.length, maxDots);
  const dotCount = Math.min(data.length, maxDots);

  return (
    <View onLayout={onLayout} testID={testID}>
      {width > 0 ? (
        <FlatList
          ref={listRef}
          {...(testID && { testID: `${testID}-list` })}
          data={data}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={({ item, index: itemIndex }) => (
            <View style={{ width }}>
              {renderItem({ item, index: itemIndex, width })}
            </View>
          )}
          getItemLayout={(_, itemIndex) => ({
            length: width,
            offset: width * itemIndex,
            index: itemIndex,
          })}
          onScrollBeginDrag={() => setDragging(true)}
          onMomentumScrollEnd={onMomentumScrollEnd}
        />
      ) : null}
      {dotCount > 1 ? (
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={`${index + 1} / ${data.length}`}
        >
          {Array.from({ length: dotCount }, (_, dot) => (
            <View
              key={dot}
              testID={dot === activeDot ? 'carousel-dot-active' : undefined}
              style={[styles.dot, dot === activeDot && styles.activeDot]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
