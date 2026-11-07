import {
  Lucide,
  type LucideIconName,
} from '@react-native-vector-icons/lucide/static';
import { useTheme, type ColorTokens } from '../theme';

export type IconName = LucideIconName;

type Props = {
  name: IconName;
  size?: number;
  color?: keyof ColorTokens;
  accessibilityLabel?: string;
};

export function Icon({
  name,
  size = 24,
  color = 'textPrimary',
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();

  return (
    <Lucide
      name={name}
      size={size}
      color={colors[color]}
      accessible={Boolean(accessibilityLabel)}
      {...(accessibilityLabel && { accessibilityLabel })}
    />
  );
}
