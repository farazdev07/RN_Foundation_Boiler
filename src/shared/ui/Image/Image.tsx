import { Image as RNImage, type ImageProps } from 'react-native';
import { useTheme } from '../theme';

// The one place to swap in an image-cache library when an app needs it.
export function Image({ style, ...rest }: ImageProps) {
  const { colors } = useTheme();

  return (
    <RNImage
      style={[{ backgroundColor: colors.surfaceMuted }, style]}
      {...rest}
    />
  );
}
