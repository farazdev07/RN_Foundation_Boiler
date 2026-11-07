import { Pressable, View, type PressableProps } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { Spinner } from '../Spinner';
import { Text } from '../Text';
import { makeStyles, type ColorTokens } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = Omit<PressableProps, 'children' | 'disabled' | 'style'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
};

const foreground: Record<Variant, keyof ColorTokens> = {
  primary: 'textOnPrimary',
  secondary: 'primary',
  ghost: 'primary',
  destructive: 'textOnPrimary',
};

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
  base: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderColor: colors.primary },
  ghost: {},
  destructive: { backgroundColor: colors.error },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  hidden: { opacity: 0 },
  overlay: { position: 'absolute' },
}));

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  ...rest
}: Props) {
  const styles = useStyles();
  const inactive = disabled || loading;
  const color = foreground[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        inactive && styles.disabled,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      {/* The label stays in the layout so the button keeps its width. */}
      <View style={[styles.base, loading && styles.hidden]}>
        {icon ? <Icon name={icon} size={20} color={color} /> : null}
        <Text variant="label" color={color}>
          {title}
        </Text>
      </View>
      {loading ? (
        <View style={styles.overlay}>
          <Spinner color={color} />
        </View>
      ) : null}
    </Pressable>
  );
}
