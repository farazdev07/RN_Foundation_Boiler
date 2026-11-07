import { Text as RNText, type TextProps } from 'react-native';
import { useTheme, type ColorTokens, type TypographyVariant } from '../theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ColorTokens;
  align?: 'auto' | 'center' | 'left' | 'right';
};

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align = 'auto',
  style,
  ...rest
}: Props) {
  const { colors, typography } = useTheme();

  return (
    <RNText
      style={[
        typography[variant],
        { color: colors[color], textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}
