import { useMemo, useState } from 'react';
import { FlatList, Pressable } from 'react-native';
import { Modal } from '../Modal';
import { Text } from '../Text';
import { TextInput } from '../TextInput';
import { makeStyles } from '../theme';
import {
  formatAsYouType,
  listCountries,
  matchesCountry,
  toPhoneValue,
  type CountryCode,
  type PhoneValue,
} from './phone';

type Props = {
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  label?: string;
  error?: string | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  chooseCountryLabel?: string;
  disabled?: boolean;
  locale?: string;
  testID?: string;
};

const useStyles = makeStyles(({ spacing }) => ({
  country: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingEnd: spacing.xs,
  },
  list: { maxHeight: 360 },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
  },
  optionName: { flex: 1 },
}));

export const emptyPhone = (country: CountryCode): PhoneValue =>
  toPhoneValue('', country);

export function PhoneInput({
  value,
  onChange,
  label,
  error,
  placeholder,
  searchPlaceholder = 'Search country or code',
  chooseCountryLabel = 'Choose country',
  disabled = false,
  locale,
  testID,
}: Props) {
  const styles = useStyles();
  const countries = useMemo(() => listCountries(locale), [locale]);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const selected = countries.find(country => country.code === value.country);
  const shown = useMemo(
    () => countries.filter(country => matchesCountry(country, query)),
    [countries, query],
  );

  const choose = (code: CountryCode) => {
    onChange(toPhoneValue(value.text, code));
    setPicking(false);
    setQuery('');
  };

  return (
    <>
      <TextInput
        {...(testID && { testID })}
        {...(label !== undefined && { label })}
        {...(placeholder !== undefined && { placeholder })}
        error={error}
        value={value.text}
        disabled={disabled}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        onChangeText={text => onChange(toPhoneValue(text, value.country))}
        onBlur={() =>
          onChange(
            toPhoneValue(
              formatAsYouType(value.text, value.country),
              value.country,
            ),
          )
        }
        start={
          <Pressable
            {...(testID && { testID: `${testID}-country` })}
            accessibilityRole="button"
            accessibilityLabel={`${chooseCountryLabel}, ${selected?.name ?? value.country}`}
            disabled={disabled}
            onPress={() => setPicking(true)}
            style={styles.country}
            hitSlop={8}
          >
            <Text>{selected?.flag}</Text>
            <Text color="textSecondary">{`+${selected?.callingCode ?? ''}`}</Text>
          </Pressable>
        }
      />
      <Modal visible={picking} onRequestClose={() => setPicking(false)}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <FlatList
          style={styles.list}
          data={shown}
          keyExtractor={country => country.code}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          renderItem={({ item }) => (
            <Pressable
              testID={`country-${item.code}`}
              accessibilityRole="button"
              accessibilityState={{ selected: item.code === value.country }}
              onPress={() => choose(item.code)}
              style={styles.option}
            >
              <Text>{item.flag}</Text>
              <Text style={styles.optionName}>{item.name}</Text>
              <Text color="textSecondary">{`+${item.callingCode}`}</Text>
            </Pressable>
          )}
        />
      </Modal>
    </>
  );
}
