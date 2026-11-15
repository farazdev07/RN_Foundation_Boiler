import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, TextInput as RNTextInput, View } from 'react-native';
import { Text } from '../Text';
import { makeStyles } from '../theme';
import { activeCell, sanitizeCode } from './otp';

type Props = {
  value: string;
  // Always digits only, never longer than `cellCount`.
  onChangeText: (code: string) => void;
  // Read by screen readers; the cells themselves are decoration.
  label: string;
  cellCount?: number;
  // Called once each time the last cell is filled.
  onComplete?: (code: string) => void;
  error?: string | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  testID?: string;
};

const useStyles = makeStyles(({ colors, radii, spacing, typography }) => ({
  container: { gap: spacing.xs },
  // Digits read left to right in every language.
  cells: { direction: 'ltr', flexDirection: 'row', gap: spacing.sm },
  cell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 56,
    minHeight: 56,
  },
  active: { borderColor: colors.primary, borderWidth: 2 },
  invalid: { borderColor: colors.error },
  disabled: { opacity: 0.5 },
  digit: { ...typography.title },
  // One real input lies over the cells, so the keyboard, paste and SMS
  // autofill all behave as they do for any text field.
  input: {
    bottom: 0,
    end: 0,
    opacity: 0,
    position: 'absolute',
    start: 0,
    top: 0,
  },
}));

export function OtpInput({
  value,
  onChangeText,
  label,
  cellCount = 6,
  onComplete,
  error,
  disabled = false,
  autoFocus = false,
  testID,
}: Props) {
  const styles = useStyles();
  const inputRef = useRef<ComponentRef<typeof RNTextInput>>(null);
  const [focused, setFocused] = useState(false);
  const current = activeCell(value, cellCount);

  const change = (text: string) => {
    const code = sanitizeCode(text, cellCount);
    if (code === value) {
      return;
    }
    onChangeText(code);
    if (code.length === cellCount) {
      onComplete?.(code);
    }
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        disabled={disabled}
        accessible={false}
      >
        <View
          style={styles.cells}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {Array.from({ length: cellCount }, (_, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                focused && index === current && styles.active,
                error !== undefined && styles.invalid,
              ]}
            >
              <Text style={styles.digit}>{value[index] ?? ''}</Text>
            </View>
          ))}
        </View>
        <RNTextInput
          ref={inputRef}
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={change}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={cellCount}
          caretHidden
          style={styles.input}
        />
      </Pressable>
      {error ? (
        <Text variant="caption" color="error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
