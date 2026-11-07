import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { Text } from '../Text';
import { makeStyles } from '../theme';

type Mode = 'date' | 'time';

type Props = {
  value: Date | null;
  onChange: (value: Date) => void;
  mode?: Mode;
  label?: string;
  placeholder?: string;
  error?: string | undefined;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  doneLabel?: string;
  locale?: string;
  testID?: string;
};

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
  container: { gap: spacing.xs },
  field: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  invalid: { borderColor: colors.error },
  value: { flex: 1 },
  disabled: { opacity: 0.5 },
}));

const format = (value: Date, mode: Mode, locale?: string) =>
  new Intl.DateTimeFormat(
    locale,
    mode === 'date' ? { dateStyle: 'medium' } : { timeStyle: 'short' },
  ).format(value);

// Android shows the system dialog; iOS shows the native picker in a sheet with
// a Done button, because its inline picker has no dialog of its own.
export function DateTimeField({
  value,
  onChange,
  mode = 'date',
  label,
  placeholder = '',
  error,
  minimumDate,
  maximumDate,
  disabled = false,
  doneLabel = 'Done',
  locale,
  testID,
}: Props) {
  const styles = useStyles();
  const [draft, setDraft] = useState<Date | null>(null);
  const limits = {
    ...(minimumDate && { minimumDate }),
    ...(maximumDate && { maximumDate }),
  };

  const open = () => {
    const initial = value ?? new Date();
    if (Platform.OS === 'android') {
      // A dismissed dialog keeps the current value, so it needs no handler.
      DateTimePickerAndroid.open({
        value: initial,
        mode,
        ...limits,
        onValueChange: (_event, picked) => onChange(picked),
      });
    } else {
      setDraft(initial);
    }
  };

  const confirm = () => {
    if (draft) {
      onChange(draft);
    }
    setDraft(null);
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {label ? <Text variant="label">{label}</Text> : null}
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{
          text: value ? format(value, mode, locale) : placeholder,
        }}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={open}
        style={[styles.field, error !== undefined && styles.invalid]}
      >
        <Text
          style={styles.value}
          color={value ? 'textPrimary' : 'textSecondary'}
        >
          {value ? format(value, mode, locale) : placeholder}
        </Text>
        <Icon
          name={mode === 'date' ? 'calendar' : 'clock'}
          color="textSecondary"
        />
      </Pressable>
      {error ? (
        <Text variant="caption" color="error">
          {error}
        </Text>
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={draft !== null} onRequestClose={() => setDraft(null)}>
          {draft ? (
            <DateTimePicker
              testID={testID ? `${testID}-picker` : undefined}
              value={draft}
              mode={mode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              {...limits}
              {...(locale && { locale })}
              onValueChange={(_event, picked) => setDraft(picked)}
            />
          ) : null}
          <Button title={doneLabel} onPress={confirm} />
        </Modal>
      ) : null}
    </View>
  );
}
