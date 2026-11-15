import {
  Image as RNImage,
  type ImageRequireSource,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import TurboImage from 'react-native-turbo-image';
import { useTheme } from '../theme';

type Props = {
  // A remote image by URL, or a bundled one from require().
  source: { uri: string } | ImageRequireSource;
  // Layout styles: size, radius, margins. Shared by both kinds of source.
  style?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  accessibilityLabel?: string;
  testID?: string;
};

const FADE_MS = 200;

// The only file that knows which image library the app uses (see ADR 0011).
// Remote images are cached on disk and in memory; bundled ones need neither.
// To change library, change this file: the props above are the contract.
export function Image({
  source,
  style,
  resizeMode = 'cover',
  accessibilityLabel,
  testID,
}: Props) {
  const { colors } = useTheme();
  const placeholder = { backgroundColor: colors.surfaceMuted };
  const accessibility = {
    accessible: accessibilityLabel !== undefined,
    ...(accessibilityLabel !== undefined && { accessibilityLabel }),
    ...(testID !== undefined && { testID }),
  };

  if (typeof source === 'number') {
    return (
      <RNImage
        source={source}
        resizeMode={resizeMode}
        style={[placeholder, style as StyleProp<ImageStyle>]}
        {...accessibility}
      />
    );
  }

  return (
    <TurboImage
      source={source}
      resizeMode={resizeMode}
      fadeDuration={FADE_MS}
      style={[placeholder, style]}
      {...accessibility}
    />
  );
}
