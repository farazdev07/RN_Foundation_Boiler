import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import {
  countryNamer,
  flagEmoji,
  formatAsYouType,
  listCountries,
  matchesCountry,
  toPhoneValue,
} from './phone';
import { emptyPhone, PhoneInput, type PhoneValue } from './index';

describe('phone helpers', () => {
  it('turns a region code into its flag', () => {
    expect(flagEmoji('PK')).toBe('🇵🇰');
    expect(flagEmoji('gb')).toBe('🇬🇧');
  });

  it('names countries with Intl, then the bundled table, then the code', () => {
    const name = countryNamer('en');
    expect(name('PK')).toBe('Pakistan');

    const intl = Intl as { DisplayNames?: unknown };
    const original = intl.DisplayNames;
    intl.DisplayNames = undefined;
    try {
      // Hermes has no Intl.DisplayNames.
      expect(countryNamer('en')('PK')).toBe('Pakistan');
      expect(countryNamer('en')('ZZ')).toBe('ZZ');
    } finally {
      intl.DisplayNames = original;
    }
  });

  it('lists every country, sorted by name, with its calling code', () => {
    const countries = listCountries('en');
    const pakistan = countries.find(country => country.code === 'PK');

    expect(countries.length).toBeGreaterThan(200);
    expect(pakistan).toMatchObject({ callingCode: '92', name: 'Pakistan' });
    const names = countries.map(country => country.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it('searches by name, code or calling code', () => {
    const pakistan = listCountries('en').find(c => c.code === 'PK')!;

    expect(matchesCountry(pakistan, 'paki')).toBe(true);
    expect(matchesCountry(pakistan, 'pk')).toBe(true);
    expect(matchesCountry(pakistan, '+92')).toBe(true);
    expect(matchesCountry(pakistan, 'france')).toBe(false);
  });

  it('parses a national number to E.164 and checks its length', () => {
    expect(toPhoneValue('0301 2345678', 'PK')).toEqual({
      text: '0301 2345678',
      country: 'PK',
      e164: '+923012345678',
      valid: true,
    });
    expect(toPhoneValue('0301', 'PK').valid).toBe(false);
    expect(toPhoneValue('', 'PK').e164).toBeNull();
  });

  it('formats for the chosen country', () => {
    expect(formatAsYouType('2015550123', 'US')).toBe('(201) 555-0123');
  });
});

function Harness({ onValue }: { onValue: (value: PhoneValue) => void }) {
  const [value, setValue] = useState(emptyPhone('PK'));
  return (
    <PhoneInput
      testID="phone"
      label="Phone"
      value={value}
      locale="en"
      onChange={next => {
        setValue(next);
        onValue(next);
      }}
    />
  );
}

describe('PhoneInput', () => {
  it('reports the parsed value as the user types and formats on blur', async () => {
    const onValue = jest.fn();
    await renderWithTheme(<Harness onValue={onValue} />);

    await fireEvent.changeText(screen.getByTestId('phone'), '03012345678');
    expect(onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({ e164: '+923012345678', valid: true }),
    );

    await fireEvent(screen.getByTestId('phone'), 'blur');
    expect(screen.getByDisplayValue('0301 2345678')).toBeOnTheScreen();
  });

  it('changes country from the searchable list and re-reads the number', async () => {
    const onValue = jest.fn();
    await renderWithTheme(<Harness onValue={onValue} />);
    await fireEvent.changeText(screen.getByTestId('phone'), '2015550123');

    await fireEvent.press(screen.getByTestId('phone-country'));
    await fireEvent.changeText(
      screen.getByPlaceholderText('Search country or code'),
      'united states',
    );
    await fireEvent.press(screen.getByTestId('country-US'));

    expect(onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({
        country: 'US',
        e164: '+12015550123',
        valid: true,
      }),
    );
    expect(screen.getByText('+1')).toBeOnTheScreen();
  });
});
