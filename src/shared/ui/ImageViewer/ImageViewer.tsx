import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { ZoomableImage } from './ZoomableImage';
import { DISMISS_DISTANCE } from './zoomMath';

type Props = {
  images: readonly ImageSourcePropType[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
  closeLabel?: string;
};

// Full screen on purpose, so it uses its own native modal rather than the
// card-style Modal. Gesture Handler needs a root view inside every modal.
export function ImageViewer({
  images,
  visible,
  onClose,
  initialIndex = 0,
  closeLabel = 'Close',
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const dismissY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setZoomed(false);
      dismissY.value = 0;
    }
  }, [visible, initialIndex, dismissY]);

  const backdrop = useAnimatedStyle(() => ({
    opacity: interpolate(
      dismissY.value,
      [0, DISMISS_DISTANCE * 2],
      [1, 0.3],
      'clamp',
    ),
  }));

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        {/* Always black, in light and dark mode, like the system photo viewers. */}
        <Animated.View style={[styles.backdrop, backdrop]} />
        <FlatList
          testID="image-viewer-pager"
          data={images}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, itemIndex) => ({
            length: width,
            offset: width * itemIndex,
            index: itemIndex,
          })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, itemIndex) => String(itemIndex)}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item }) => (
            <ZoomableImage
              source={item}
              width={width}
              height={height}
              dismissY={dismissY}
              onZoomChange={setZoomed}
              onDismiss={onClose}
            />
          )}
        />
        <View
          style={[styles.bar, { top: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <Text style={styles.counter}>
            {images.length > 1 ? `${index + 1} / ${images.length}` : ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            hitSlop={12}
            onPress={onClose}
            style={styles.close}
          >
            <Icon name="x" size={24} color="textOnPrimary" />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#000000' },
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
  },
  counter: { color: '#FFFFFF' },
  close: { padding: 4 },
});
