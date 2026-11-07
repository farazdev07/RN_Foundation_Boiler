import { Pressable, View } from 'react-native';
import { Text } from '../Text';
import { makeStyles } from '../theme';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

const useStyles = makeStyles(({ colors, spacing }) => ({
  group: { gap: spacing.xs },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
  },
  ring: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  ringSelected: { borderColor: colors.primary },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
}));

// The group owns the selection, so exactly one option can be chosen.
export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  const styles = useStyles();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.group}
    >
      <Text variant="label">{label}</Text>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            testID={`radio-${option.value}`}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(option.value)}
            style={styles.row}
          >
            <View style={[styles.ring, selected && styles.ringSelected]}>
              {selected ? <View style={styles.dot} /> : null}
            </View>
            <Text>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
