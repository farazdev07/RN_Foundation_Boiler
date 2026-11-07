import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { bootsplashLogo, bootsplashManifest } from '@shared/assets';

// The handoff may add at most 500 ms to startup. Keep the total under that.
export const SPLASH_FADE_MS = 220;
export const SPLASH_SCALE_MS = 220;

type Props = {
  // True once the first real screen can be shown.
  ready: boolean;
};

// A JS copy of the native splash, drawn in the same place, so the native one
// can hide without a flash. It then fades and grows away to reveal the app.
export function AnimatedSplash({ ready }: Props) {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const { container, logo } = BootSplash.useHideAnimation({
    ready,
    manifest: bootsplashManifest,
    logo: bootsplashLogo,
    animate: () => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: SPLASH_SCALE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: SPLASH_FADE_MS,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    },
  });

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      testID="animated-splash"
      {...container}
      style={[container.style, { opacity }]}
      pointerEvents="none"
    >
      <Animated.Image
        {...logo}
        style={[logo.style, { transform: [{ scale }] }]}
      />
    </Animated.View>
  );
}
