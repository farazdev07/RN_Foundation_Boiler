import { Pressable, View } from 'react-native';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { makeStyles } from '../theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
  },
  box: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.5 },
}));

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
}: Props) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={[styles.box, checked && styles.checked]}>
        {checked ? <Icon name="check" size={16} color="textOnPrimary" /> : null}
      </View>
      <Text>{label}</Text>
    </Pressable>
  );
}
