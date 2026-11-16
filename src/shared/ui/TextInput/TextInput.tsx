import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  TextInput as RNTextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTranslation } from '@shared/lib/i18n';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { makeStyles, useTheme } from '../theme';

export type Props = Omit<TextInputProps, 'style' | 'editable'> & {
  ref?: Ref<ComponentRef<typeof RNTextInput>>;
  label?: string;
  // Forms usually compute this, so undefined is accepted as "no error".
  error?: string | undefined;
  disabled?: boolean;
  start?: ReactNode;
  end?: ReactNode;
  // For multi-line fields: drops outer whitespace when focus leaves.
  trimOnBlur?: boolean;
};

const useStyles = makeStyles(({ colors, radii, spacing, typography }) => ({
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
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.error },
  disabled: { opacity: 0.5 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: spacing.sm,
    textAlign: 'auto',
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
}));

export function TextInput({
  label,
  error,
  disabled = false,
  start,
  end,
  secureTextEntry,
  trimOnBlur = false,
  multiline,
  onBlur,
  onFocus,
  onChangeText,
  value,
  ref,
  ...rest
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.focused,
          error !== undefined && styles.invalid,
          disabled && styles.disabled,
        ]}
      >
        {start}
        <RNTextInput
          ref={ref}
          accessibilityLabel={label}
          // Read with the field, so a screen reader user on the input hears
          // what is wrong without hunting for the text below it.
          {...(error && { accessibilityHint: error })}
          editable={!disabled}
          multiline={multiline}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry === true && !revealed}
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            if (trimOnBlur && value !== undefined && value !== value.trim()) {
              onChangeText?.(value.trim());
            }
            onBlur?.(event);
          }}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(revealed ? 'hidePassword' : 'showPassword')}
            hitSlop={8}
            onPress={() => setRevealed(current => !current)}
          >
            <Icon
              name={revealed ? 'eye-off' : 'eye'}
              size={20}
              color="textSecondary"
            />
          </Pressable>
        ) : (
          end
        )}
      </View>
      {error ? (
        <Text variant="caption" color="error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
