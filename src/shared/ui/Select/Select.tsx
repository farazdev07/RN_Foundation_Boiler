import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useTranslation } from '@shared/lib/i18n';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { Text } from '../Text';
import { TextInput } from '../TextInput';
import { makeStyles } from '../theme';

export type SelectOption<T extends string> = { value: T; label: string };

type Common<T extends string> = {
  label: string;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  // Forms usually compute this, so undefined is accepted as "no error".
  error?: string | undefined;
  disabled?: boolean;
  testID?: string;
};

type Props<T extends string> = Common<T> &
  (
    | { multiple?: false; value: T | null; onChange: (value: T) => void }
    | { multiple: true; value: readonly T[]; onChange: (value: T[]) => void }
  );

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
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
  disabled: { opacity: 0.5 },
  value: { flex: 1 },
  list: { maxHeight: 320 },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
}));

export function Select<T extends string>(props: Props<T>) {
  const {
    label,
    options,
    placeholder,
    searchable = false,
    error,
    disabled = false,
    testID,
  } = props;
  const styles = useStyles();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected: readonly T[] = props.multiple
    ? props.value
    : props.value === null
      ? []
      : [props.value];

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? options.filter(option => option.label.toLowerCase().includes(term))
      : options;
  }, [options, query]);

  const summary =
    options
      .filter(option => selected.includes(option.value))
      .map(option => option.label)
      .join(', ') ||
    (placeholder ?? t('select'));

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (value: T) => {
    if (props.multiple) {
      props.onChange(
        selected.includes(value)
          ? selected.filter(item => item !== value)
          : [...selected, value],
      );
      return;
    }
    props.onChange(value);
    close();
  };

  return (
    <View>
      <Text variant="label">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: summary }}
        {...(error && { accessibilityHint: error })}
        testID={testID}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          error !== undefined && styles.invalid,
          disabled && styles.disabled,
        ]}
      >
        <Text
          style={styles.value}
          color={selected.length ? 'textPrimary' : 'textSecondary'}
          numberOfLines={1}
        >
          {summary}
        </Text>
        <Icon name="chevron-down" size={20} color="textSecondary" />
      </Pressable>
      {error ? (
        <Text variant="caption" color="error">
          {error}
        </Text>
      ) : null}
      <Modal visible={open} onRequestClose={close}>
        <Text variant="subtitle">{label}</Text>
        {searchable ? (
          <TextInput
            label={t('search')}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        ) : null}
        <FlatList
          style={styles.list}
          data={visible}
          keyExtractor={option => option.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.value);
            return (
              <Pressable
                accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
                accessibilityLabel={item.label}
                accessibilityState={{
                  checked: isSelected,
                  selected: isSelected,
                }}
                onPress={() => choose(item.value)}
                {...(testID && { testID: `${testID}-${item.value}` })}
                style={styles.option}
              >
                <Text>{item.label}</Text>
                {isSelected ? (
                  <Icon name="check" size={20} color="primary" />
                ) : null}
              </Pressable>
            );
          }}
        />
        {props.multiple ? <Button title={t('done')} onPress={close} /> : null}
      </Modal>
    </View>
  );
}
